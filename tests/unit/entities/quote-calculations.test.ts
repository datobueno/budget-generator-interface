import { describe, expect, it } from "vitest";

import { getLineBase, getLineDiscount, getLineTax, getLineTotal, getQuoteTotals } from "@/entities/quote";
import type { QuoteItem } from "@/entities/quote";

const item: QuoteItem = {
  id: "line-1",
  category: "Services",
  description: "Workshop",
  quantity: 2,
  unitPrice: 150,
  discountPct: 10,
  taxPct: 21,
};

describe("quote calculations", () => {
  it("calculates base, discount, tax, and total for a line item", () => {
    expect(getLineBase(item)).toBe(300);
    expect(getLineDiscount(item)).toBe(30);
    expect(getLineTax(item)).toBe(56.7);
    expect(getLineTotal(item)).toBe(326.7);
  });

  it("aggregates totals across quote items", () => {
    expect(getQuoteTotals([item])).toEqual({
      subTotal: 300,
      discountTotal: 30,
      taxTotal: 56.7,
      grandTotal: 326.7,
    });
  });
});
