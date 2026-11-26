"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { EmergencyBar } from "@/components/emergency/EmergencyBar";
import { MapOfflineFallback } from "@/components/emergency/MapOfflineFallback";
import { ThreeDotsMenu } from "@/components/emergency/ThreeDotsMenu";
import { AccessibleListView } from "@/components/list/AccessibleListView";
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
  viewMode: "map" | "list";
  setViewMode: (mode: "map" | "list") => void;
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
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
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

  const handleClearFilters = () => {
    setQuery("");
    setSelectedCategories(new Set());
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
    viewMode,
    setViewMode,
    isMenuOpen,
    setIsMenuOpen,
  };

  const hideMobileCornerOverlays = Boolean(selectedPlace) || isMenuOpen;
  const showOfflineFallback = Boolean(mapError) && viewMode === "map";

  const searchAndFilters = (
    <SearchAndFilters
      query={query}
      onQueryChange={setQuery}
      selectedCategories={selectedCategories}
      onToggleCategory={handleToggleCategory}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      resultCount={filteredPlaces.length}
      totalCount={places.length}
      isPlaceSelected={Boolean(selectedPlace)}
    />
  );

  const placePreviewNode = renderPlaceDetailsSlot ? (
    renderPlaceDetailsSlot(slotContext)
  ) : selectedPlace ? (
    <PlacePreview
      place={selectedPlace}
      onClose={() => setSelectedPlace(null)}
      onOpenDetails={(place) => setDetailsPlaceId(place.id)}
      handleEscape={false}
    />
  ) : null;

  return (
    <main
      id="conteudo-principal"
      data-view-mode={viewMode}
      data-map-error={mapError ? "true" : "false"}
      className="relative h-dvh w-full overflow-hidden bg-tv-cream-warm text-tv-purple-deep"
    >
      <h1 className="sr-only">
        Tecendo Vozes — Mapa Local para Mulheres em Belo Jardim – PE
      </h1>

      {/* Interactive Map Layer (blurred when #7 Three Dots menu is open) */}
      <div
        className={`h-full w-full transition-all ${
          isMenuOpen ? "pointer-events-none blur-sm" : ""
        } ${viewMode === "list" ? "hidden" : "block"}`}
      >
        <BeloJardimMap
          places={filteredPlaces}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPlace={setSelectedPlace}
          onViewportChange={setViewport}
          onMapError={(error) => setMapError(error.message)}
        />
      </div>

      {/* Shared Left Column in Map View (SearchAndFilters -> PlacePreview -> PernambucoMiniMap) or Accessible List View */}
      {viewMode === "list" ? (
        renderSearchAndListSlot ? (
          renderSearchAndListSlot(slotContext)
        ) : (
          <div
            className={`relative z-20 flex h-full w-full flex-col bg-tv-cream-warm transition-all ${
              isMenuOpen ? "pointer-events-none blur-sm" : ""
            }`}
          >
            {searchAndFilters}
            <div className="relative flex min-h-0 flex-1">
              {placePreviewNode ? (
                <div className="pointer-events-none shrink-0 md:p-4 md:pr-0">
                  {placePreviewNode}
                </div>
              ) : null}
              <AccessibleListView
                places={filteredPlaces}
                selectedPlaceId={selectedPlace?.id ?? null}
                onSelectPlace={setSelectedPlace}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        )
      ) : (
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 right-0 flex flex-col gap-3 p-3 md:right-auto md:p-4 ${
            selectedPlace
              ? "md:w-[calc(clamp(340px,32vw,420px)+2rem)]"
              : "md:w-[27rem]"
          }`}
        >
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
      )}

      {/* Full Details Dialog rendered at top level so z-50 is never trapped by sibling stacking contexts */}
      {!renderPlaceDetailsSlot && selectedPlace ? (
        <PlaceDetailsModal
          place={selectedPlace}
          isOpen={isDetailsOpen}
          onClose={() => setDetailsPlaceId(null)}
          handleEscape={false}
        />
      ) : null}

      {/* Slot #7: Bottom-right Three Dots Menu (with backdrop blur) & Permanent Emergency Layer */}
      {renderEmergencyMenuSlot ? (
        renderEmergencyMenuSlot(slotContext)
      ) : (
        <>
          {showOfflineFallback ? (
            <MapOfflineFallback
              errorMessage={mapError}
              onSwitchToList={() => setViewMode("list")}
            />
          ) : (
            <EmergencyBar
              variant="floating"
              isPlaceSelected={Boolean(selectedPlace)}
            />
          )}
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
