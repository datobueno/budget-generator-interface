import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import {
  BUDGET_SHEET_CAROUSEL_TRANSITION_MS,
  BUDGET_SHEET_SCROLL_RESET_MS,
  BUDGET_SHEET_SCROLL_THRESHOLD_PX,
  type ConceptPageFocusBehavior,
} from "@/features/quote-preview";

type UseBudgetSheetNavigationArgs = {
  shouldUseStackedBudgetSheets: boolean;
  renderedBudgetSheetCount: number;
  conceptPagesLength: number;
  activeConceptComboboxId: string | null;
  conceptPageIndexByItemId: Map<string, number>;
  expandedBudgetSheetWidth: number;
  pendingManualConceptPageFocusRef: MutableRefObject<ConceptPageFocusBehavior | null>;
};

export function useBudgetSheetNavigation({
  shouldUseStackedBudgetSheets,
  renderedBudgetSheetCount,
  conceptPagesLength,
  activeConceptComboboxId,
  conceptPageIndexByItemId,
  expandedBudgetSheetWidth,
  pendingManualConceptPageFocusRef,
}: UseBudgetSheetNavigationArgs) {
  const [activeBudgetSheetIndex, setActiveBudgetSheetIndex] = useState(0);
  const [isBudgetSheetTransitioning, setIsBudgetSheetTransitioning] = useState(false);

  const budgetSheetWheelContainerRef = useRef<HTMLDivElement | null>(null);
  const previousConceptPageCountRef = useRef(0);
  const activeBudgetSheetIndexRef = useRef(0);
  const isBudgetSheetTransitioningRef = useRef(false);
  const budgetSheetWheelDeltaRef = useRef(0);
  const budgetSheetWheelGestureConsumedRef = useRef(false);
  const budgetSheetWheelResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    activeBudgetSheetIndexRef.current = activeBudgetSheetIndex;
  }, [activeBudgetSheetIndex]);

  useEffect(() => {
    isBudgetSheetTransitioningRef.current = isBudgetSheetTransitioning;
  }, [isBudgetSheetTransitioning]);

  const resetBudgetSheetWheelGesture = useCallback(() => {
    if (budgetSheetWheelResetTimeoutRef.current !== null) {
      window.clearTimeout(budgetSheetWheelResetTimeoutRef.current);
      budgetSheetWheelResetTimeoutRef.current = null;
    }
    budgetSheetWheelDeltaRef.current = 0;
    budgetSheetWheelGestureConsumedRef.current = false;
  }, []);

  const scheduleBudgetSheetWheelGestureReset = useCallback(() => {
    if (budgetSheetWheelResetTimeoutRef.current !== null) {
      window.clearTimeout(budgetSheetWheelResetTimeoutRef.current);
    }
    budgetSheetWheelResetTimeoutRef.current = window.setTimeout(() => {
      budgetSheetWheelDeltaRef.current = 0;
      budgetSheetWheelGestureConsumedRef.current = false;
      budgetSheetWheelResetTimeoutRef.current = null;
    }, BUDGET_SHEET_SCROLL_RESET_MS);
  }, []);

  const focusBudgetSheet = useCallback(
    (nextIndex: number) => {
      const maxVisibleSheetIndex = Math.max(renderedBudgetSheetCount - 1, 0);
      const clampedIndex = Math.max(0, Math.min(nextIndex, maxVisibleSheetIndex));
      if (clampedIndex === activeBudgetSheetIndexRef.current) return;
      isBudgetSheetTransitioningRef.current = true;
      activeBudgetSheetIndexRef.current = clampedIndex;
      setIsBudgetSheetTransitioning(true);
      setActiveBudgetSheetIndex(clampedIndex);
    },
    [renderedBudgetSheetCount],
  );

  const handleBudgetSheetTrackWheel = useCallback(
    (event: Pick<WheelEvent, "deltaMode" | "deltaX" | "deltaY" | "preventDefault" | "shiftKey">) => {
      if (!shouldUseStackedBudgetSheets) return;

      const dominantDelta =
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;

      if (dominantDelta === 0) return;

      event.preventDefault();

      if (budgetSheetWheelGestureConsumedRef.current || isBudgetSheetTransitioningRef.current) {
        scheduleBudgetSheetWheelGestureReset();
        return;
      }

      const deltaMultiplier =
        event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? expandedBudgetSheetWidth : 1;
      budgetSheetWheelDeltaRef.current += dominantDelta * deltaMultiplier;

      scheduleBudgetSheetWheelGestureReset();

      if (Math.abs(budgetSheetWheelDeltaRef.current) < BUDGET_SHEET_SCROLL_THRESHOLD_PX) {
        return;
      }

      const direction = budgetSheetWheelDeltaRef.current > 0 ? 1 : -1;
      budgetSheetWheelDeltaRef.current = 0;
      budgetSheetWheelGestureConsumedRef.current = true;
      focusBudgetSheet(activeBudgetSheetIndexRef.current + direction);
    },
    [
      expandedBudgetSheetWidth,
      focusBudgetSheet,
      scheduleBudgetSheetWheelGestureReset,
      shouldUseStackedBudgetSheets,
    ],
  );

  useEffect(() => {
    if (!shouldUseStackedBudgetSheets) return;

    const container = budgetSheetWheelContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (event: WheelEvent) => {
      handleBudgetSheetTrackWheel(event);
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [handleBudgetSheetTrackWheel, shouldUseStackedBudgetSheets]);

  useEffect(() => {
    if (shouldUseStackedBudgetSheets) return;
    setActiveBudgetSheetIndex(0);
    activeBudgetSheetIndexRef.current = 0;
    setIsBudgetSheetTransitioning(false);
    isBudgetSheetTransitioningRef.current = false;
    pendingManualConceptPageFocusRef.current = null;
    previousConceptPageCountRef.current = conceptPagesLength;
    resetBudgetSheetWheelGesture();
  }, [
    conceptPagesLength,
    pendingManualConceptPageFocusRef,
    resetBudgetSheetWheelGesture,
    shouldUseStackedBudgetSheets,
  ]);

  useEffect(() => {
    const maxVisibleSheetIndex = Math.max(renderedBudgetSheetCount - 1, 0);
    setActiveBudgetSheetIndex((current) => {
      const nextIndex = Math.min(current, maxVisibleSheetIndex);
      activeBudgetSheetIndexRef.current = nextIndex;
      return nextIndex;
    });
  }, [renderedBudgetSheetCount]);

  useEffect(() => {
    if (!shouldUseStackedBudgetSheets || !isBudgetSheetTransitioning) return;

    const timeoutId = window.setTimeout(() => {
      isBudgetSheetTransitioningRef.current = false;
      setIsBudgetSheetTransitioning(false);
    }, BUDGET_SHEET_CAROUSEL_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBudgetSheetTransitioning, shouldUseStackedBudgetSheets]);

  useEffect(() => {
    return () => {
      resetBudgetSheetWheelGesture();
    };
  }, [resetBudgetSheetWheelGesture]);

  useEffect(() => {
    if (!shouldUseStackedBudgetSheets) return;

    const pendingPageFocusBehavior = pendingManualConceptPageFocusRef.current;

    if (pendingPageFocusBehavior && conceptPagesLength > previousConceptPageCountRef.current) {
      activeBudgetSheetIndexRef.current = conceptPagesLength - 1;
      isBudgetSheetTransitioningRef.current = pendingPageFocusBehavior === "animate";
      setActiveBudgetSheetIndex(conceptPagesLength - 1);
      setIsBudgetSheetTransitioning(pendingPageFocusBehavior === "animate");
    }

    if (conceptPagesLength !== previousConceptPageCountRef.current) {
      pendingManualConceptPageFocusRef.current = null;
    }

    previousConceptPageCountRef.current = conceptPagesLength;
  }, [conceptPagesLength, pendingManualConceptPageFocusRef, shouldUseStackedBudgetSheets]);

  useEffect(() => {
    if (!shouldUseStackedBudgetSheets || !activeConceptComboboxId) return;

    const targetSheetIndex = conceptPageIndexByItemId.get(activeConceptComboboxId);
    if (targetSheetIndex === undefined) return;

    if (targetSheetIndex !== activeBudgetSheetIndexRef.current) {
      const pendingPageFocusBehavior = pendingManualConceptPageFocusRef.current ?? "instant";
      const shouldAnimate = pendingPageFocusBehavior === "animate";
      activeBudgetSheetIndexRef.current = targetSheetIndex;
      isBudgetSheetTransitioningRef.current = shouldAnimate;
      setActiveBudgetSheetIndex(targetSheetIndex);
      setIsBudgetSheetTransitioning(shouldAnimate);
    }

    pendingManualConceptPageFocusRef.current = null;
  }, [
    activeConceptComboboxId,
    conceptPageIndexByItemId,
    pendingManualConceptPageFocusRef,
    shouldUseStackedBudgetSheets,
  ]);

  return {
    activeBudgetSheetIndex,
    setActiveBudgetSheetIndex,
    isBudgetSheetTransitioning,
    setIsBudgetSheetTransitioning,
    budgetSheetWheelContainerRef,
    focusBudgetSheet,
  };
}
