export const ITEM_DND_PREFIX = "item:";
export const CATEGORY_DND_PREFIX = "category:";
export const EMPTY_CONCEPT_ROW_ID = "__empty-concept-row__";
export const CONCEPT_GRID_FIELDS = ["concept", "quantity", "unitPrice"] as const;
export const BUDGET_CONCEPT_PLACEHOLDER = "Add good or service";

export type ConceptGridField = (typeof CONCEPT_GRID_FIELDS)[number];
