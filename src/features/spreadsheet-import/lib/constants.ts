export const IMPORT_HEADERS = {
  category: "Category",
  description: "Description",
  quantity: "Qty.",
  unitPrice: "Price",
} as const;

export const IMPORT_HEADER_ALIASES = {
  category: ["categoria", "category", "seccion", "section"],
  description: ["descripcion", "concepto", "description"],
  quantity: ["cant.", "cant", "cantidad", "qty", "quantity"],
  unitPrice: ["precio", "precio unitario", "unit price", "price", "unitario"],
} as const;

export const DEFAULT_CATEGORY = "General";
