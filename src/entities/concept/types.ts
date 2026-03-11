export type ConceptCatalogEntry = {
  id: string;
  category: string;
  description: string;
  unitPrice: number | null;
  source: "spreadsheet";
};
