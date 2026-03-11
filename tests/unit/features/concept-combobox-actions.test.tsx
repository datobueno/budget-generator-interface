import { describe, expect, it, vi } from "vitest";

import { createConceptComboboxActions } from "@/features/quote-builder";

describe("createConceptComboboxActions", () => {
  it("omits fill quote when requested", () => {
    const actions = createConceptComboboxActions({
      includeFillQuote: false,
      onRequestQuoteImport: vi.fn(),
      onRequestQuoteSpreadsheetImport: vi.fn(),
      onRequestConceptCatalogImport: vi.fn(),
      onRequestConceptCatalogFileUpload: vi.fn(),
    });

    expect(actions.map((action) => action.key)).toEqual(["link-goods-services"]);
  });

  it("keeps fill quote available by default", () => {
    const actions = createConceptComboboxActions({
      onRequestQuoteImport: vi.fn(),
      onRequestQuoteSpreadsheetImport: vi.fn(),
      onRequestConceptCatalogImport: vi.fn(),
      onRequestConceptCatalogFileUpload: vi.fn(),
    });

    expect(actions.map((action) => action.key)).toContain("fill-quote");
  });
});
