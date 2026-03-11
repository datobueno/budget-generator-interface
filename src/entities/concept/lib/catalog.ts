import type { ConceptCatalogEntry } from "../types";

export const DEFAULT_CONCEPT_CATEGORY = "General";

function normalizeConceptText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[/_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getConceptCatalogEntryKey(category: string, description: string): string {
  return `${normalizeConceptText(category || DEFAULT_CONCEPT_CATEGORY)}::${normalizeConceptText(description)}`;
}

function normalizeConceptCatalogCategory(category: string): string {
  return normalizeConceptText(category || DEFAULT_CONCEPT_CATEGORY);
}

function compareConceptCatalogEntriesForCategoryScope(
  left: ConceptCatalogEntry,
  right: ConceptCatalogEntry,
  category: string,
): number {
  const normalizedCategory = normalizeConceptCatalogCategory(category);
  const normalizedGlobalCategory = normalizeConceptCatalogCategory(DEFAULT_CONCEPT_CATEGORY);
  const leftCategory = normalizeConceptCatalogCategory(left.category);
  const rightCategory = normalizeConceptCatalogCategory(right.category);
  const leftScopeRank =
    leftCategory === normalizedCategory ? 0 : leftCategory === normalizedGlobalCategory ? 1 : 2;
  const rightScopeRank =
    rightCategory === normalizedCategory ? 0 : rightCategory === normalizedGlobalCategory ? 1 : 2;

  if (leftScopeRank !== rightScopeRank) {
    return leftScopeRank - rightScopeRank;
  }

  if (left.description !== right.description) {
    return left.description.localeCompare(right.description);
  }

  return getConceptCategoryLabel(left.category).localeCompare(getConceptCategoryLabel(right.category));
}

export function getConceptCategoryLabel(rawCategory: string): string {
  const trimmed = rawCategory.trim();
  return trimmed || DEFAULT_CONCEPT_CATEGORY;
}

export function buildConceptCatalogFromItems(
  items: ReadonlyArray<{ category: string; description: string; unitPrice: number | null }>,
): ConceptCatalogEntry[] {
  const entriesByKey = new Map<string, ConceptCatalogEntry>();

  items.forEach((item) => {
    const category = item.category.trim() || DEFAULT_CONCEPT_CATEGORY;
    const description = item.description.trim();
    if (!description) return;

    const key = getConceptCatalogEntryKey(category, description);
    entriesByKey.set(key, {
      id: crypto.randomUUID(),
      category,
      description,
      unitPrice: item.unitPrice,
      source: "spreadsheet",
    });
  });

  return [...entriesByKey.values()];
}

export function mergeConceptCatalogEntries(
  currentCatalog: ConceptCatalogEntry[],
  nextEntries: ConceptCatalogEntry[],
): ConceptCatalogEntry[] {
  const mergedEntries = new Map<string, ConceptCatalogEntry>();

  currentCatalog.forEach((entry) => {
    mergedEntries.set(getConceptCatalogEntryKey(entry.category, entry.description), entry);
  });

  nextEntries.forEach((entry) => {
    const key = getConceptCatalogEntryKey(entry.category, entry.description);
    const existingEntry = mergedEntries.get(key);

    mergedEntries.set(key, {
      ...entry,
      id: existingEntry?.id ?? entry.id,
    });
  });

  return [...mergedEntries.values()];
}

export function findConceptCatalogEntryByDescription(
  catalog: ConceptCatalogEntry[],
  category: string,
  description: string,
): ConceptCatalogEntry | null {
  const normalizedCategory = normalizeConceptText(category || DEFAULT_CONCEPT_CATEGORY);
  const normalizedDescription = normalizeConceptText(description);
  if (!normalizedCategory || !normalizedDescription) return null;

  return (
    catalog.find(
      (entry) =>
        normalizeConceptText(entry.category || DEFAULT_CONCEPT_CATEGORY) === normalizedCategory &&
        normalizeConceptText(entry.description) === normalizedDescription,
    ) ?? null
  );
}

export function isConceptCatalogEntryVisibleInCategoryScope(
  entry: ConceptCatalogEntry,
  category: string,
): boolean {
  const normalizedEntryCategory = normalizeConceptCatalogCategory(entry.category);
  const normalizedCategory = normalizeConceptCatalogCategory(category);
  const normalizedGlobalCategory = normalizeConceptCatalogCategory(DEFAULT_CONCEPT_CATEGORY);

  return (
    normalizedEntryCategory === normalizedCategory ||
    normalizedEntryCategory === normalizedGlobalCategory
  );
}

export function getConceptCatalogEntriesForCategoryScope(
  catalog: ConceptCatalogEntry[],
  category: string,
): ConceptCatalogEntry[] {
  return catalog.filter((entry) => isConceptCatalogEntryVisibleInCategoryScope(entry, category));
}

export function sortConceptCatalogEntriesForCategoryScope(
  entries: ConceptCatalogEntry[],
  category: string,
): ConceptCatalogEntry[] {
  return [...entries].sort((left, right) =>
    compareConceptCatalogEntriesForCategoryScope(left, right, category),
  );
}

export function findConceptCatalogEntryByDescriptionInCategoryScope(
  catalog: ConceptCatalogEntry[],
  category: string,
  description: string,
): ConceptCatalogEntry | null {
  const normalizedDescription = normalizeConceptText(description);
  if (!normalizedDescription) return null;

  return (
    sortConceptCatalogEntriesForCategoryScope(
      getConceptCatalogEntriesForCategoryScope(catalog, category),
      category,
    ).find((entry) => normalizeConceptText(entry.description) === normalizedDescription) ?? null
  );
}

export function searchConceptCatalogWithinCategoryScope(
  catalog: ConceptCatalogEntry[],
  query: string,
  category: string,
  limit?: number,
): ConceptCatalogEntry[] {
  const applyLimit = (entries: ConceptCatalogEntry[]): ConceptCatalogEntry[] => {
    if (limit === undefined) return entries;
    return entries.slice(0, Math.max(limit, 0));
  };
  const scopedEntries = getConceptCatalogEntriesForCategoryScope(catalog, category);
  const normalizedQuery = normalizeConceptText(query);

  if (!normalizedQuery) {
    return applyLimit(sortConceptCatalogEntriesForCategoryScope(scopedEntries, category));
  }

  const scored = scopedEntries
    .map((entry) => {
      const normalizedDescription = normalizeConceptText(entry.description);
      let score = 0;

      if (normalizedDescription === normalizedQuery) {
        score = 4;
      } else if (normalizedDescription.startsWith(normalizedQuery)) {
        score = 3;
      } else if (normalizedDescription.includes(normalizedQuery)) {
        score = 2;
      } else {
        const tokens = normalizedDescription.split(/\s+/).filter(Boolean);
        if (tokens.some((token) => token.startsWith(normalizedQuery))) {
          score = 1;
        }
      }

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return compareConceptCatalogEntriesForCategoryScope(left.entry, right.entry, category);
    })
    .map((item) => item.entry);

  if (scored.length === 0) {
    return [];
  }

  return applyLimit(scored);
}

export function searchConceptCatalogAcrossCategories(
  catalog: ConceptCatalogEntry[],
  query: string,
  limit?: number,
): ConceptCatalogEntry[] {
  const applyLimit = (entries: ConceptCatalogEntry[]): ConceptCatalogEntry[] => {
    if (limit === undefined) return entries;
    return entries.slice(0, Math.max(limit, 0));
  };
  const normalizedQuery = normalizeConceptText(query);
  if (!normalizedQuery) {
    return applyLimit(
      [...catalog].sort((left, right) => left.description.localeCompare(right.description)),
    );
  }

  const scored = catalog
    .map((entry) => {
      const normalizedDescription = normalizeConceptText(entry.description);
      let score = 0;

      if (normalizedDescription === normalizedQuery) {
        score = 4;
      } else if (normalizedDescription.startsWith(normalizedQuery)) {
        score = 3;
      } else if (normalizedDescription.includes(normalizedQuery)) {
        score = 2;
      } else {
        const tokens = normalizedDescription.split(/\s+/).filter(Boolean);
        if (tokens.some((token) => token.startsWith(normalizedQuery))) {
          score = 1;
        }
      }

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      if (left.entry.description !== right.entry.description) {
        return left.entry.description.localeCompare(right.entry.description);
      }
      return left.entry.category.localeCompare(right.entry.category);
    })
    .map((item) => item.entry);

  return applyLimit(scored);
}

export function getConceptAutocompleteMatches(
  catalog: ConceptCatalogEntry[],
  query: string,
  category: string,
  limit?: number,
): ConceptCatalogEntry[] {
  return searchConceptCatalogWithinCategoryScope(catalog, query, category, limit);
}

export function sortConceptCatalogEntriesByCategory(
  entries: ConceptCatalogEntry[],
): ConceptCatalogEntry[] {
  return [...entries].sort((left, right) => {
    const leftCategory = getConceptCategoryLabel(left.category);
    const rightCategory = getConceptCategoryLabel(right.category);
    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory);
    }
    return left.description.localeCompare(right.description);
  });
}
