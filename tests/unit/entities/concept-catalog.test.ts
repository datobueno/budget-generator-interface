import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCEPT_CATEGORY,
  buildConceptCatalogFromItems,
  findConceptCatalogEntryByDescriptionInCategoryScope,
  getConceptAutocompleteMatches,
  mergeConceptCatalogEntries,
  searchConceptCatalogAcrossCategories,
  sortConceptCatalogEntriesByCategory,
} from "@/entities/concept";

const catalog = [
  { id: "1", category: "Material", description: "Alquiler proyector", unitPrice: 190, source: "spreadsheet" as const },
  { id: "2", category: DEFAULT_CONCEPT_CATEGORY, description: "Transporte", unitPrice: 30, source: "spreadsheet" as const },
  { id: "3", category: "Material", description: "Cableado", unitPrice: 20, source: "spreadsheet" as const },
];

describe("concept catalog", () => {
  it("builds and merges entries preserving ids for duplicates", () => {
    const built = buildConceptCatalogFromItems([
      { category: "Material", description: "Alquiler proyector", unitPrice: 190 },
      { category: "Material", description: "Cableado", unitPrice: 20 },
    ]);

    const merged = mergeConceptCatalogEntries(catalog, built);
    const projector = merged.find((entry) => entry.description === "Alquiler proyector");

    expect(projector?.id).toBe("1");
    expect(merged).toHaveLength(3);
  });

  it("searches within category scope and across categories", () => {
    expect(
      findConceptCatalogEntryByDescriptionInCategoryScope(catalog, "Material", "Transporte")?.description,
    ).toBe("Transporte");
    expect(getConceptAutocompleteMatches(catalog, "cab", "Material", 5)[0]?.description).toBe("Cableado");
    expect(getConceptAutocompleteMatches(catalog, "ssssssssssss", "Material", 5)).toEqual([]);
    expect(searchConceptCatalogAcrossCategories(catalog, "alq")[0]?.description).toBe("Alquiler proyector");
    expect(sortConceptCatalogEntriesByCategory(catalog)[0]?.description).toBe("Transporte");
  });
});
