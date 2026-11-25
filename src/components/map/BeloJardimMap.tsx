"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, LocateFixed } from "lucide-react";
import {
  addProtocol,
  Map as MapLibreMap,
  Marker,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
} from "maplibre-gl";
import { Protocol } from "pmtiles";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  toLocaisGeoJson,
  isWithinBeloJardimBounds,
  type LngLat,
  type Local,
} from "@/lib/data/schema";
import {
  BELO_JARDIM_BOUNDS,
  BELO_JARDIM_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/lib/geo/belo-jardim";
import {
  buildMapStyle,
  buildOfflineMapStyle,
  resolveInitialMapStyleStage,
  type MapStyleStage,
} from "@/lib/map/style";
import { CATEGORIES, getCategoryToken } from "@/lib/theme/categories";
import { PALETTE_TOKENS } from "@/lib/theme/palette";

export interface MapViewport {
  center: LngLat;
  zoom: number;
  bounds: readonly [LngLat, LngLat];
}

export interface BeloJardimMapProps {
  places: readonly Local[];
  selectedPlaceId?: string | null;
  onSelectPlace: (place: Local) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  onMapError?: (error: Error) => void;
  className?: string;
}

const LOCAIS_SOURCE_ID = "tecendo-locais";
const CLUSTERS_LAYER_ID = "locais-clusters";
const CLUSTER_COUNT_LAYER_ID = "locais-cluster-count";
const UNCLUSTERED_LAYER_ID = "locais-unclustered-point";

let pmtilesProtocolRegistered = false;

function ensurePmtilesProtocol(): void {
  if (pmtilesProtocolRegistered) {
    return;
  }
  const protocol = new Protocol();
  addProtocol("pmtiles", protocol.tile);
  pmtilesProtocolRegistered = true;
}

function getTransitionDuration(): number {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return 0;
    }
  }
  return 450;
}

function buildCategoryColorExpression(): unknown[] {
  const expr: unknown[] = ["match", ["get", "categoria"]];
  for (const category of CATEGORIES) {
    expr.push(category.id, category.markerBg);
  }
  expr.push(PALETTE_TOKENS.purpleDeep);
  return expr;
}

function applyMarkerSelectionState(button: HTMLButtonElement, isSelected: boolean): void {
  button.setAttribute("aria-pressed", String(isSelected));
  const badge = button.firstElementChild;
  if (badge instanceof HTMLElement) {
    badge.style.borderColor = isSelected ? PALETTE_TOKENS.butterCream : PALETTE_TOKENS.purpleDeep;
    badge.style.transform = isSelected ? "scale(1.15)" : "";
    badge.style.boxShadow = isSelected ? `0 0 0 3px ${PALETTE_TOKENS.coral}` : "";
  }
}

function createPlaceMarkerElement(place: Local, isSelected: boolean): HTMLButtonElement {
  const category = getCategoryToken(place.categoria);
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.testid = `map-marker-${place.id}`;
  button.setAttribute(
    "aria-label",
    `${place.nome} — ${category.label} (${place.distrito})`,
  );
  button.className =
    "group flex min-h-11 min-w-11 items-center justify-center rounded-full p-1 focus-visible:outline-none";

  const badge = document.createElement("span");
  badge.ariaHidden = "true";
  badge.style.backgroundColor = category.markerBg;
  badge.style.color = category.markerIconColor;
  badge.className =
    "flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md transition-transform group-hover:scale-110";

  badge.innerHTML = renderToStaticMarkup(
    createElement(category.icon, {
      className: "h-4 w-4 shrink-0",
      "aria-hidden": true,
    }),
  );

  button.appendChild(badge);
  applyMarkerSelectionState(button, isSelected);
  return button;
}

export function BeloJardimMap({
  places,
  selectedPlaceId = null,
  onSelectPlace,
  onViewportChange,
  onMapError,
  className = "",
}: BeloJardimMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const userLocationMarkerRef = useRef<Marker | null>(null);
  const placesRef = useRef<readonly Local[]>(places);
  const selectedPlaceIdRef = useRef<string | null>(selectedPlaceId);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onViewportChangeRef = useRef(onViewportChange);
  const onMapErrorRef = useRef(onMapError);
  const styleStageRef = useRef<MapStyleStage>("openfreemap");
  const styleFallbackAppliedRef = useRef(false);
  const layerListenersAttachedRef = useRef(false);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    placesRef.current = places;
    selectedPlaceIdRef.current = selectedPlaceId;
    onSelectPlaceRef.current = onSelectPlace;
    onViewportChangeRef.current = onViewportChange;
    onMapErrorRef.current = onMapError;
  }, [places, selectedPlaceId, onSelectPlace, onViewportChange, onMapError]);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current.values()) {
      marker.remove();
    }
    markersRef.current.clear();
  }, []);

  const syncUnclusteredMarkers = useCallback((map: MapLibreMap) => {
    if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
      return;
    }

    let rendered: ReturnType<MapLibreMap["queryRenderedFeatures"]> = [];
    try {
      rendered = map.queryRenderedFeatures(undefined, {
        layers: [UNCLUSTERED_LAYER_ID],
      });
    } catch {
      return;
    }

    const placesById = new Map(placesRef.current.map((place) => [place.id, place]));
    const visibleIds = new Set<string>();

    for (const feature of rendered) {
      const id =
        typeof feature.properties?.id === "string" ? feature.properties.id : null;
      if (!id || visibleIds.has(id)) {
        continue;
      }
      const place = placesById.get(id);
      if (!place) {
        continue;
      }
      visibleIds.add(id);

      const existing = markersRef.current.get(id);
      if (existing) {
        const btn = existing.getElement?.();
        if (btn instanceof HTMLButtonElement) {
          applyMarkerSelectionState(btn, selectedPlaceIdRef.current === id);
        }
        continue;
      }

      const element = createPlaceMarkerElement(place, selectedPlaceIdRef.current === id);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectPlaceRef.current(place);
      });

      const marker = new Marker({ element })
        .setLngLat([place.coordinates[0], place.coordinates[1]])
        .addTo(map);
      markersRef.current.set(id, marker);
    }

    for (const [id, marker] of markersRef.current.entries()) {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, []);

  const emitViewport = useCallback((map: MapLibreMap) => {
    const center = map.getCenter();
    const bounds = map.getBounds();
    onViewportChangeRef.current?.({
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      bounds: [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getEast(), bounds.getNorth()],
      ],
    });
  }, []);

  const setupPlacesSourceAndLayers = useCallback(
    (map: MapLibreMap) => {
      const geojson = toLocaisGeoJson(placesRef.current);
      const existingSource = map.getSource(LOCAIS_SOURCE_ID) as GeoJSONSource | undefined;

      if (existingSource) {
        existingSource.setData(geojson as unknown as Parameters<GeoJSONSource["setData"]>[0]);
      } else {
        map.addSource(LOCAIS_SOURCE_ID, {
          type: "geojson",
          data: geojson as unknown as GeoJSONSourceSpecification["data"],
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 48,
        });
      }

      if (!map.getLayer(CLUSTERS_LAYER_ID)) {
        map.addLayer({
          id: CLUSTERS_LAYER_ID,
          type: "circle",
          source: LOCAIS_SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              PALETTE_TOKENS.purpleDark,
              5,
              PALETTE_TOKENS.purpleMid,
              10,
              PALETTE_TOKENS.coral,
            ],
            "circle-radius": ["step", ["get", "point_count"], 18, 5, 22, 10, 26],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": PALETTE_TOKENS.mintCream,
          },
        });
      }

      const activeStyle = typeof map.getStyle === "function" ? map.getStyle() : undefined;
      const supportsGlyphs =
        styleStageRef.current !== "offline" &&
        (activeStyle === undefined || Boolean(activeStyle?.glyphs));

      if (supportsGlyphs && !map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: LOCAIS_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 13,
          },
          paint: {
            "text-color": PALETTE_TOKENS.mintCream,
          },
        });
      }

      if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
        map.addLayer({
          id: UNCLUSTERED_LAYER_ID,
          type: "circle",
          source: LOCAIS_SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": buildCategoryColorExpression() as unknown as string,
            "circle-radius": 10,
            "circle-stroke-width": 2,
            "circle-stroke-color": PALETTE_TOKENS.mintCream,
          },
        });
      }

      if (!layerListenersAttachedRef.current) {
        layerListenersAttachedRef.current = true;

        map.on("click", CLUSTERS_LAYER_ID, async (event) => {
          const feature = event.features?.[0];
          const clusterId = feature?.properties?.cluster_id;
          if (typeof clusterId !== "number" || feature?.geometry.type !== "Point") {
            return;
          }

          const source = map.getSource(LOCAIS_SOURCE_ID) as
            | (GeoJSONSource & {
                getClusterExpansionZoom: (id: number) => Promise<number>;
              })
            | undefined;
          if (!source) {
            return;
          }

          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const [lng, lat] = feature.geometry.coordinates;
            map.easeTo({
              center: [lng, lat],
              zoom,
              duration: getTransitionDuration(),
            });
          } catch {
            // Cluster zoom expansion failure is non-fatal
          }
        });

        map.on("click", UNCLUSTERED_LAYER_ID, (event) => {
          const featureId = event.features?.[0]?.properties?.id;
          if (typeof featureId !== "string") {
            return;
          }
          const place = placesRef.current.find((item) => item.id === featureId);
          if (place) {
            onSelectPlaceRef.current(place);
          }
        });

        map.on("mouseenter", CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", CLUSTERS_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      syncUnclusteredMarkers(map);
    },
    [syncUnclusteredMarkers],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    ensurePmtilesProtocol();

    const initialStage = resolveInitialMapStyleStage();
    styleStageRef.current = initialStage;
    styleFallbackAppliedRef.current = false;

    const map = new MapLibreMap({
      container,
      style: buildMapStyle({ mode: initialStage }),
      center: [BELO_JARDIM_CENTER[0], BELO_JARDIM_CENTER[1]],
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: [
        [BELO_JARDIM_BOUNDS[0][0], BELO_JARDIM_BOUNDS[0][1]],
        [BELO_JARDIM_BOUNDS[1][0], BELO_JARDIM_BOUNDS[1][1]],
      ],
      attributionControl: false,
    });

    mapRef.current = map;

    const handleLoad = () => {
      setupPlacesSourceAndLayers(map);
      emitViewport(map);
    };

    const handleMoveEnd = () => {
      emitViewport(map);
      syncUnclusteredMarkers(map);
    };

    const handleSourceData = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (event.sourceId === LOCAIS_SOURCE_ID && event.isSourceLoaded) {
        syncUnclusteredMarkers(map);
      }
    };

    const handleStyleLoad = () => {
      if (styleFallbackAppliedRef.current) {
        setupPlacesSourceAndLayers(map);
      }
    };

    const handleError = (event: { error?: unknown }) => {
      if (styleStageRef.current === "pmtiles") {
        styleStageRef.current = "openfreemap";
        styleFallbackAppliedRef.current = true;
        setStatusMessage("Carregando servidor alternativo de mapas (OpenFreeMap)...");
        map.setStyle(buildMapStyle({ mode: "openfreemap" }));
        return;
      }

      if (styleStageRef.current === "offline") {
        return;
      }

      styleStageRef.current = "offline";
      styleFallbackAppliedRef.current = true;
      setStatusMessage("Mapa em modo offline simplificado (sem conexão com o servidor de mapas).");
      map.setStyle(buildOfflineMapStyle());
      const err =
        event?.error instanceof Error
          ? event.error
          : new Error("Não foi possível carregar os tiles do mapa.");
      onMapErrorRef.current?.(err);
    };

    map.on("load", handleLoad);
    map.on("moveend", handleMoveEnd);
    map.on("sourcedata", handleSourceData);
    map.on("style.load", handleStyleLoad);
    map.on("error", handleError);

    return () => {
      clearMarkers();
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      map.off("load", handleLoad);
      map.off("moveend", handleMoveEnd);
      map.off("sourcedata", handleSourceData);
      map.off("style.load", handleStyleLoad);
      map.off("error", handleError);
      map.remove();
      mapRef.current = null;
      layerListenersAttachedRef.current = false;
    };
  }, [clearMarkers, emitViewport, setupPlacesSourceAndLayers, syncUnclusteredMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    placesRef.current = places;
    const source = map.getSource(LOCAIS_SOURCE_ID) as GeoJSONSource | undefined;
    if (source) {
      source.setData(toLocaisGeoJson(places) as unknown as Parameters<GeoJSONSource["setData"]>[0]);
    }
    clearMarkers();
    syncUnclusteredMarkers(map);

    if (!source) {
      return;
    }

    let cancelled = false;
    const resyncAfterAsyncUpdate = () => {
      if (!cancelled) {
        syncUnclusteredMarkers(map);
      }
    };
    const handleSourceDataOnce = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (event.sourceId === LOCAIS_SOURCE_ID && event.isSourceLoaded) {
        map.off("sourcedata", handleSourceDataOnce);
        resyncAfterAsyncUpdate();
      }
    };
    const handleIdleOnce = () => {
      map.off("idle", handleIdleOnce);
      resyncAfterAsyncUpdate();
    };

    map.on("sourcedata", handleSourceDataOnce);
    map.on("idle", handleIdleOnce);

    return () => {
      cancelled = true;
      map.off("sourcedata", handleSourceDataOnce);
      map.off("idle", handleIdleOnce);
    };
  }, [places, clearMarkers, syncUnclusteredMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    selectedPlaceIdRef.current = selectedPlaceId;
    syncUnclusteredMarkers(map);
  }, [selectedPlaceId, syncUnclusteredMarkers]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    setStatusMessage("Mapa centralizado em Belo Jardim.");
    map.easeTo({
      center: [BELO_JARDIM_CENTER[0], BELO_JARDIM_CENTER[1]],
      zoom: DEFAULT_ZOOM,
      duration: getTransitionDuration(),
    });
  };

  const handleGeolocation = () => {
    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator) ||
      typeof navigator.geolocation?.getCurrentPosition !== "function"
    ) {
      setStatusMessage("Geolocalização não disponível neste navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords: LngLat = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        if (!isWithinBeloJardimBounds(coords)) {
          setStatusMessage(
            "Sua localização atual está fora dos limites de Belo Jardim – PE.",
          );
          return;
        }

        const map = mapRef.current;
        if (!map) {
          return;
        }

        userLocationMarkerRef.current?.remove();
        const dot = document.createElement("div");
        dot.setAttribute("role", "img");
        dot.setAttribute("aria-label", "Sua localização atual aproximada");
        dot.className =
          "h-4 w-4 rounded-full border-2 border-tv-cream-mint bg-tv-coral shadow-md";
        userLocationMarkerRef.current = new Marker({ element: dot })
          .setLngLat([coords[0], coords[1]])
          .addTo(map);

        map.easeTo({
          center: [coords[0], coords[1]],
          zoom: Math.max(map.getZoom(), 14),
          duration: getTransitionDuration(),
        });
        setStatusMessage("Mapa centralizado na sua localização aproximada.");
      },
      () => {
        setIsLocating(false);
        setStatusMessage(
          "Permissão de localização não concedida. O mapa continua funcionando normalmente em Belo Jardim.",
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className={`relative h-full w-full overflow-hidden bg-tv-cream-warm ${className}`.trim()}>
      <div
        ref={containerRef}
        data-testid="belo-jardim-map-canvas"
        role="region"
        aria-label="Mapa interativo de Belo Jardim e distritos"
        className="h-full w-full"
      />

      {/* Map navigation controls — below mobile SearchAndFilters (clear of EmergencyBar) and top-right on desktop */}
      <div className="pointer-events-none absolute top-48 right-3 z-20 flex flex-col items-end gap-2 md:top-4 md:right-4">
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Voltar ao centro de Belo Jardim"
          className="pointer-events-auto inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-mint/95 px-3 py-2 text-sm font-bold text-tv-purple-deep shadow-md transition-colors hover:bg-tv-cream-butter"
        >
          <Crosshair className="h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
          <span className="hidden sm:inline">Voltar ao centro</span>
        </button>

        <button
          type="button"
          onClick={handleGeolocation}
          disabled={isLocating}
          aria-label="Minha localização aproximada no mapa"
          className="pointer-events-auto inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-2 border-tv-purple-dark bg-tv-cream-mint/95 px-3 py-2 text-sm font-bold text-tv-purple-deep shadow-md transition-colors hover:bg-tv-cream-butter disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4 shrink-0 text-tv-purple-dark" aria-hidden="true" />
          <span className="hidden sm:inline">
            {isLocating ? "Localizando..." : "Minha localização"}
          </span>
        </button>
      </div>

      {/* Polite status announcements (geolocation / offline fallback) */}
      <div
        role="status"
        aria-live="polite"
        className={
          statusMessage
            ? "pointer-events-none absolute bottom-10 left-1/2 z-20 max-w-xs -translate-x-1/2 rounded-xl border border-tv-purple-dark bg-tv-cream-mint/95 px-3 py-1.5 text-center text-xs font-semibold text-tv-purple-deep shadow-md sm:max-w-md"
            : "sr-only"
        }
      >
        {statusMessage}
      </div>

      {/* Required OpenStreetMap attribution */}
      <div className="pointer-events-auto absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border border-tv-lavender bg-tv-cream-mint/90 px-2.5 py-0.5 text-[0.6875rem] font-medium text-tv-purple-deep shadow-xs">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-tv-purple-dark/60 hover:text-tv-coral"
        >
          © OpenStreetMap contributors
        </a>
      </div>
    </div>
  );
}
