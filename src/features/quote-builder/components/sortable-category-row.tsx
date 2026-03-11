import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { CATEGORY_DND_PREFIX } from "@/features/quote-builder/model/constants";
import { cn } from "@/shared/lib/utils";

type SortableCategoryRowProps = {
  category: string;
  isBudgetStyle?: boolean;
  budgetColumnCount?: number;
  budgetLeadingOffsetPx?: number;
  onMeasureRef?: (element: HTMLTableRowElement | null) => void;
  isDimmed?: boolean;
};

function toCategoryDndId(category: string): string {
  return `${CATEGORY_DND_PREFIX}${category}`;
}

export function SortableCategoryRow({
  category,
  isBudgetStyle = false,
  budgetColumnCount = 4,
  budgetLeadingOffsetPx = 8,
  onMeasureRef,
  isDimmed = false,
}: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: toCategoryDndId(category),
    transition: isBudgetStyle ? null : undefined,
  });

  return (
    <TableRow
      ref={(node) => {
        setNodeRef(node);
        onMeasureRef?.(node);
      }}
      data-group-row="category"
      data-group-category={category}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative hover:bg-transparent",
        isBudgetStyle && "h-[44px]",
        isDimmed && !isDragging && "opacity-50",
        isDragging && "z-20 opacity-100",
      )}
      {...(isBudgetStyle ? attributes : {})}
      {...(isBudgetStyle ? listeners : {})}
    >
      <TableCell
        colSpan={isBudgetStyle ? budgetColumnCount : 4}
        className={cn(
          "pl-0 pr-0 py-2 text-[16px] font-semibold text-[#0a0a0a]",
          isBudgetStyle && "pl-2",
        )}
        style={
          isBudgetStyle
            ? { paddingLeft: `${budgetLeadingOffsetPx}px` }
            : undefined
        }
      >
        {isBudgetStyle ? (
          <span className="[font-family:'IBM_Plex_Sans_Condensed',sans-serif] leading-[25.714px]">
            {category}
          </span>
        ) : (
          <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reorder section"
              title="Reorder section"
              className={cn(
                "h-7 w-7 cursor-grab text-zinc-400 opacity-0 hover:text-zinc-700 active:cursor-grabbing",
                "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                isDragging && "pointer-events-auto opacity-100",
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <span className="px-2">{category}</span>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
