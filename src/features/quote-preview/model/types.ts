import type { QuoteItem } from "@/entities/quote";

export type BudgetSheetOrientation = "landscape" | "portrait";

export type GroupedCategory = {
  category: string;
  items: QuoteItem[];
  isContinuation?: boolean;
};

export type ConceptPage = {
  groups: GroupedCategory[];
};

export type ConceptPageFocusBehavior = "animate" | "instant";

export type PaginationLayoutMetrics = {
  contentHeight: number;
  firstPreConceptHeight: number;
  firstConceptChromeHeight: number;
  continuationConceptChromeHeight: number;
  summaryReserveHeight: number;
  groupSpacerHeight: number;
  categoryHeights: Record<string, number>;
  itemHeights: Record<string, number>;
};

export type PaginationResult = {
  pages: ConceptPage[];
  summaryOnNewSheet: boolean;
};
