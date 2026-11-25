import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    sources = new Map<string, { data?: { features?: Array<{ properties?: { id?: string } }> }; setData: ReturnType<typeof vi.fn> }>();

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
    addSource = vi.fn((id: string, spec: { data?: { features?: Array<{ properties?: { id?: string } }> } }) => {
      const entry = {
        data: spec.data,
        setData: vi.fn((nextData: { features?: Array<{ properties?: { id?: string } }> }) => {
          entry.data = nextData;
        }),
      };
      this.sources.set(id, entry);
      return this;
    });
    getSource = vi.fn((id: string) => this.sources.get(id));
    addLayer = vi.fn();
    getLayer = vi.fn(() => ({ id: "locais-unclustered-point" }));
    setStyle = vi.fn();
    queryRenderedFeatures = () => {
      const sourceData = this.sources.get("tecendo-locais")?.data;
      const activeIds = new Set(
        (sourceData?.features ?? [])
          .map((feature) => feature.properties?.id)
          .filter((id): id is string => typeof id === "string"),
      );
      if (activeIds.size === 0 && sourceData) {
        return [];
      }
      return activeIds.size > 0
        ? this.unclusteredFeatures.filter((feature) =>
            activeIds.has((feature.properties as { id?: string })?.id ?? ""),
          )
        : this.unclusteredFeatures;
    };
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
});

const MULTI_PLACES: Local[] = [
  ...SAMPLE_PLACES,
  {
    id: "cram-protecao",
    nome: "Centro de Referência de Atendimento à Mulher (CRAM)",
    categoria: "protecao-apoio",
    descricaoCurta: "Acolhimento psicossocial e orientação jurídica.",
    distrito: "Sede",
    endereco: "Rua Pedro Firmino, 88",
    coordinates: [-36.4292, -8.3298],
    verificado: true,
  },
  {
    id: "casa-artesas-agua-fria",
    nome: "Casa das Artesãs de Água Fria",
    categoria: "artesanato",
    descricaoCurta: "Associação de bordado manual e cerâmica.",
    distrito: "Água Fria",
    endereco: "Rua da Matriz, 32",
    coordinates: [-36.3554, -8.3852],
    verificado: true,
  },
];

describe("MapShell search, category filters, and accessible list view", () => {
  it("synchronizes accent-insensitive search and multi-select category filters across map markers and list view", async () => {
    const user = userEvent.setup();
    render(<MapShell places={MULTI_PLACES} />);

    const map = mapInstances[0];
    map.unclusteredFeatures = MULTI_PLACES.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.coordinates },
      properties: { id: place.id },
    }));
    map.emit("load");

    expect(await screen.findByTestId("map-marker-ubs-centro")).toBeInTheDocument();
    expect(screen.getByTestId("map-marker-cram-protecao")).toBeInTheDocument();
    expect(screen.getByTestId("map-marker-casa-artesas-agua-fria")).toBeInTheDocument();

    // Multi-select categories: Saúde + Artesanato
    await user.click(screen.getByRole("button", { name: "Saúde" }));
    await user.click(screen.getByRole("button", { name: "Artesanato" }));

    expect(screen.getByRole("button", { name: "Saúde" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Artesanato" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      expect(screen.getByTestId("map-marker-ubs-centro")).toBeInTheDocument();
      expect(screen.getByTestId("map-marker-casa-artesas-agua-fria")).toBeInTheDocument();
      expect(screen.queryByTestId("map-marker-cram-protecao")).not.toBeInTheDocument();
    });

    // Accent- and case-insensitive search narrows both map markers and list view
    const searchInput = screen.getByRole("searchbox", { name: /buscar locais por nome/i });
    await user.type(searchInput, "agua fria");

    await waitFor(() => {
      expect(screen.getByTestId("map-marker-casa-artesas-agua-fria")).toBeInTheDocument();
      expect(screen.queryByTestId("map-marker-ubs-centro")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /visão em lista/i }));
    const list = screen.getByRole("list", { name: /lista de locais/i });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Casa das Artesãs de Água Fria");
  });

  it("opens the same selectedPlace preview from keyboard navigation in List View and resets empty state via Limpar filtros", async () => {
    const user = userEvent.setup();
    render(
      <MapShell
        places={MULTI_PLACES}
        renderPlaceDetailsSlot={({ selectedPlace }) =>
          selectedPlace ? <div data-testid="selected-place">{selectedPlace.nome}</div> : null
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: /visão em lista/i }));

    const detailButton = screen.getByRole("button", {
      name: /ver detalhes de Casa das Artesãs de Água Fria/i,
    });
    detailButton.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("selected-place")).toHaveTextContent(
      "Casa das Artesãs de Água Fria",
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("selected-place")).not.toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", { name: /buscar locais por nome/i });
    await user.type(searchInput, "termo-sem-resultados");

    expect(screen.getByText(/nenhum local encontrado/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /limpar filtros/i }));

    const list = screen.getByRole("list", { name: /lista de locais/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("performs zero network requests, zero storage reads/writes, and zero URL mutations during search and filtering", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const xhrOpenSpy = vi.spyOn(window.XMLHttpRequest.prototype, "open");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const initialHref = window.location.href;

    render(<MapShell places={MULTI_PLACES} />);

    const searchInput = screen.getByRole("searchbox", { name: /buscar locais por nome/i });
    await user.type(searchInput, "Saude");
    await user.click(screen.getByRole("button", { name: "Saúde" }));
    await user.click(screen.getByRole("button", { name: /visão em lista/i }));
    await user.click(screen.getByRole("button", { name: /limpar busca/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpenSpy).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(getItemSpy).not.toHaveBeenCalled();
    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe(initialHref);
  });
});
