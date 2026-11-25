"use client";

import { useState } from "react";
import type { Local } from "@/lib/data/schema";
import { PlaceDetailsModal } from "./PlaceDetailsModal";
import { PlacePreview } from "./PlacePreview";

export interface PlaceInspectionSlotProps {
  place: Local;
  onClose: () => void;
}

/**
 * Default Ticket #5 slot coordinating PlacePreview and PlaceDetailsModal.
 */
export function PlaceInspectionSlot({ place, onClose }: PlaceInspectionSlotProps) {
  const [detailsPlaceId, setDetailsPlaceId] = useState<string | null>(null);
  const isDetailsOpen = detailsPlaceId === place.id;

  return (
    <>
      <PlacePreview
        place={place}
        onClose={onClose}
        onOpenDetails={(selected) => setDetailsPlaceId(selected.id)}
      />
      <PlaceDetailsModal
        place={place}
        isOpen={isDetailsOpen}
        onClose={() => setDetailsPlaceId(null)}
      />
    </>
  );
}
