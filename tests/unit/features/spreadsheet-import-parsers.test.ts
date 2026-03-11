import { describe, expect, it } from "vitest";

import {
  buildConceptCatalogFromSheetRows,
  buildItemsFromSheetRows,
  normalizeImportHeader,
} from "@/features/spreadsheet-import";

describe("spreadsheet import parsers", () => {
  it("normalizes spreadsheet headers", () => {
    expect(normalizeImportHeader("Precio unitario")).toBe("precio unitario");
    expect(normalizeImportHeader("Descripción")).toBe("descripcion");
  });

  it("builds quote items from a spreadsheet matrix", () => {
    const rows = [
      ["Category", "Description", "Qty.", "Price"],
      ["Material", "Proyector", "2", "190"],
      ["", "Cableado", "1", "20"],
    ];

    const items = buildItemsFromSheetRows(rows);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ category: "Material", description: "Proyector", quantity: 2, unitPrice: 190 });
    expect(items[1]).toMatchObject({ category: "Material", description: "Cableado", quantity: 1, unitPrice: 20 });
  });

  it("builds a concept catalog from a spreadsheet matrix", () => {
    const rows = [
      ["Categoria", "Concepto", "Precio unitario"],
      ["Servicios", "Ideacion", "375"],
      ["", "Produccion", "456"],
    ];

    const catalog = buildConceptCatalogFromSheetRows(rows);

    expect(catalog).toHaveLength(2);
    expect(catalog[0]).toMatchObject({ category: "Servicios", description: "Ideacion", unitPrice: 375 });
    expect(catalog[1]).toMatchObject({ category: "General", description: "Produccion", unitPrice: 456 });
  });
});
