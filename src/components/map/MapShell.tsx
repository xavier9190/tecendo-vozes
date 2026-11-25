"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibleListView } from "@/components/list/AccessibleListView";
import { SearchAndFilters } from "@/components/search/SearchAndFilters";
import type { Local } from "@/lib/data/schema";
import {
  BELO_JARDIM_BOUNDS,
  BELO_JARDIM_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/geo/belo-jardim";
import { PlaceInspectionSlot } from "@/components/place/PlaceInspectionSlot";
import { filterPlaces } from "@/lib/search/filter-places";
import type { CategoryId } from "@/lib/theme/categories";
import { BeloJardimMap, type MapViewport } from "./BeloJardimMap";
import { PernambucoMiniMap } from "./PernambucoMiniMap";
import { EmergencyBar } from "@/components/emergency/EmergencyBar";
import { MapOfflineFallback } from "@/components/emergency/MapOfflineFallback";
import { ThreeDotsMenu } from "@/components/emergency/ThreeDotsMenu";

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
  const [selectedPlace, setSelectedPlace] = useState<Local | null>(null);
  const [viewport, setViewport] = useState<MapViewport>(INITIAL_VIEWPORT);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryId>>(
    () => new Set(),
  );

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (isMenuOpen) {
        setIsMenuOpen(false);
        return;
      }
      if (selectedPlace) {
        setSelectedPlace(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, selectedPlace]);

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

  const defaultSearchAndList =
    viewMode === "list" ? (
      <div
        className={`relative z-20 flex h-full w-full flex-col bg-tv-cream-warm transition-all ${
          isMenuOpen ? "pointer-events-none blur-sm" : ""
        }`}
      >
        <SearchAndFilters
          query={query}
          onQueryChange={setQuery}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          resultCount={filteredPlaces.length}
          totalCount={places.length}
        />
        <AccessibleListView
          places={filteredPlaces}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPlace={setSelectedPlace}
          onClearFilters={handleClearFilters}
        />
      </div>
    ) : (
      <SearchAndFilters
        query={query}
        onQueryChange={setQuery}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredPlaces.length}
        totalCount={places.length}
      />
    );

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

      {/* Slot #6: Top-left Search Bar, Multi-select Category Filters & Accessible List View */}
      {renderSearchAndListSlot ? renderSearchAndListSlot(slotContext) : defaultSearchAndList}

      {/* Slot #5: Responsive Place Preview (Mobile Bottom Sheet ~1/3 / Desktop Left Side Panel ~1/4) & Full Details */}
      {renderPlaceDetailsSlot ? (
        renderPlaceDetailsSlot(slotContext)
      ) : selectedPlace ? (
        <PlaceInspectionSlot
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      ) : null}

      {/* Bottom-left Pernambuco Mini-Map (hidden on mobile while Bottom Sheet / menu is open, or in List View) */}
      <div
        className={`pointer-events-none absolute bottom-3 left-3 z-20 ${
          viewMode === "list"
            ? "hidden"
            : hideMobileCornerOverlays
              ? "hidden md:block"
              : "block"
        }`}
      >
        <PernambucoMiniMap center={viewport.center} />
      </div>

      {/* Slot #7: Bottom-right Three Dots Menu (with backdrop blur) & Permanent Emergency Layer */}
      {renderEmergencyMenuSlot ? (
        renderEmergencyMenuSlot(slotContext)
      ) : (
        <>
          {mapError && viewMode === "map" ? (
            <MapOfflineFallback
              errorMessage={mapError}
              onSwitchToList={() => setViewMode("list")}
            />
          ) : null}
          <EmergencyBar
            variant="floating"
            isPlaceSelected={Boolean(selectedPlace)}
          />
          <ThreeDotsMenu
            isOpen={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            hideTriggerOnMobile={Boolean(selectedPlace)}
          />
        </>
      )}
    </main>
  );
}
