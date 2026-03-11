import type { ConceptPage, GroupedCategory, PaginationLayoutMetrics, PaginationResult } from "../model/types";

type PageCapacity = {
  capacity: number;
  allowSingleItemOverflow: boolean;
};

export type PaginationMetricDefaults = {
  contentHeight: number;
  firstPreConceptHeight: number;
  firstConceptChromeHeight: number;
  continuationConceptChromeHeight: number;
  summaryReserveHeight: number;
  groupSpacerHeight: number;
  defaultCategoryRowHeight: number;
  defaultItemRowHeight: number;
};

function buildPageCapacities(
  pageCount: number,
  firstNoSummaryCap: number,
  firstWithSummaryCap: number,
  continuationNoSummaryCap: number,
  continuationWithSummaryCap: number,
): PageCapacity[] {
  if (pageCount <= 1) {
    return [{ capacity: firstWithSummaryCap, allowSingleItemOverflow: false }];
  }

  const capacities: PageCapacity[] = [
    { capacity: firstNoSummaryCap, allowSingleItemOverflow: true },
  ];
  for (let index = 1; index < pageCount - 1; index += 1) {
    capacities.push({
      capacity: continuationNoSummaryCap,
      allowSingleItemOverflow: true,
    });
  }
  capacities.push({
    capacity: continuationWithSummaryCap,
    allowSingleItemOverflow: false,
  });
  return capacities;
}

function tryPaginateWithCapacities(
  groups: GroupedCategory[],
  capacities: PageCapacity[],
  metrics: PaginationLayoutMetrics,
  defaultCategoryRowHeight: number,
  defaultItemRowHeight: number,
): ConceptPage[] | null {
  const pages: ConceptPage[] = [];
  let categoryIndex = 0;
  let itemIndex = 0;

  for (const { capacity, allowSingleItemOverflow } of capacities) {
    if (categoryIndex >= groups.length) break;

    const pageGroups: GroupedCategory[] = [];
    let usedHeight = 0;

    while (categoryIndex < groups.length) {
      const group = groups[categoryIndex];
      const isContinuation = itemIndex > 0;
      const categoryHeight = isContinuation
        ? 0
        : metrics.categoryHeights[group.category] ?? defaultCategoryRowHeight;
      const needsSpacer = pageGroups.length > 0;
      const spacerHeight = needsSpacer ? metrics.groupSpacerHeight : 0;
      const nextItem = group.items[itemIndex];
      if (!nextItem) {
        categoryIndex += 1;
        itemIndex = 0;
        continue;
      }

      const nextItemHeight = metrics.itemHeights[nextItem.id] ?? defaultItemRowHeight;
      const minimalChunkHeight = spacerHeight + categoryHeight + nextItemHeight;

      if (usedHeight > 0 && usedHeight + minimalChunkHeight > capacity) break;

      if (needsSpacer) usedHeight += metrics.groupSpacerHeight;
      const pageGroup: GroupedCategory = {
        category: group.category,
        items: [],
        isContinuation,
      };
      pageGroups.push(pageGroup);
      usedHeight += categoryHeight;

      while (itemIndex < group.items.length) {
        const item = group.items[itemIndex];
        const itemHeight = metrics.itemHeights[item.id] ?? defaultItemRowHeight;
        const nextUsedHeight = usedHeight + itemHeight;

        if (
          nextUsedHeight > capacity &&
          allowSingleItemOverflow &&
          pageGroup.items.length === 0 &&
          pageGroups.length === 1
        ) {
          pageGroup.items.push(item);
          usedHeight = nextUsedHeight;
          itemIndex += 1;
          continue;
        }

        if (nextUsedHeight > capacity) break;

        pageGroup.items.push(item);
        usedHeight = nextUsedHeight;
        itemIndex += 1;
      }

      if (itemIndex < group.items.length) break;

      categoryIndex += 1;
      itemIndex = 0;
    }

    if (pageGroups.length === 0) return null;
    pages.push({ groups: pageGroups });
  }

  return categoryIndex === groups.length ? pages : null;
}

export function paginateConceptGroupsByHeight(
  groups: GroupedCategory[],
  metrics: PaginationLayoutMetrics,
  defaultCategoryRowHeight: number,
  defaultItemRowHeight: number,
  forceSummaryOnNewSheet = false,
): PaginationResult {
  if (groups.length === 0) return { pages: [{ groups: [] }], summaryOnNewSheet: false };

  const firstNoSummaryCap =
    metrics.contentHeight - metrics.firstPreConceptHeight - metrics.firstConceptChromeHeight;
  const firstWithSummaryCap = firstNoSummaryCap - metrics.summaryReserveHeight;
  const continuationNoSummaryCap =
    metrics.contentHeight - metrics.continuationConceptChromeHeight;
  const continuationWithSummaryCap = continuationNoSummaryCap - metrics.summaryReserveHeight;
  const maxPageCount =
    groups.reduce((total, group) => total + Math.max(group.items.length, 1), 0) + groups.length;

  if (!forceSummaryOnNewSheet) {
    for (let pageCount = 1; pageCount <= maxPageCount; pageCount += 1) {
      const capacities = buildPageCapacities(
        pageCount,
        firstNoSummaryCap,
        firstWithSummaryCap,
        continuationNoSummaryCap,
        continuationWithSummaryCap,
      );
      const pages = tryPaginateWithCapacities(
        groups,
        capacities,
        metrics,
        defaultCategoryRowHeight,
        defaultItemRowHeight,
      );
      if (pages) {
        return { pages, summaryOnNewSheet: false };
      }
    }
  }

  for (let pageCount = 1; pageCount <= maxPageCount; pageCount += 1) {
    const capacities: PageCapacity[] =
      pageCount === 1
        ? [{ capacity: firstNoSummaryCap, allowSingleItemOverflow: true }]
        : [
            { capacity: firstNoSummaryCap, allowSingleItemOverflow: true },
            ...Array.from({ length: pageCount - 1 }, () => ({
              capacity: continuationNoSummaryCap,
              allowSingleItemOverflow: true,
            })),
          ];
    const pages = tryPaginateWithCapacities(
      groups,
      capacities,
      metrics,
      defaultCategoryRowHeight,
      defaultItemRowHeight,
    );
    if (pages) {
      return { pages, summaryOnNewSheet: true };
    }
  }

  return { pages: groups.map((group) => ({ groups: [group] })), summaryOnNewSheet: true };
}

export function buildFallbackPaginationMetrics(
  groups: GroupedCategory[],
  defaults: PaginationMetricDefaults,
): PaginationLayoutMetrics {
  const categoryHeights: Record<string, number> = {};
  const itemHeights: Record<string, number> = {};

  groups.forEach((group) => {
    categoryHeights[group.category] = defaults.defaultCategoryRowHeight;
    group.items.forEach((item) => {
      itemHeights[item.id] = defaults.defaultItemRowHeight;
    });
  });

  return {
    contentHeight: defaults.contentHeight,
    firstPreConceptHeight: defaults.firstPreConceptHeight,
    firstConceptChromeHeight: defaults.firstConceptChromeHeight,
    continuationConceptChromeHeight: defaults.continuationConceptChromeHeight,
    summaryReserveHeight: defaults.summaryReserveHeight,
    groupSpacerHeight: defaults.groupSpacerHeight,
    categoryHeights,
    itemHeights,
  };
}

function recordsMatch(a: Record<string, number>, b: Record<string, number>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

export function metricsMatch(a: PaginationLayoutMetrics, b: PaginationLayoutMetrics): boolean {
  return (
    a.contentHeight === b.contentHeight &&
    a.firstPreConceptHeight === b.firstPreConceptHeight &&
    a.firstConceptChromeHeight === b.firstConceptChromeHeight &&
    a.continuationConceptChromeHeight === b.continuationConceptChromeHeight &&
    a.summaryReserveHeight === b.summaryReserveHeight &&
    a.groupSpacerHeight === b.groupSpacerHeight &&
    recordsMatch(a.categoryHeights, b.categoryHeights) &&
    recordsMatch(a.itemHeights, b.itemHeights)
  );
}

export function measureHeight(element: Element | null, fallback: number): number {
  if (!element) return fallback;
  const measuredHeight =
    element instanceof HTMLElement
      ? element.offsetHeight
      : Math.ceil(element.getBoundingClientRect().height);
  return measuredHeight > 0 ? measuredHeight : fallback;
}
