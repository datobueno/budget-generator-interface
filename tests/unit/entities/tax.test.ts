import { describe, expect, it } from "vitest";

import {
  DEFAULT_INVOICE_TAX_CODE,
  createInvoiceTaxLine,
  formatInvoiceTaxRate,
  getInvoiceTaxAmount,
  getInvoiceTaxLabel,
  getInvoiceTaxOption,
} from "@/entities/tax";

describe("invoice taxes", () => {
  it("creates a default invoice tax line", () => {
    const line = createInvoiceTaxLine();

    expect(line.taxCode).toBe(DEFAULT_INVOICE_TAX_CODE);
    expect(line.query).toBe(getInvoiceTaxLabel(DEFAULT_INVOICE_TAX_CODE));
    expect(line.rate).not.toBeNull();
  });

  it("calculates and formats invoice tax values", () => {
    expect(getInvoiceTaxOption("vat")?.region).toBe("European Union");
    expect(getInvoiceTaxAmount(100, { id: "1", taxCode: "vat", query: "VAT / IVA", rate: 21 })).toBe(21);
    expect(formatInvoiceTaxRate(9.975)).toBe("9.975");
    expect(formatInvoiceTaxRate(21)).toBe("21");
  });
});
