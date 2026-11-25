import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/data/schema";
import {
  BELO_JARDIM_BOUNDS,
  BELO_JARDIM_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/lib/geo/belo-jardim";

const { mapInstances, markerInstances, MockMap, MockMarker } = vi.hoisted(() => {
  type MapEventHandler = (event?: unknown) => void;
  const DEFAULT_ZOOM_VAL = 13;
  const CENTER_VAL: [number, number] = [-36.424, -8.3358];
  const BOUNDS_VAL: [[number, number], [number, number]] = [
    [-36.62, -8.52],
    [-36.22, -8.15],
  ];

  const instances: InstanceType<typeof HoistedMockMap>[] = [];
  const markers: InstanceType<typeof HoistedMockMarker>[] = [];

  class HoistedMockMarker {
    element: HTMLElement;
    lngLat: [number, number] | null = null;
    removed = false;

    constructor(options?: { element?: HTMLElement }) {
      this.element = options?.element ?? document.createElement("div");
      markers.push(this);
    }

    getElement() {
      return this.element;
    }

    setLngLat(coords: [number, number]) {
      this.lngLat = coords;
      return this;
    }

    addTo(map: HoistedMockMap) {
      map.getContainer().appendChild(this.element);
      return this;
    }

    remove() {
      this.removed = true;
      this.element.remove();
    }
  }

  class HoistedMockMap {
    options: Record<string, unknown>;
    container: HTMLElement;
    listeners = new Map<string, Set<MapEventHandler>>();
    layerListeners = new Map<string, Map<string, Set<MapEventHandler>>>();
    sources = new Map<string, Record<string, unknown>>();
    layers = new Map<string, Record<string, unknown>>();
    currentStyle: Record<string, unknown> | undefined;
    easeToCalls: Array<Record<string, unknown>> = [];
    setStyleCalls: unknown[] = [];
    unclusteredFeatures: Array<Record<string, unknown>> = [];
    zoom = DEFAULT_ZOOM_VAL;
    center: [number, number] = [...CENTER_VAL];

    constructor(options: Record<string, unknown>) {
      this.options = options;
      this.container = options.container as HTMLElement;
      this.currentStyle = options.style as Record<string, unknown> | undefined;
      instances.push(this);
    }

    getContainer() {
      return this.container;
    }

    on(event: string, layerOrHandler: string | MapEventHandler, maybeHandler?: MapEventHandler) {
      if (typeof layerOrHandler === "string" && maybeHandler) {
        if (!this.layerListeners.has(layerOrHandler)) {
          this.layerListeners.set(layerOrHandler, new Map());
        }
        const eventMap = this.layerListeners.get(layerOrHandler)!;
        if (!eventMap.has(event)) {
          eventMap.set(event, new Set());
        }
        eventMap.get(event)!.add(maybeHandler);
        return this;
      }

      if (typeof layerOrHandler === "function") {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(layerOrHandler);
      }
      return this;
    }

    off(event: string, handler: MapEventHandler) {
      this.listeners.get(event)?.delete(handler);
      return this;
    }

    emit(event: string, payload?: unknown) {
      for (const handler of this.listeners.get(event) ?? []) {
        handler(payload);
      }
    }

    emitLayer(layerId: string, event: string, payload?: unknown) {
      for (const handler of this.layerListeners.get(layerId)?.get(event) ?? []) {
        handler(payload);
      }
    }

    addSource(id: string, source: Record<string, unknown>) {
      const wrapped: Record<string, unknown> = {
        ...source,
        setData: vi.fn((nextData: unknown) => {
          wrapped.data = nextData;
        }),
        getClusterExpansionZoom: vi.fn().mockResolvedValue(15),
      };
      this.sources.set(id, wrapped);
    }

    getSource(id: string) {
      return this.sources.get(id);
    }

    addLayer(layer: Record<string, unknown>) {
      this.layers.set(String(layer.id), layer);
    }

    getLayer(id: string) {
      return this.layers.get(id);
    }

    getStyle() {
      return this.currentStyle;
    }

    setStyle(style: unknown) {
      this.currentStyle = style as Record<string, unknown> | undefined;
      this.setStyleCalls.push(style);
      this.sources.clear();
      this.layers.clear();
      this.emit("style.load");
    }

    queryRenderedFeatures() {
      return this.unclusteredFeatures;
    }

    easeTo(options: Record<string, unknown>) {
      this.easeToCalls.push(options);
      if (Array.isArray(options.center)) {
        this.center = [Number(options.center[0]), Number(options.center[1])];
      }
      if (typeof options.zoom === "number") {
        this.zoom = options.zoom;
      }
      this.emit("moveend");
    }

    getCenter() {
      return { lng: this.center[0], lat: this.center[1] };
    }

    getZoom() {
      return this.zoom;
    }

    getBounds() {
      return {
        getWest: () => BOUNDS_VAL[0][0],
        getSouth: () => BOUNDS_VAL[0][1],
        getEast: () => BOUNDS_VAL[1][0],
        getNorth: () => BOUNDS_VAL[1][1],
      };
    }

    getCanvas() {
      return { style: { cursor: "" } };
    }

    remove() {
      this.listeners.clear();
      this.layerListeners.clear();
    }
  }

  return {
    mapInstances: instances,
    markerInstances: markers,
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

import { BeloJardimMap } from "./BeloJardimMap";

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
  {
    id: "casa-artesas",
    nome: "Casa das Artesãs de Água Fria",
    categoria: "artesanato",
    descricaoCurta: "Bordado e cerâmica comunitária.",
    distrito: "Água Fria",
    endereco: "Rua da Matriz, 32",
    coordinates: [-36.3554, -8.3852],
    verificado: true,
  },
];

beforeEach(() => {
  mapInstances.length = 0;
  markerInstances.length = 0;
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BeloJardimMap", () => {
  it("initializes MapLibre strictly bounded to Belo Jardim and renders OpenStreetMap attribution", () => {
    render(<BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} />);

    expect(mapInstances).toHaveLength(1);
    const map = mapInstances[0];
    expect(map.options.center).toEqual([...BELO_JARDIM_CENTER]);
    expect(map.options.zoom).toBe(DEFAULT_ZOOM);
    expect(map.options.minZoom).toBe(MIN_ZOOM);
    expect(map.options.maxZoom).toBe(MAX_ZOOM);
    expect(map.options.maxBounds).toEqual([
      [...BELO_JARDIM_BOUNDS[0]],
      [...BELO_JARDIM_BOUNDS[1]],
    ]);
    expect(map.options.attributionControl).toBe(false);

    expect(screen.getByText(/© OpenStreetMap contributors/i)).toBeInTheDocument();
  });

  it("configures clustered GeoJSON source, expands clusters on click, and triggers onSelectPlace from category markers", async () => {
    const onSelectPlace = vi.fn();
    render(<BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={onSelectPlace} />);

    const map = mapInstances[0];
    map.unclusteredFeatures = SAMPLE_PLACES.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.coordinates },
      properties: { id: place.id, nome: place.nome, categoria: place.categoria },
    }));
    map.emit("load");

    const source = map.getSource("tecendo-locais");
    expect(source).toBeDefined();
    expect(source?.cluster).toBe(true);
    expect(source?.clusterMaxZoom).toBe(14);
    expect(source?.clusterRadius).toBe(48);

    const markerBtn = await screen.findByRole("button", {
      name: /UBS Centro — Saúde da Mulher/i,
    });
    expect(markerBtn).toBeInTheDocument();
    expect(markerBtn.querySelector("svg")).not.toBeNull();

    fireEvent.click(markerBtn);
    expect(onSelectPlace).toHaveBeenCalledWith(SAMPLE_PLACES[0]);

    map.emitLayer("locais-clusters", "click", {
      features: [
        {
          properties: { cluster_id: 7 },
          geometry: { type: "Point", coordinates: [-36.42, -8.33] },
        },
      ],
    });

    await waitFor(() => {
      expect(map.easeToCalls.some((call) => call.zoom === 15)).toBe(true);
    });
  });

  it("recenters the map to Belo Jardim when clicking 'Voltar ao centro'", () => {
    render(<BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} />);
    const map = mapInstances[0];
    map.emit("load");

    const recenterButton = screen.getByRole("button", { name: /voltar ao centro/i });
    expect(recenterButton.className).toContain("min-h-11");
    expect(recenterButton.className).toContain("min-w-11");

    fireEvent.click(recenterButton);

    expect(map.easeToCalls).toContainEqual(
      expect.objectContaining({
        center: [...BELO_JARDIM_CENTER],
        zoom: DEFAULT_ZOOM,
      }),
    );
  });

  it("handles browser geolocation denial gracefully without throwing or storing coordinates", () => {
    const getCurrentPosition = vi.fn((_success, error) => {
      error({ code: 1, message: "User denied Geolocation" });
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} />);
    mapInstances[0].emit("load");

    const geoButton = screen.getByRole("button", { name: /minha localização/i });
    expect(geoButton.className).toContain("min-h-11");
    fireEvent.click(geoButton);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/não concedida|belo jardim/i);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("centers on user coordinates when browser geolocation succeeds inside Belo Jardim without persisting data", async () => {
    const getCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: -8.334,
          longitude: -36.421,
        },
      });
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(<BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} />);
    const map = mapInstances[0];
    map.emit("load");

    fireEvent.click(screen.getByRole("button", { name: /minha localização/i }));

    await waitFor(() => {
      expect(map.easeToCalls).toContainEqual(
        expect.objectContaining({
          center: [-36.421, -8.334],
        }),
      );
    });
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("falls back cleanly to offline style without adding glyph-dependent cluster count layer and notifies onMapError when OpenFreeMap tile loading fails", async () => {
    const prev = process.env.NEXT_PUBLIC_PMTILES_URL;
    delete process.env.NEXT_PUBLIC_PMTILES_URL;

    try {
      const onMapError = vi.fn();
      render(
        <BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} onMapError={onMapError} />,
      );
      const map = mapInstances[0];
      map.emit("load");
      expect(map.getLayer("locais-cluster-count")).toBeDefined();

      map.emit("error", { error: new Error("Network failure") });

      expect(map.setStyleCalls).toHaveLength(1);
      expect(onMapError).toHaveBeenCalledTimes(1);
      expect(map.getLayer("locais-clusters")).toBeDefined();
      expect(map.getLayer("locais-unclustered-point")).toBeDefined();
      expect(map.getLayer("locais-cluster-count")).toBeUndefined();
      await waitFor(() => {
        expect(screen.getByRole("status")).toHaveTextContent(/modo offline|sem conexão/i);
      });
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_PMTILES_URL = prev;
      }
    }
  });

  it("performs 3-stage PMTiles -> OpenFreeMap -> Offline fallback before notifying onMapError", async () => {
    const prev = process.env.NEXT_PUBLIC_PMTILES_URL;
    process.env.NEXT_PUBLIC_PMTILES_URL = "https://cdn.example.org/belo-jardim.pmtiles";

    try {
      const onMapError = vi.fn();
      render(
        <BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} onMapError={onMapError} />,
      );
      const map = mapInstances[0];
      const initialStyle = map.options.style as { sources: { openmaptiles?: { url?: string } } };
      expect(initialStyle.sources.openmaptiles?.url).toBe(
        "pmtiles://https://cdn.example.org/belo-jardim.pmtiles",
      );

      map.emit("load");

      // Stage 1 -> Stage 2: PMTiles fails -> falls back to OpenFreeMap without triggering onMapError
      map.emit("error", { error: new Error("PMTiles unavailable") });
      expect(map.setStyleCalls).toHaveLength(1);
      const fallbackStyle = map.setStyleCalls[0] as {
        sources: { openmaptiles?: { url?: string } };
      };
      expect(fallbackStyle.sources.openmaptiles?.url).toBe("https://tiles.openfreemap.org/planet");
      expect(onMapError).not.toHaveBeenCalled();
      expect(map.getLayer("locais-cluster-count")).toBeDefined();

      // Stage 2 -> Stage 3: OpenFreeMap also fails -> falls back to offline style and calls onMapError
      map.emit("error", { error: new Error("OpenFreeMap unavailable") });
      expect(map.setStyleCalls).toHaveLength(2);
      const offlineStyle = map.setStyleCalls[1] as { sources: Record<string, unknown> };
      expect(offlineStyle.sources).not.toHaveProperty("openmaptiles");
      expect(onMapError).toHaveBeenCalledTimes(1);
      expect(map.getLayer("locais-cluster-count")).toBeUndefined();
      expect(map.getLayer("locais-clusters")).toBeDefined();
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_PMTILES_URL = prev;
      } else {
        delete process.env.NEXT_PUBLIC_PMTILES_URL;
      }
    }
  });

  it("reconciles unclustered markers when sourcedata and idle fire asynchronously after source.setData", async () => {
    const { rerender } = render(
      <BeloJardimMap places={SAMPLE_PLACES} onSelectPlace={vi.fn()} />,
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
    expect(await screen.findByTestId("map-marker-ubs-centro")).toBeInTheDocument();

    // Simulate async tile update: queryRenderedFeatures is initially empty right after setData,
    // then becomes populated when MapLibre finishes tiling and emits sourcedata / idle.
    map.unclusteredFeatures = [];
    rerender(<BeloJardimMap places={[SAMPLE_PLACES[1]]} onSelectPlace={vi.fn()} />);
    expect(screen.queryByTestId("map-marker-casa-artesas")).not.toBeInTheDocument();

    map.unclusteredFeatures = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: SAMPLE_PLACES[1].coordinates },
        properties: { id: SAMPLE_PLACES[1].id },
      },
    ];
    map.emit("idle");

    expect(await screen.findByTestId("map-marker-casa-artesas")).toBeInTheDocument();
    expect(screen.queryByTestId("map-marker-ubs-centro")).not.toBeInTheDocument();
  });
});
