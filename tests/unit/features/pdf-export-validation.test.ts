import { describe, expect, it } from "vitest";

import { validatePdfExportRequirements } from "@/features/pdf-export";

describe("pdf export validation", () => {
  it("requires contact, company, date, logo, and one complete concept", () => {
    const result = validatePdfExportRequirements({
      client: {
        contactName: "",
        companyName: "",
      },
      issueDate: "",
      items: [],
      logoDataUrl: "",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      contactName: true,
      companyName: true,
      issueDate: true,
      logo: true,
      emptyConceptDraft: true,
    });
  });

  it("marks incomplete concept rows when there is no valid item yet", () => {
    const result = validatePdfExportRequirements({
      client: {
        contactName: "Ada",
        companyName: "Datobueno",
      },
      issueDate: "2026-03-09",
      logoDataUrl: "data:image/png;base64,abc",
      items: [
        {
          id: "item-1",
          category: "General",
          description: "Service",
          quantity: null,
          unitPrice: 100,
          discountPct: 0,
          taxPct: 21,
        },
        {
          id: "item-2",
          category: "General",
          description: "",
          quantity: 1,
          unitPrice: null,
          discountPct: 0,
          taxPct: 21,
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.itemDescriptionIds).toEqual(["item-2"]);
    expect(result.errors.itemQuantityIds).toEqual(["item-1"]);
    expect(result.errors.itemUnitPriceIds).toEqual(["item-2"]);
  });

  it("passes when one concept is complete even if there are no other validation issues", () => {
    const result = validatePdfExportRequirements({
      client: {
        contactName: "Ada",
        companyName: "Datobueno",
      },
      issueDate: "2026-03-09",
      logoDataUrl: "data:image/png;base64,abc",
      items: [
        {
          id: "item-1",
          category: "General",
          description: "Implementation",
          quantity: 1,
          unitPrice: 250,
          discountPct: 0,
          taxPct: 21,
        },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.itemDescriptionIds).toEqual([]);
    expect(result.errors.itemQuantityIds).toEqual([]);
    expect(result.errors.itemUnitPriceIds).toEqual([]);
  });
});
