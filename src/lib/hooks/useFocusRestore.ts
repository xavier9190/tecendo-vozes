"use client";

import { useEffect, type RefObject } from "react";

/**
 * Moves focus into an active overlay/panel and restores focus to the previously
 * focused element (or an optional fallback element) when the overlay closes or unmounts.
 */
export function useFocusRestore(
  active: boolean,
  initialFocusRef?: RefObject<HTMLElement | null>,
  fallbackRestoreRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null;
    const fallbackTarget = fallbackRestoreRef?.current ?? null;

    initialFocusRef?.current?.focus({ preventScroll: true });

    return () => {
      const target =
        previousFocus && previousFocus.isConnected ? previousFocus : fallbackTarget;

      if (target && target.isConnected && target !== document.body) {
        target.focus();
      }
    };
  }, [active, initialFocusRef, fallbackRestoreRef]);
}
