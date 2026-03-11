import { describe, expect, it } from "vitest";

import { buildBudgetSheetStaticLayout } from "@/features/quote-preview";

describe("budget static layout", () => {
  it("matches the Figma landscape grid proportions", () => {
    const layout = buildBudgetSheetStaticLayout(1044, "landscape");

    expect(layout.usesLandscapeGrid).toBe(true);
    expect(layout.clientWidthPx).toBe(246);
    expect(layout.headerMetaWidthPx).toBe(272);
    expect(layout.bodyGapPx).toBe(153);
    expect(layout.tableWidthPx).toBe(645);
    expect(layout.tableColumnWidths).toEqual({
      action: 44,
      concept: 249,
      quantity: 80,
      unitPrice: 112,
      total: 160,
    });
    expect(layout.summaryOffsetPx).toBe(399);
    expect(layout.summaryNotesWidthPx).toBe(399);
    expect(layout.summaryGapPx).toBe(58);
    expect(layout.summaryTotalsWidthPx).toBe(188);
  });

  it("keeps portrait aligned with the updated table proportions", () => {
    const layout = buildBudgetSheetStaticLayout(714, "portrait");

    expect(layout.usesLandscapeGrid).toBe(false);
    expect(layout.bodyGapPx).toBe(16);
    expect(layout.clientWidthPx).toBe(216);
    expect(layout.tableColumnWidths.action).toBe(44);
    expect(layout.headerMetaWidthPx).toBe(198.229);
    expect(layout.tableColumnWidths.concept).toBe(181.468);
    expect(layout.tableColumnWidths.quantity).toBe(58.303);
    expect(layout.tableColumnWidths.unitPrice).toBe(81.624);
    expect(layout.tableColumnWidths.total).toBe(116.605);
    expect(layout.summaryOffsetPx).toBe(232);
    expect(layout.summaryNotesWidthPx).toBe(298.167);
    expect(layout.summaryGapPx).toBe(43.343);
    expect(layout.summaryTotalsWidthPx).toBe(140.49);
  });
});
