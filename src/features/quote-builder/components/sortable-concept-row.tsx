import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DEFAULT_CONCEPT_CATEGORY as DEFAULT_CATEGORY,
  findConceptCatalogEntryByDescription,
  findConceptCatalogEntryByDescriptionInCategoryScope,
  getConceptAutocompleteMatches,
  getConceptCatalogEntriesForCategoryScope,
  getConceptCategoryLabel,
  searchConceptCatalogAcrossCategories,
  sortConceptCatalogEntriesByCategory,
  sortConceptCatalogEntriesForCategoryScope,
  type ConceptCatalogEntry,
} from "@/entities/concept";
import { getLineBase, type QuoteItem, formatMoney } from "@/entities/quote";
import {
  BUDGET_CONCEPT_PLACEHOLDER,
  createConceptComboboxActions,
  ConceptCatalogOptionContent,
  ConceptCatalogSectionLabel,
  type ConceptGridField,
} from "@/features/quote-builder";
import { type LinkedGoogleSpreadsheet } from "@/features/google-sheets";
import { type ConceptPageFocusBehavior } from "@/features/quote-preview";
import { cn } from "@/shared/lib/utils";
import { normalizeImportHeader } from "@/features/spreadsheet-import";
import { type RowActionButtonKind } from "@/features/quote-builder/model/types";

type SortableConceptRowProps = {
  dndId: string;
  item: QuoteItem;
  category: string;
  currency: string;
  conceptCatalog: ConceptCatalogEntry[];
  isBudgetStyle?: boolean;
  canRemove: boolean;
  onRequestQuoteImport?: () => void;
  onRequestQuoteSpreadsheetImport?: () => void;
  onRequestLinkedQuoteSpreadsheetImport?: () => void;
  linkedQuoteSpreadsheet?: LinkedGoogleSpreadsheet | null;
  isQuoteImporting?: boolean;
  onRequestConceptCatalogImport?: () => void;
  onRequestLinkedConceptCatalogSpreadsheetImport?: () => void;
  linkedConceptCatalogSpreadsheet?: LinkedGoogleSpreadsheet | null;
  onRequestConceptCatalogFileUpload?: () => void;
  isConceptCatalogImporting?: boolean;
  isLastRow?: boolean;
  onUpdateItem: (
    id: string,
    next: QuoteItem,
    options?: { pageFocusBehavior?: ConceptPageFocusBehavior },
  ) => void;
  onAddItemBelow: (
    id: string,
    options?: {
      activateCombobox?: boolean;
      referenceCategory?: string;
      pageFocusBehavior?: ConceptPageFocusBehavior;
    },
  ) => void;
  activateComboboxOnMount?: boolean;
  onComboboxActivated?: () => void;
  isInteractive?: boolean;
  onConceptGridFieldKeyDown?: (
    rowId: string,
    field: ConceptGridField,
    event: KeyboardEvent<HTMLInputElement>,
  ) => void;
  isActionRailVisible?: boolean;
  onActionRailEnter?: (id: string) => void;
  onActionRailLeave?: (id: string) => void;
  onActionButtonIntent?: (id: string, action: RowActionButtonKind) => void;
  onRemoveItem: (id: string) => void;
  onMeasureRef?: (element: HTMLTableRowElement | null) => void;
  isDimmed?: boolean;
  invalidFields?: Partial<Record<"concept" | "quantity" | "unitPrice", boolean>>;
  budgetColumnWidths?: {
    action: number;
    concept: number;
    quantity: number;
    unitPrice: number;
    total: number;
  };
  budgetNumericFieldClass: string;
  conceptRowFieldClass: string;
  conceptComboboxContentClass: string;
  budgetNumericFontClass: string;
};

function parseEditableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
}

export function SortableConceptRow({
  dndId,
  item,
  category,
  currency,
  conceptCatalog,
  isBudgetStyle = false,
  canRemove,
  onRequestQuoteImport,
  onRequestQuoteSpreadsheetImport,
  onRequestLinkedQuoteSpreadsheetImport,
  linkedQuoteSpreadsheet = null,
  isQuoteImporting = false,
  onRequestConceptCatalogImport,
  onRequestLinkedConceptCatalogSpreadsheetImport,
  linkedConceptCatalogSpreadsheet = null,
  onRequestConceptCatalogFileUpload,
  isConceptCatalogImporting = false,
  isLastRow = false,
  onUpdateItem,
  onAddItemBelow,
  activateComboboxOnMount = false,
  onComboboxActivated,
  isInteractive = true,
  onConceptGridFieldKeyDown,
  isActionRailVisible = false,
  onActionRailEnter,
  onActionRailLeave,
  onActionButtonIntent,
  onRemoveItem,
  onMeasureRef,
  isDimmed = false,
  invalidFields,
  budgetColumnWidths,
  budgetNumericFieldClass,
  conceptRowFieldClass,
  conceptComboboxContentClass,
  budgetNumericFontClass,
}: SortableConceptRowProps) {
  const errorFieldClassName =
    "border-[#dc2626] bg-[#fef2f2] hover:border-[#dc2626] hover:bg-[#fef2f2] focus-visible:border-[#dc2626] focus-visible:bg-[#fef2f2]";
  const errorStaticFieldClassName = "bg-[#fef2f2] ring-1 ring-inset ring-[#dc2626]";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
    transition: isBudgetStyle ? null : undefined,
  });
  const [showConceptSeedOptions, setShowConceptSeedOptions] = useState(false);
  const isBlankConceptRow = item.description.trim().length === 0;
  const categorySeedConceptOptions = useMemo(
    () =>
      sortConceptCatalogEntriesForCategoryScope(
        getConceptCatalogEntriesForCategoryScope(conceptCatalog, item.category),
        item.category,
      ),
    [conceptCatalog, item.category],
  );
  const seededConceptOptions = useMemo(() => {
    if (isBlankConceptRow) {
      return sortConceptCatalogEntriesByCategory(conceptCatalog);
    }

    return categorySeedConceptOptions;
  }, [categorySeedConceptOptions, conceptCatalog, isBlankConceptRow]);
  const searchedConceptOptions = useMemo(() => {
    if (isBlankConceptRow) {
      return sortConceptCatalogEntriesByCategory(
        searchConceptCatalogAcrossCategories(conceptCatalog, item.description),
      );
    }

    return getConceptAutocompleteMatches(conceptCatalog, item.description, item.category);
  }, [conceptCatalog, isBlankConceptRow, item.category, item.description]);
  const conceptComboboxOptions = showConceptSeedOptions
    ? seededConceptOptions
    : searchedConceptOptions;
  const conceptComboboxSectionGetter = useCallback(
    (entry: ConceptCatalogEntry) => getConceptCategoryLabel(entry.category),
    [],
  );
  const conceptComboboxActions = useMemo(
    () =>
      createConceptComboboxActions({
        onRequestQuoteImport,
        onRequestQuoteSpreadsheetImport,
        onRequestLinkedQuoteSpreadsheetImport,
        linkedQuoteSpreadsheet,
        isQuoteImporting,
        includeFillQuote: false,
        onRequestConceptCatalogImport,
        onRequestLinkedConceptCatalogSpreadsheetImport,
        linkedConceptCatalogSpreadsheet,
        onRequestConceptCatalogFileUpload,
        isConceptCatalogImporting,
      }),
    [
      isQuoteImporting,
      isConceptCatalogImporting,
      linkedQuoteSpreadsheet,
      linkedConceptCatalogSpreadsheet,
      onRequestLinkedQuoteSpreadsheetImport,
      onRequestLinkedConceptCatalogSpreadsheetImport,
      onRequestConceptCatalogFileUpload,
      onRequestConceptCatalogImport,
      onRequestQuoteImport,
      onRequestQuoteSpreadsheetImport,
    ],
  );
  const lineBase = getLineBase(item);
  const [animatedLineBase, setAnimatedLineBase] = useState(lineBase);
  const animatedLineBaseRef = useRef(lineBase);
  const animationFrameRef = useRef<number | null>(null);
  const previousInputsRef = useRef<{
    quantity: QuoteItem["quantity"];
    unitPrice: QuoteItem["unitPrice"];
  }>({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  });

  useEffect(() => {
    animatedLineBaseRef.current = animatedLineBase;
  }, [animatedLineBase]);

  useEffect(() => {
    const previousInputs = previousInputsRef.current;
    const inputsChanged =
      previousInputs.quantity !== item.quantity ||
      previousInputs.unitPrice !== item.unitPrice;
    previousInputsRef.current = {
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    };

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!inputsChanged) {
      setAnimatedLineBase(lineBase);
      return;
    }

    const startValue = animatedLineBaseRef.current;
    const delta = lineBase - startValue;
    if (Math.abs(delta) < 0.0001) {
      setAnimatedLineBase(lineBase);
      return;
    }

    const durationMs = 100;
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      setAnimatedLineBase(startValue + delta * progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      animationFrameRef.current = null;
      setAnimatedLineBase(lineBase);
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [item.quantity, item.unitPrice, lineBase]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const applyDescriptionWithCatalog = (
    nextDescription: string,
    explicitSelection?: ConceptCatalogEntry | null,
  ) => {
    const matchedEntry =
      explicitSelection ??
      (isBlankConceptRow
        ? findConceptCatalogEntryByDescription(conceptCatalog, item.category, nextDescription)
        : findConceptCatalogEntryByDescriptionInCategoryScope(
            conceptCatalog,
            item.category,
            nextDescription,
          ));
    const nextUnitPrice =
      explicitSelection !== undefined
        ? explicitSelection?.unitPrice ?? null
        : item.unitPrice === null && matchedEntry && matchedEntry.unitPrice !== null
          ? matchedEntry.unitPrice
          : item.unitPrice;
    const nextCategory =
      explicitSelection !== undefined
        ? explicitSelection?.category?.trim() || item.category.trim() || DEFAULT_CATEGORY
        : matchedEntry?.category?.trim() || item.category.trim() || DEFAULT_CATEGORY;
    const nextQuantity =
      explicitSelection !== undefined
        ? item.quantity == null || item.quantity <= 0
          ? 1
          : item.quantity
        : item.quantity;

    onUpdateItem(
      item.id,
      {
        ...item,
        category: nextCategory,
        description: nextDescription,
        quantity: nextQuantity,
        unitPrice: nextUnitPrice,
      },
      { pageFocusBehavior: "instant" },
    );
  };

  const handleApplyConceptAutocomplete = (entry: ConceptCatalogEntry) => {
    setShowConceptSeedOptions(false);
    applyDescriptionWithCatalog(entry.description, entry);
    if (isBlankConceptRow || isLastRow) {
      onAddItemBelow(item.id, {
        activateCombobox: true,
        referenceCategory: entry.category.trim() || DEFAULT_CATEGORY,
        pageFocusBehavior: "instant",
      });
    }
  };

  const handleConceptInputEnter = (rawValue: string, event: KeyboardEvent<HTMLInputElement>) => {
    const nextDescription = rawValue.trim();
    if (!nextDescription) return;

    event.preventDefault();
    event.stopPropagation();

    const normalizedDescription = normalizeImportHeader(nextDescription);
    const selectedEntry =
      (isBlankConceptRow
        ? conceptCatalog.find(
            (entry) => normalizeImportHeader(entry.description) === normalizedDescription,
          ) ?? null
        : findConceptCatalogEntryByDescriptionInCategoryScope(
            conceptCatalog,
            item.category,
            nextDescription,
          ));

    if (selectedEntry) {
      applyDescriptionWithCatalog(selectedEntry.description, selectedEntry);
    } else {
      applyDescriptionWithCatalog(nextDescription);
    }

    setShowConceptSeedOptions(false);
    onAddItemBelow(item.id, {
      activateCombobox: true,
      referenceCategory:
        selectedEntry?.category?.trim() || item.category.trim() || DEFAULT_CATEGORY,
      pageFocusBehavior: "instant",
    });
  };
  const budgetConceptCellWidthPx =
    isBudgetStyle && budgetColumnWidths
      ? budgetColumnWidths.action + budgetColumnWidths.concept
      : undefined;

  return (
    <TableRow
      ref={(node) => {
        setNodeRef(node);
        onMeasureRef?.(node);
      }}
      data-group-row="item"
      data-group-category={category}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onMouseEnter={() => onActionRailEnter?.(item.id)}
      onMouseLeave={() => onActionRailLeave?.(item.id)}
      className={cn(
        "group relative hover:bg-transparent",
        isBudgetStyle && "h-10",
        isDimmed && !isDragging && "opacity-50",
        isDragging && "z-20 opacity-100",
      )}
    >
      <TableCell
        colSpan={isBudgetStyle && budgetColumnWidths?.action ? 2 : undefined}
        className={cn("pl-0 pr-2", isBudgetStyle && "py-0 pr-4")}
        style={
          isBudgetStyle && budgetConceptCellWidthPx
            ? { width: `${budgetConceptCellWidthPx}px` }
            : undefined
        }
      >
        {isBudgetStyle ? (
          <div
            className="relative"
            data-budget-print-concept-field={isBudgetStyle ? "true" : undefined}
            data-budget-print-value={isBudgetStyle ? item.description : undefined}
          >
            {isInteractive ? (
              <>
                <div
                  className={cn(
                    "absolute left-[-92px] top-1/2 z-30 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity",
                    "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                    isActionRailVisible && "pointer-events-auto opacity-100",
                    isDragging && "pointer-events-none opacity-0",
                  )}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onActionButtonIntent?.(item.id, "add");
                      onAddItemBelow(item.id, { activateCombobox: true });
                    }}
                    aria-label="Add row below"
                    title="Add row below"
                    className="h-7 w-7"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onActionButtonIntent?.(item.id, "remove");
                      onRemoveItem(item.id);
                    }}
                    disabled={!canRemove}
                    aria-label="Delete row"
                    title="Delete row"
                    className="h-7 w-7"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span
                    aria-label="Reorder row"
                    title="Reorder row"
                    className="flex h-7 w-7 cursor-grab items-center justify-center text-[#737373] active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                </div>
                <Combobox<ConceptCatalogEntry>
                  value={item.description}
                  options={conceptComboboxOptions}
                  placeholder={BUDGET_CONCEPT_PLACEHOLDER}
                  className="w-full"
                  contentClassName={conceptComboboxContentClass}
                  inputClassName={cn(conceptRowFieldClass, "w-full")}
                  aria-invalid={invalidFields?.concept || undefined}
                  inputDataAttributes={{
                    "data-concept-grid-row-id": item.id,
                    "data-concept-grid-field": "concept",
                    "data-concept-grid-input-kind": "combobox",
                  }}
                  emptyText={
                    item.description.trim() ? `No matches for "${item.description.trim()}".` : " "
                  }
                  getOptionLabel={(entry) => entry.description}
                  getOptionKey={(entry) => entry.id}
                  getOptionSection={conceptComboboxSectionGetter}
                  renderSectionLabel={(section) => (
                    <ConceptCatalogSectionLabel section={section} />
                  )}
                  showOptionIndicator={false}
                  onValueChange={(nextValue) => {
                    setShowConceptSeedOptions(false);
                    applyDescriptionWithCatalog(nextValue);
                  }}
                  onOptionSelect={handleApplyConceptAutocomplete}
                  openOnEnterWhenClosed
                  onInputFocus={() => setShowConceptSeedOptions(true)}
                  onInputBlur={() => setShowConceptSeedOptions(false)}
                  onInputClick={() => setShowConceptSeedOptions(true)}
                  onInputKeyDown={(event) => onConceptGridFieldKeyDown?.(item.id, "concept", event)}
                  onInputEnter={handleConceptInputEnter}
                  autoFocusInput={activateComboboxOnMount}
                  activateOnMount={activateComboboxOnMount}
                  onActivated={() => {
                    setShowConceptSeedOptions(true);
                    onComboboxActivated?.();
                  }}
                  actions={conceptComboboxActions}
                  renderOption={(entry) => (
                    <ConceptCatalogOptionContent
                      entry={entry}
                      currency={currency}
                      budgetNumericFontClass={budgetNumericFontClass}
                    />
                  )}
                />
              </>
            ) : (
              <div
                className={cn(
                  "flex h-10 items-center rounded-[8px] px-2 text-[14px] font-normal",
                  item.description ? "text-[#171717]" : "text-[#b7b7b7]",
                  invalidFields?.concept && errorStaticFieldClassName,
                )}
              >
                {item.description || BUDGET_CONCEPT_PLACEHOLDER}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reorder row"
              title="Reorder row"
              className={cn(
                "h-7 w-7 cursor-grab text-zinc-400 opacity-0 hover:text-zinc-700 active:cursor-grabbing",
                "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                isDragging && "pointer-events-auto opacity-100",
              )}
              {...attributes}
              {...listeners}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Combobox<ConceptCatalogEntry>
              value={item.description}
              options={conceptComboboxOptions}
              placeholder="Description"
              className="w-full"
              contentClassName={conceptComboboxContentClass}
              inputClassName={cn(conceptRowFieldClass, "w-full")}
              aria-invalid={invalidFields?.concept || undefined}
              inputDataAttributes={{
                "data-concept-grid-row-id": item.id,
                "data-concept-grid-field": "concept",
                "data-concept-grid-input-kind": "combobox",
              }}
              emptyText={
                item.description.trim() ? `No matches for "${item.description.trim()}".` : " "
              }
              getOptionLabel={(entry) => entry.description}
              getOptionKey={(entry) => entry.id}
              getOptionSection={conceptComboboxSectionGetter}
              renderSectionLabel={(section) => (
                <ConceptCatalogSectionLabel section={section} />
              )}
              showOptionIndicator={false}
              onValueChange={(nextValue) => {
                setShowConceptSeedOptions(false);
                applyDescriptionWithCatalog(nextValue);
              }}
              onOptionSelect={handleApplyConceptAutocomplete}
              openOnEnterWhenClosed
              onInputFocus={() => setShowConceptSeedOptions(true)}
              onInputBlur={() => setShowConceptSeedOptions(false)}
              onInputClick={() => setShowConceptSeedOptions(true)}
              onInputKeyDown={(event) => onConceptGridFieldKeyDown?.(item.id, "concept", event)}
              onInputEnter={handleConceptInputEnter}
              autoFocusInput={activateComboboxOnMount}
              activateOnMount={activateComboboxOnMount}
              onActivated={() => {
                setShowConceptSeedOptions(true);
                onComboboxActivated?.();
              }}
              actions={conceptComboboxActions}
              renderOption={(entry) => (
                <ConceptCatalogOptionContent
                  entry={entry}
                  currency={currency}
                  budgetNumericFontClass={budgetNumericFontClass}
                />
              )}
            />
          </div>
        )}
      </TableCell>
      <TableCell
        className={cn(isBudgetStyle && "pl-0 py-0 pr-4")}
        style={
          isBudgetStyle && budgetColumnWidths
            ? { width: `${budgetColumnWidths.quantity}px` }
            : undefined
        }
      >
        <div
          data-budget-print-quantity-field={isBudgetStyle ? "true" : undefined}
          data-budget-print-value={isBudgetStyle ? String(item.quantity ?? 0) : undefined}
        >
          {isBudgetStyle && !isInteractive ? (
            <span
              className={cn(
                "flex h-10 items-center rounded-[8px] pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums",
                invalidFields?.quantity && errorStaticFieldClassName,
                budgetNumericFontClass,
              )}
            >
              {item.quantity ?? 0}
            </span>
          ) : (
            <Input
              type="number"
              min={0}
              value={item.quantity ?? ""}
              onChange={(event) =>
                onUpdateItem(item.id, {
                  ...item,
                  quantity: parseEditableNumber(event.target.value),
                })
              }
              data-concept-grid-row-id={item.id}
              data-concept-grid-field="quantity"
              aria-invalid={invalidFields?.quantity || undefined}
              className={cn(
                isBudgetStyle ? budgetNumericFieldClass : conceptRowFieldClass,
                !isBudgetStyle && invalidFields?.quantity && errorFieldClassName,
                isBudgetStyle
                  ? cn("w-full pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums", budgetNumericFontClass)
                  : "ml-auto w-[72px] text-right font-mono tabular-nums",
              )}
              onKeyDown={(event) => onConceptGridFieldKeyDown?.(item.id, "quantity", event)}
            />
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(isBudgetStyle && "pl-0 py-0 pr-4")}
        style={
          isBudgetStyle && budgetColumnWidths
            ? { width: `${budgetColumnWidths.unitPrice}px` }
            : undefined
        }
      >
        <div
          data-budget-print-unit-price-field={isBudgetStyle ? "true" : undefined}
          data-budget-print-value={isBudgetStyle ? String(item.unitPrice ?? 0) : undefined}
        >
          {isBudgetStyle && !isInteractive ? (
            <span
              className={cn(
                "flex h-10 items-center rounded-[8px] pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums",
                invalidFields?.unitPrice && errorStaticFieldClassName,
                budgetNumericFontClass,
              )}
            >
              {item.unitPrice ?? 0}
            </span>
          ) : (
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.unitPrice ?? ""}
              onChange={(event) =>
                onUpdateItem(item.id, {
                  ...item,
                  unitPrice: parseEditableNumber(event.target.value),
                })
              }
              data-concept-grid-row-id={item.id}
              data-concept-grid-field="unitPrice"
              aria-invalid={invalidFields?.unitPrice || undefined}
              className={cn(
                isBudgetStyle ? budgetNumericFieldClass : conceptRowFieldClass,
                !isBudgetStyle && invalidFields?.unitPrice && errorFieldClassName,
                isBudgetStyle
                  ? cn("w-full pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums", budgetNumericFontClass)
                  : "ml-auto w-[72px] text-right font-mono tabular-nums",
              )}
              onKeyDown={(event) => onConceptGridFieldKeyDown?.(item.id, "unitPrice", event)}
            />
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          "text-[14px] font-normal tabular-nums text-[#0a0a0a]",
          isBudgetStyle ? budgetNumericFontClass : "font-mono",
          isBudgetStyle && "px-0 py-0",
        )}
        style={
          isBudgetStyle && budgetColumnWidths
            ? { width: `${budgetColumnWidths.total}px` }
            : undefined
        }
      >
        {isBudgetStyle ? (
          <span className="block whitespace-nowrap pr-0 text-right">
            {formatMoney(animatedLineBase, currency)}
          </span>
        ) : (
          <div className="grid grid-cols-[1fr_62px] items-center gap-2">
            <span className="text-right">{formatMoney(animatedLineBase, currency)}</span>
            <div
              className={cn(
                "flex items-center justify-end gap-1 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                isActionRailVisible && "pointer-events-auto opacity-100",
              )}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onActionButtonIntent?.(item.id, "add");
                  onAddItemBelow(item.id, { activateCombobox: true });
                }}
                aria-label="Add row below"
                title="Add row below"
                className="h-7 w-7"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onActionButtonIntent?.(item.id, "remove");
                  onRemoveItem(item.id);
                }}
                disabled={!canRemove}
                aria-label="Delete row"
                title="Delete row"
                className="h-7 w-7"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
