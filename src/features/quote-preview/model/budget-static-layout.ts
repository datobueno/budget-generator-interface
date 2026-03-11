import type { BudgetSheetOrientation } from "./types";

const BUDGET_LANDSCAPE_REFERENCE_INNER_WIDTH_PX = 1044;
const BUDGET_LANDSCAPE_CLIENT_WIDTH_PX = 246;
const BUDGET_LANDSCAPE_BODY_GAP_PX = 153;
const BUDGET_LANDSCAPE_TABLE_ACTION_WIDTH_PX = 44;
const BUDGET_LANDSCAPE_TABLE_CONCEPT_WIDTH_PX = 249;
const BUDGET_LANDSCAPE_TABLE_QUANTITY_WIDTH_PX = 80;
const BUDGET_LANDSCAPE_TABLE_UNIT_PRICE_WIDTH_PX = 112;
const BUDGET_LANDSCAPE_TABLE_TOTAL_WIDTH_PX = 160;
const BUDGET_LANDSCAPE_VISIBLE_TABLE_WIDTH_PX =
  BUDGET_LANDSCAPE_TABLE_ACTION_WIDTH_PX +
  BUDGET_LANDSCAPE_TABLE_CONCEPT_WIDTH_PX +
  BUDGET_LANDSCAPE_TABLE_QUANTITY_WIDTH_PX +
  BUDGET_LANDSCAPE_TABLE_UNIT_PRICE_WIDTH_PX +
  BUDGET_LANDSCAPE_TABLE_TOTAL_WIDTH_PX;
const BUDGET_LANDSCAPE_SUMMARY_NOTES_WIDTH_PX = 399;
const BUDGET_LANDSCAPE_SUMMARY_TOTALS_WIDTH_PX = 188;

const BUDGET_PORTRAIT_REFERENCE_INNER_WIDTH_PX = 714;
const BUDGET_PORTRAIT_CLIENT_WIDTH_PX = 216;
const BUDGET_PORTRAIT_BODY_GAP_PX = 16;

export type BudgetSheetStaticLayout = {
  innerWidthPx: number;
  headerMetaWidthPx: number;
  clientWidthPx: number;
  bodyGapPx: number;
  tableWidthPx: number;
  usesLandscapeGrid: boolean;
  tableColumnWidths: {
    action: number;
    concept: number;
    quantity: number;
    unitPrice: number;
    total: number;
  };
  summaryOffsetPx: number;
  summaryNotesWidthPx: number;
  summaryGapPx: number;
  summaryTotalsWidthPx: number;
};

function scaleBudgetSheetWidth(value: number, innerWidthPx: number, referenceWidthPx: number): number {
  return Number(((value * innerWidthPx) / referenceWidthPx).toFixed(3));
}

function buildBudgetTableColumnWidths(tableWidthPx: number): BudgetSheetStaticLayout["tableColumnWidths"] {
  const actionWidthPx = Number(
    Math.min(BUDGET_LANDSCAPE_TABLE_ACTION_WIDTH_PX, tableWidthPx).toFixed(3),
  );
  const remainingTableWidthPx = Number(Math.max(0, tableWidthPx - actionWidthPx).toFixed(3));
  const remainingReferenceWidthPx =
    BUDGET_LANDSCAPE_TABLE_CONCEPT_WIDTH_PX +
    BUDGET_LANDSCAPE_TABLE_QUANTITY_WIDTH_PX +
    BUDGET_LANDSCAPE_TABLE_UNIT_PRICE_WIDTH_PX +
    BUDGET_LANDSCAPE_TABLE_TOTAL_WIDTH_PX;
  const conceptWidthPx = scaleBudgetSheetWidth(
    BUDGET_LANDSCAPE_TABLE_CONCEPT_WIDTH_PX,
    remainingTableWidthPx,
    remainingReferenceWidthPx,
  );
  const quantityWidthPx = scaleBudgetSheetWidth(
    BUDGET_LANDSCAPE_TABLE_QUANTITY_WIDTH_PX,
    remainingTableWidthPx,
    remainingReferenceWidthPx,
  );
  const unitPriceWidthPx = scaleBudgetSheetWidth(
    BUDGET_LANDSCAPE_TABLE_UNIT_PRICE_WIDTH_PX,
    remainingTableWidthPx,
    remainingReferenceWidthPx,
  );
  const totalWidthPx = Number(
    (
      tableWidthPx -
      actionWidthPx -
      conceptWidthPx -
      quantityWidthPx -
      unitPriceWidthPx
    ).toFixed(3),
  );

  return {
    action: actionWidthPx,
    concept: conceptWidthPx,
    quantity: quantityWidthPx,
    unitPrice: unitPriceWidthPx,
    total: totalWidthPx,
  };
}

function buildBudgetSummaryWidths(tableWidthPx: number): Pick<
  BudgetSheetStaticLayout,
  "summaryNotesWidthPx" | "summaryGapPx" | "summaryTotalsWidthPx"
> {
  const summaryNotesWidthPx = scaleBudgetSheetWidth(
    BUDGET_LANDSCAPE_SUMMARY_NOTES_WIDTH_PX,
    tableWidthPx,
    BUDGET_LANDSCAPE_VISIBLE_TABLE_WIDTH_PX,
  );
  const summaryGapPx = scaleBudgetSheetWidth(
    BUDGET_LANDSCAPE_VISIBLE_TABLE_WIDTH_PX -
      BUDGET_LANDSCAPE_SUMMARY_NOTES_WIDTH_PX -
      BUDGET_LANDSCAPE_SUMMARY_TOTALS_WIDTH_PX,
    tableWidthPx,
    BUDGET_LANDSCAPE_VISIBLE_TABLE_WIDTH_PX,
  );
  const summaryTotalsWidthPx = Number(
    (tableWidthPx - summaryNotesWidthPx - summaryGapPx).toFixed(3),
  );

  return {
    summaryNotesWidthPx,
    summaryGapPx,
    summaryTotalsWidthPx,
  };
}

export function buildBudgetSheetStaticLayout(
  innerWidthPx: number,
  orientation: BudgetSheetOrientation,
): BudgetSheetStaticLayout {
  const isLandscape = orientation === "landscape";
  const clientWidthPx = scaleBudgetSheetWidth(
    isLandscape ? BUDGET_LANDSCAPE_CLIENT_WIDTH_PX : BUDGET_PORTRAIT_CLIENT_WIDTH_PX,
    innerWidthPx,
    isLandscape
      ? BUDGET_LANDSCAPE_REFERENCE_INNER_WIDTH_PX
      : BUDGET_PORTRAIT_REFERENCE_INNER_WIDTH_PX,
  );
  const bodyGapPx = scaleBudgetSheetWidth(
    isLandscape ? BUDGET_LANDSCAPE_BODY_GAP_PX : BUDGET_PORTRAIT_BODY_GAP_PX,
    innerWidthPx,
    isLandscape
      ? BUDGET_LANDSCAPE_REFERENCE_INNER_WIDTH_PX
      : BUDGET_PORTRAIT_REFERENCE_INNER_WIDTH_PX,
  );
  const tableWidthPx = Number((innerWidthPx - clientWidthPx - bodyGapPx).toFixed(3));
  const tableColumnWidths = buildBudgetTableColumnWidths(tableWidthPx);
  const headerMetaWidthPx = Number(
    (tableColumnWidths.unitPrice + tableColumnWidths.total).toFixed(3),
  );
  const summaryWidths = buildBudgetSummaryWidths(tableWidthPx);

  return {
    innerWidthPx,
    headerMetaWidthPx,
    clientWidthPx,
    bodyGapPx,
    tableWidthPx,
    usesLandscapeGrid: isLandscape,
    tableColumnWidths,
    summaryOffsetPx: Number((clientWidthPx + bodyGapPx).toFixed(3)),
    summaryNotesWidthPx: summaryWidths.summaryNotesWidthPx,
    summaryGapPx: summaryWidths.summaryGapPx,
    summaryTotalsWidthPx: summaryWidths.summaryTotalsWidthPx,
  };
}
