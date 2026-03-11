import { type QuoteItem } from "@/entities/quote";
import { CATEGORY_DND_PREFIX, ITEM_DND_PREFIX } from "@/features/quote-builder/model/constants";
import { DEFAULT_CONCEPT_CATEGORY as DEFAULT_CATEGORY } from "@/entities/concept";

export function toItemDndId(itemId: string): string {
  return `${ITEM_DND_PREFIX}${itemId}`;
}

export function toCategoryDndId(category: string): string {
  return `${CATEGORY_DND_PREFIX}${category}`;
}

export function fromItemDndId(dndId: string): string | null {
  return dndId.startsWith(ITEM_DND_PREFIX) ? dndId.slice(ITEM_DND_PREFIX.length) : null;
}

export function fromCategoryDndId(dndId: string): string | null {
  return dndId.startsWith(CATEGORY_DND_PREFIX)
    ? dndId.slice(CATEGORY_DND_PREFIX.length)
    : null;
}

export function getCategoryOrder(items: QuoteItem[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();

  items.forEach((item) => {
    const category = item.category.trim() || DEFAULT_CATEGORY;
    if (seen.has(category)) return;
    seen.add(category);
    order.push(category);
  });

  return order;
}
