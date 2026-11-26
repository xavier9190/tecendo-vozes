"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MapOfflineFallback } from "@/components/emergency/MapOfflineFallback";
import { ThreeDotsMenu } from "@/components/emergency/ThreeDotsMenu";
import { PlaceDetailsModal } from "@/components/place/PlaceDetailsModal";
import { PlacePreview } from "@/components/place/PlacePreview";
import { SearchAndFilters } from "@/components/search/SearchAndFilters";
import type { Local } from "@/lib/data/schema";
import {
  BELO_JARDIM_BOUNDS,
  BELO_JARDIM_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/geo/belo-jardim";
import { filterPlaces } from "@/lib/search/filter-places";
import type { CategoryId } from "@/lib/theme/categories";
import { BeloJardimMap, type MapViewport } from "./BeloJardimMap";
import { PernambucoMiniMap } from "./PernambucoMiniMap";

export interface MapShellSlotContext {
  places: readonly Local[];
  selectedPlace: Local | null;
  setSelectedPlace: (place: Local | null) => void;
  viewport: MapViewport;
  mapError: string | null;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export interface MapShellProps {
  places: readonly Local[];
  renderSearchAndListSlot?: (context: MapShellSlotContext) => ReactNode;
  renderPlaceDetailsSlot?: (context: MapShellSlotContext) => ReactNode;
  renderEmergencyMenuSlot?: (context: MapShellSlotContext) => ReactNode;
}

const INITIAL_VIEWPORT: MapViewport = {
  center: [BELO_JARDIM_CENTER[0], BELO_JARDIM_CENTER[1]],
  zoom: DEFAULT_ZOOM,
  bounds: [
    [BELO_JARDIM_BOUNDS[0][0], BELO_JARDIM_BOUNDS[0][1]],
    [BELO_JARDIM_BOUNDS[1][0], BELO_JARDIM_BOUNDS[1][1]],
  ],
};

export function MapShell({
  places,
  renderSearchAndListSlot,
  renderPlaceDetailsSlot,
  renderEmergencyMenuSlot,
}: MapShellProps) {
  const [selectedPlace, setSelectedPlaceState] = useState<Local | null>(null);
  const [detailsPlaceId, setDetailsPlaceId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<MapViewport>(INITIAL_VIEWPORT);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(
    () => new Set(),
  );

  const setSelectedPlace = useCallback((place: Local | null) => {
    setSelectedPlaceState(place);
    setDetailsPlaceId((prev) => (place && prev === place.id ? prev : null));
  }, []);

  const isDetailsOpen = Boolean(selectedPlace && detailsPlaceId === selectedPlace.id);

  const filteredPlaces = useMemo(
    () => filterPlaces(places, { query, selectedCategories }),
    [places, query, selectedCategories],
  );

  const handleToggleCategory = (categoryId: CategoryId) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Single centralized Escape handler closing strictly one layer at a time:
  // PlaceDetailsModal -> ThreeDotsMenu -> PlacePreview
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (isDetailsOpen) {
        event.preventDefault();
        setDetailsPlaceId(null);
        return;
      }
      if (isMenuOpen) {
        event.preventDefault();
        setIsMenuOpen(false);
        return;
      }
      if (selectedPlace) {
        event.preventDefault();
        setSelectedPlace(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen, isMenuOpen, selectedPlace, setSelectedPlace]);

  const slotContext: MapShellSlotContext = {
    places: filteredPlaces,
    selectedPlace,
    setSelectedPlace,
    viewport,
    mapError,
    isMenuOpen,
    setIsMenuOpen,
  };

  const hideMobileCornerOverlays = Boolean(selectedPlace) || isMenuOpen;

  const searchAndFilters = (
    <SearchAndFilters
      query={query}
      onQueryChange={setQuery}
      selectedCategories={selectedCategories}
      onToggleCategory={handleToggleCategory}
    />
  );

  const placePreviewNode = renderPlaceDetailsSlot ? (
    renderPlaceDetailsSlot(slotContext)
  ) : selectedPlace ? (
    <PlacePreview
      key={selectedPlace.id}
      place={selectedPlace}
      onClose={() => setSelectedPlace(null)}
      onOpenDetails={(place) => setDetailsPlaceId(place.id)}
      handleEscape={false}
    />
  ) : null;

  return (
    <main
      id="conteudo-principal"
      data-map-error={mapError ? "true" : "false"}
      className="relative h-dvh w-full overflow-hidden bg-tv-cream-warm text-tv-purple-deep"
    >
      <h1 className="sr-only">
        Tecendo Vozes — Mapa Local para Mulheres em Belo Jardim – PE
      </h1>

      {/* Interactive Map Layer (gradually blurred when Three Dots menu is open) */}
      <div
        className={`h-full w-full transition-all duration-300 ease-out ${
          isMenuOpen ? "pointer-events-none blur-sm" : ""
        }`}
      >
        <BeloJardimMap
          places={filteredPlaces}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPlace={setSelectedPlace}
          onViewportChange={setViewport}
          onMapError={(error) => setMapError(error.message)}
        />
      </div>

      {/* Shared Left Column (SearchAndFilters -> PlacePreview -> PernambucoMiniMap) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex flex-col gap-3 p-3 md:right-auto md:w-[calc(clamp(340px,32vw,420px)+2rem)] md:p-4">
        {renderSearchAndListSlot ? renderSearchAndListSlot(slotContext) : searchAndFilters}

        <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-start">
          {placePreviewNode}
        </div>

        <div
          className={`pointer-events-none z-20 shrink-0 self-start ${
            hideMobileCornerOverlays ? "hidden md:block" : "block"
          } ${
            selectedPlace
              ? "md:fixed md:bottom-3 md:left-[calc(clamp(340px,32vw,420px)+2rem)]"
              : "relative"
          }`}
        >
          <PernambucoMiniMap center={viewport.center} />
        </div>
      </div>

      {/* Full Details Dialog rendered at top level so z-50 is never trapped by sibling stacking contexts */}
      {!renderPlaceDetailsSlot && selectedPlace ? (
        <PlaceDetailsModal
          place={selectedPlace}
          isOpen={isDetailsOpen}
          onClose={() => setDetailsPlaceId(null)}
          handleEscape={false}
        />
      ) : null}

      {/* Bottom-right Three Dots Menu (with backdrop blur) & Offline Fallback */}
      {renderEmergencyMenuSlot ? (
        renderEmergencyMenuSlot(slotContext)
      ) : (
        <>
          {mapError ? <MapOfflineFallback errorMessage={mapError} /> : null}
          <ThreeDotsMenu
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            hideTriggerOnMobile={Boolean(selectedPlace)}
            handleEscape={false}
          />
        </>
      )}
    </main>
  );
}
