import type { BudgetSheetOrientation } from "./types";

type SheetDimensions = {
  sheetWidthPx: number;
  sheetHeightPx: number;
  sheetPaddingPx: number;
  sheetContentWidthPx: number;
  sheetContentHeightPx: number;
  budgetSheetHorizontalPaddingPx: number;
  budgetSheetTopPaddingPx: number;
  budgetSheetBottomPaddingPx: number;
  budgetSheetContentWidthPx: number;
  budgetSheetContentHeightPx: number;
  budgetSheetPreviewWidthPx: number;
  budgetSheetPreviewHeightPx: number;
};

const SHEET_SIZE_BY_ORIENTATION: Record<
  BudgetSheetOrientation,
  { width: number; height: number }
> = {
  landscape: { width: 1123, height: 794 },
  portrait: { width: 794, height: 1123 },
};

export const DEFAULT_BUDGET_SHEET_ORIENTATION: BudgetSheetOrientation = "landscape";
export const SHEET_PADDING_PX = 40;
export const BUDGET_SHEET_HORIZONTAL_PADDING_PX = 40;
export const BUDGET_SHEET_TOP_PADDING_PX = 56;
export const BUDGET_SHEET_BOTTOM_PADDING_PX = 56;
export const BUDGET_HEADER_TO_CONCEPT_GAP_PX = 40;
export const SHEET_SECTION_GAP_PX = 32;
export const CONCEPT_SECTION_INNER_GAP_PX = 12;
export const GROUP_SPACER_ROW_HEIGHT_PX = 32;
export const DEFAULT_FIRST_PRE_CONCEPT_HEIGHT_PX = 440;
export const DEFAULT_FIRST_CONCEPT_CHROME_HEIGHT_PX = 76;
export const DEFAULT_CONTINUATION_CONCEPT_CHROME_HEIGHT_PX = 64;
export const DEFAULT_SUMMARY_RESERVE_HEIGHT_PX = 280;
export const SUMMARY_PAGINATION_GUARD_PX = 1;
export const BUDGET_ITEM_ROW_HEIGHT_PX = 40;
export const DEFAULT_CATEGORY_ROW_HEIGHT_PX = 44;
export const DEFAULT_ITEM_ROW_HEIGHT_PX = 48;
export const BUDGET_SHEET_PREVIEW_GAP_PX = 40;
export const BUDGET_SHEET_CAROUSEL_TRANSITION_MS = 300;
export const BUDGET_SHEET_SCROLL_THRESHOLD_PX = 140;
export const BUDGET_SHEET_SCROLL_RESET_MS = 160;
export const BUDGET_COMPANY_REFERENCE_LINES = [
  "Datobueno INC.",
  "46766948J",
  "+34 656 33 23 03",
] as const;

export function getSheetDimensions(
  orientation: BudgetSheetOrientation = DEFAULT_BUDGET_SHEET_ORIENTATION,
): SheetDimensions {
  const sheetSize = SHEET_SIZE_BY_ORIENTATION[orientation];
  return {
    sheetWidthPx: sheetSize.width,
    sheetHeightPx: sheetSize.height,
    sheetPaddingPx: SHEET_PADDING_PX,
    sheetContentWidthPx: sheetSize.width - SHEET_PADDING_PX * 2,
    sheetContentHeightPx: sheetSize.height - SHEET_PADDING_PX * 2,
    budgetSheetHorizontalPaddingPx: BUDGET_SHEET_HORIZONTAL_PADDING_PX,
    budgetSheetTopPaddingPx: BUDGET_SHEET_TOP_PADDING_PX,
    budgetSheetBottomPaddingPx: BUDGET_SHEET_BOTTOM_PADDING_PX,
    budgetSheetContentWidthPx: sheetSize.width - BUDGET_SHEET_HORIZONTAL_PADDING_PX * 2,
    budgetSheetContentHeightPx:
      sheetSize.height - BUDGET_SHEET_TOP_PADDING_PX - BUDGET_SHEET_BOTTOM_PADDING_PX,
    budgetSheetPreviewWidthPx: sheetSize.width,
    budgetSheetPreviewHeightPx: sheetSize.height,
  };
}

const defaultSheetDimensions = getSheetDimensions();

export const SHEET_WIDTH_PX = defaultSheetDimensions.sheetWidthPx;
export const SHEET_HEIGHT_PX = defaultSheetDimensions.sheetHeightPx;
export const SHEET_CONTENT_WIDTH_PX = defaultSheetDimensions.sheetContentWidthPx;
export const SHEET_CONTENT_HEIGHT_PX = defaultSheetDimensions.sheetContentHeightPx;
export const BUDGET_SHEET_CONTENT_WIDTH_PX =
  defaultSheetDimensions.budgetSheetContentWidthPx;
export const BUDGET_SHEET_CONTENT_HEIGHT_PX =
  defaultSheetDimensions.budgetSheetContentHeightPx;
export const BUDGET_SHEET_PREVIEW_WIDTH_PX =
  defaultSheetDimensions.budgetSheetPreviewWidthPx;
export const BUDGET_SHEET_PREVIEW_HEIGHT_PX =
  defaultSheetDimensions.budgetSheetPreviewHeightPx;
