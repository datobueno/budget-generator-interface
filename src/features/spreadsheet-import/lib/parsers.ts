import type { QuoteItem } from "@/entities/quote";
import type { ConceptCatalogEntry } from "@/entities/concept";
import { DEFAULT_CONCEPT_CATEGORY } from "@/entities/concept";
import { DEFAULT_CATEGORY as DEFAULT_CATEGORY_LEGACY, IMPORT_HEADER_ALIASES, IMPORT_HEADERS } from "./constants";

const DEFAULT_CATEGORY = DEFAULT_CONCEPT_CATEGORY || DEFAULT_CATEGORY_LEGACY;

export function normalizeImportHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[/_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCellString(value: unknown): string {
  return String(value ?? "").trim();
}

function isSpreadsheetRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => getCellString(cell) === "");
}

function parseImportNumber(value: unknown, fallback: number): number {
  const text = getCellString(value).replace(",", ".");
  const parsed = Number(text);
  if (!text || !Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseOptionalImportNumber(value: unknown): number | null {
  const text = getCellString(value).replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function findHeaderIndex(
  headerIndex: Map<string, number>,
  aliases: readonly string[],
): number | undefined {
  for (const alias of aliases) {
    const index = headerIndex.get(normalizeImportHeader(alias));
    if (index !== undefined) return index;
  }
  return undefined;
}

function buildHeaderIndex(headerRow: unknown[]): Map<string, number> {
  const headerIndex = new Map<string, number>();
  headerRow.forEach((header, index) => {
    headerIndex.set(normalizeImportHeader(header), index);
  });
  return headerIndex;
}

function detectHeaderIndex(
  rows: unknown[][],
  aliasGroups: readonly (readonly string[])[],
): { headerIndex: Map<string, number>; dataRows: unknown[][]; matchedHeaders: number } {
  let bestMatchRowIndex = 0;
  let bestMatchedHeaders = -1;
  let bestHeaderIndex = new Map<string, number>();

  const scanLimit = Math.min(rows.length, 12);
  for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
    const candidateRow = rows[rowIndex];
    if (!Array.isArray(candidateRow)) continue;

    const candidateHeaderIndex = buildHeaderIndex(candidateRow);
    let matchedHeaders = 0;
    aliasGroups.forEach((aliases) => {
      if (findHeaderIndex(candidateHeaderIndex, aliases) !== undefined) {
        matchedHeaders += 1;
      }
    });

    if (matchedHeaders > bestMatchedHeaders) {
      bestMatchedHeaders = matchedHeaders;
      bestMatchRowIndex = rowIndex;
      bestHeaderIndex = candidateHeaderIndex;
    }
  }

  return {
    headerIndex: bestHeaderIndex,
    dataRows: rows.slice(bestMatchRowIndex + 1),
    matchedHeaders: bestMatchedHeaders,
  };
}

export function buildItemsFromSheetRows(rows: unknown[][]): QuoteItem[] {
  if (rows.length === 0) {
    throw new Error("The file is empty.");
  }

  const { headerIndex, dataRows, matchedHeaders } = detectHeaderIndex(rows, [
    IMPORT_HEADER_ALIASES.category,
    IMPORT_HEADER_ALIASES.description,
    IMPORT_HEADER_ALIASES.quantity,
    IMPORT_HEADER_ALIASES.unitPrice,
  ]);

  const descriptionIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.description);
  const categoryIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.category);
  const quantityIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.quantity);
  const unitPriceIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.unitPrice);

  if (matchedHeaders <= 0) {
    throw new Error(
      `No compatible columns were found. Use ${IMPORT_HEADERS.category}, ${IMPORT_HEADERS.description}, ${IMPORT_HEADERS.quantity}, and/or ${IMPORT_HEADERS.unitPrice}.`,
    );
  }

  const parsedItems: QuoteItem[] = [];
  let activeCategory = DEFAULT_CATEGORY;

  dataRows.forEach((row) => {
    if (!Array.isArray(row) || isSpreadsheetRowEmpty(row)) return;

    const importedCategory =
      categoryIndex !== undefined ? getCellString(row[categoryIndex]) : "";
    if (importedCategory) activeCategory = importedCategory;

    const descriptionValue =
      descriptionIndex !== undefined ? getCellString(row[descriptionIndex]) : "";
    const quantityValue =
      quantityIndex !== undefined ? parseImportNumber(row[quantityIndex], 1) : 1;
    const unitPriceValue =
      unitPriceIndex !== undefined ? parseImportNumber(row[unitPriceIndex], 0) : 0;
    const description = descriptionValue || "No description";

    parsedItems.push({
      id: crypto.randomUUID(),
      category: activeCategory,
      description,
      quantity: quantityValue,
      unitPrice: unitPriceValue,
      discountPct: 0,
      taxPct: 21,
    });
  });

  if (parsedItems.length === 0) {
    throw new Error("No valid rows were found to import.");
  }

  return parsedItems;
}

export function buildConceptCatalogFromSheetRows(rows: unknown[][]): ConceptCatalogEntry[] {
  if (rows.length === 0) {
    throw new Error("The file is empty.");
  }

  const { headerIndex, dataRows } = detectHeaderIndex(rows, [
    IMPORT_HEADER_ALIASES.category,
    IMPORT_HEADER_ALIASES.description,
    IMPORT_HEADER_ALIASES.unitPrice,
  ]);

  const categoryIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.category);
  const descriptionIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.description);
  const unitPriceIndex = findHeaderIndex(headerIndex, IMPORT_HEADER_ALIASES.unitPrice);

  if (descriptionIndex === undefined) {
    throw new Error(`No compatible column exists for ${IMPORT_HEADERS.description}.`);
  }

  const parsedCatalog: ConceptCatalogEntry[] = [];

  dataRows.forEach((row) => {
    if (!Array.isArray(row) || isSpreadsheetRowEmpty(row)) return;
    const category =
      categoryIndex !== undefined ? getCellString(row[categoryIndex]) || DEFAULT_CATEGORY : DEFAULT_CATEGORY;
    const description = getCellString(row[descriptionIndex]);
    if (!description) return;

    parsedCatalog.push({
      id: crypto.randomUUID(),
      category,
      description,
      unitPrice: unitPriceIndex !== undefined ? parseOptionalImportNumber(row[unitPriceIndex]) : null,
      source: "spreadsheet",
    });
  });

  if (parsedCatalog.length === 0) {
    throw new Error("No valid items were found to import.");
  }

  return parsedCatalog;
}
