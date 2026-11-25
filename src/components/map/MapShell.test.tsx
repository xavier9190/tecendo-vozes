import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/data/schema";

const { mapInstances, MockMap, MockMarker } = vi.hoisted(() => {
  type Handler = (event?: unknown) => void;
  const instances: InstanceType<typeof HoistedMockMap>[] = [];

  class HoistedMockMarker {
    element: HTMLElement;
    constructor(options?: { element?: HTMLElement }) {
      this.element = options?.element ?? document.createElement("div");
    }
    getElement() {
      return this.element;
    }
    setLngLat() {
      return this;
    }
    addTo(map: HoistedMockMap) {
      map.getContainer().appendChild(this.element);
      return this;
    }
    remove() {
      this.element.remove();
    }
  }

  class HoistedMockMap {
    container: HTMLElement;
    listeners = new Map<string, Set<Handler>>();
    center: [number, number] = [-36.424, -8.3358];
    unclusteredFeatures: Array<Record<string, unknown>> = [];

    constructor(options: { container: HTMLElement }) {
      this.container = options.container;
      instances.push(this);
    }
    getContainer() {
      return this.container;
    }
    on(event: string, layerOrHandler: string | Handler, maybeHandler?: Handler) {
      if (typeof layerOrHandler === "function") {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(layerOrHandler);
      }
      void maybeHandler;
      return this;
    }
    off(event: string, handler: Handler) {
      this.listeners.get(event)?.delete(handler);
      return this;
    }
    emit(event: string, payload?: unknown) {
      for (const handler of this.listeners.get(event) ?? []) {
        handler(payload);
      }
    }
    addSource = vi.fn();
    getSource = vi.fn();
    addLayer = vi.fn();
    getLayer = vi.fn(() => ({ id: "locais-unclustered-point" }));
    setStyle = vi.fn();
    queryRenderedFeatures = () => this.unclusteredFeatures;
    easeTo = vi.fn();
    getCenter = () => ({ lng: this.center[0], lat: this.center[1] });
    getZoom = () => 13;
    getBounds = () => ({
      getWest: () => -36.62,
      getSouth: () => -8.52,
      getEast: () => -36.22,
      getNorth: () => -8.15,
    });
    getCanvas = () => ({ style: { cursor: "" } });
    remove = vi.fn();
  }

  return {
    mapInstances: instances,
    MockMap: HoistedMockMap,
    MockMarker: HoistedMockMarker,
  };
});

vi.mock("maplibre-gl", () => ({
  default: {
    Map: MockMap,
    Marker: MockMarker,
    addProtocol: vi.fn(),
  },
  Map: MockMap,
  Marker: MockMarker,
  addProtocol: vi.fn(),
}));

vi.mock("pmtiles", () => ({
  Protocol: class MockProtocol {
    tile = vi.fn();
  },
}));

import { MapShell } from "./MapShell";

const SAMPLE_PLACES: Local[] = [
  {
    id: "ubs-centro",
    nome: "UBS Centro — Saúde da Mulher",
    categoria: "saude",
    descricaoCurta: "Atendimento de saúde integral da mulher.",
    distrito: "Sede",
    endereco: "Rua Coronel Antônio Marinho, 145",
    coordinates: [-36.424, -8.3358],
    verificado: true,
  },
];

beforeEach(() => {
  mapInstances.length = 0;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MapShell integration", () => {
  it("synchronizes map viewport movements with PernambucoMiniMap", async () => {
    render(<MapShell places={SAMPLE_PLACES} />);
    const map = mapInstances[0];
    map.emit("load");

    const initialDot = screen.getByTestId("minimap-marker-dot");
    const initialCx = Number(initialDot.getAttribute("cx"));

    map.center = [-36.35, -8.25];
    map.emit("moveend");

    await waitFor(() => {
      const updatedDot = screen.getByTestId("minimap-marker-dot");
      expect(Number(updatedDot.getAttribute("cx"))).toBeGreaterThan(initialCx);
    });
  });

  it("tracks selectedPlace for slot consumers and clears selection on Escape", async () => {
    render(
      <MapShell
        places={SAMPLE_PLACES}
        renderPlaceDetailsSlot={({ selectedPlace }) =>
          selectedPlace ? <div data-testid="selected-place">{selectedPlace.nome}</div> : null
        }
      />,
    );

    const map = mapInstances[0];
    map.unclusteredFeatures = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: SAMPLE_PLACES[0].coordinates },
        properties: { id: SAMPLE_PLACES[0].id },
      },
    ];
    map.emit("load");

    const marker = await screen.findByTestId("map-marker-ubs-centro");
    fireEvent.click(marker);

    expect(screen.getByTestId("selected-place")).toHaveTextContent(
      "UBS Centro — Saúde da Mulher",
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("selected-place")).not.toBeInTheDocument();
  });

  it("renders default #7 ThreeDotsMenu and EmergencyBar, blurring map when menu opens and closing on Escape", () => {
    render(<MapShell places={SAMPLE_PLACES} />);

    const trigger = screen.getByRole("button", {
      name: "Abrir menu de informações e denúncia",
    });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByTestId("emergency-bar")).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sobre nós/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /denuncie/i })).toBeInTheDocument();

    const mapCanvasWrapper = screen.getByTestId("belo-jardim-map-canvas").parentElement
      ?.parentElement;
    expect(mapCanvasWrapper?.className).toContain("blur-sm");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows MapOfflineFallback on map error and switches MapShell to list view when requested", async () => {
    render(<MapShell places={SAMPLE_PLACES} />);
    const map = mapInstances[0];
    map.emit("error", { error: new Error("Sem conexão") });

    const fallback = await screen.findByTestId("map-offline-fallback");
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent("Sem conexão");

    const switchBtn = screen.getByRole("button", { name: /visão em lista/i });
    fireEvent.click(switchBtn);

    expect(screen.getByRole("main")).toHaveAttribute("data-view-mode", "list");
    expect(screen.queryByTestId("map-offline-fallback")).not.toBeInTheDocument();
    expect(screen.getByTestId("emergency-bar")).toBeInTheDocument();
  });

  it("honors a custom renderEmergencyMenuSlot when provided", () => {
    render(
      <MapShell
        places={SAMPLE_PLACES}
        renderEmergencyMenuSlot={() => <div data-testid="custom-slot-7">Custom</div>}
      />,
    );

    expect(screen.getByTestId("custom-slot-7")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu de informações e denúncia" }),
    ).not.toBeInTheDocument();
  });
});
