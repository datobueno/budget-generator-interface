import { formatMoney } from "@/entities/quote";
import type { ConceptCatalogEntry } from "@/entities/concept";
import { cn } from "@/shared/lib/utils";

export function ConceptCatalogSectionLabel({ section }: { section: string }) {
  return (
    <div className="px-2 py-1.5 text-xs text-muted-foreground">
      <span className="truncate">{section}</span>
    </div>
  );
}

export function ConceptCatalogOptionContent({
  entry,
  currency,
  budgetNumericFontClass,
}: {
  entry: ConceptCatalogEntry;
  currency: string;
  budgetNumericFontClass: string;
}) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_max-content] items-center gap-3">
      <span className="min-w-0 truncate text-[14px] font-normal text-[#171717]">
        {entry.description}
      </span>
      {entry.unitPrice !== null ? (
        <span
          className={cn(
            "justify-self-end text-right text-[12px] font-normal text-[#737373]",
            budgetNumericFontClass,
          )}
        >
          {formatMoney(entry.unitPrice, currency)}
        </span>
      ) : null}
    </div>
  );
}
