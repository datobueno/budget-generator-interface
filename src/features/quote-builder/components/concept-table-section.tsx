import {
  Fragment,
  type DragEventHandler,
  type KeyboardEvent,
  type MutableRefObject,
  type Ref,
} from "react";

import { FileSpreadsheet } from "lucide-react";

import { Combobox } from "@/components/ui/combobox";
import type { ComboboxAction } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getConceptCategoryLabel,
  type ConceptCatalogEntry,
} from "@/entities/concept";
import {
  CURRENCY_INPUT_PREFIX,
  CURRENCY_OPTIONS,
  getCurrencySymbol,
  type CurrencyOption,
} from "@/entities/currency";
import { formatMoney, type QuoteItem } from "@/entities/quote";
import type { PdfExportValidationErrors } from "@/features/pdf-export";
import type { LinkedGoogleSpreadsheet } from "@/features/google-sheets";
import {
  BUDGET_CONCEPT_PLACEHOLDER,
  EMPTY_CONCEPT_ROW_ID,
  type ConceptGridField,
} from "@/features/quote-builder/model/constants";
import { toItemDndId } from "@/features/quote-builder/lib/dnd";
import type { RowActionButtonKind } from "@/features/quote-builder/model/types";
import type {
  BudgetSheetStaticLayout,
  ConceptPage,
  ConceptPageFocusBehavior,
  GroupedCategory,
} from "@/features/quote-preview";
import { BudgetTableColGroup } from "@/features/quote-preview";
import { cn } from "@/shared/lib/utils";

import { BudgetImportActionButton } from "./budget-import-action-button";
import {
  ConceptCatalogOptionContent,
  ConceptCatalogSectionLabel,
} from "./concept-catalog-option-content";
import { SortableCategoryRow } from "./sortable-category-row";
import { SortableConceptRow } from "./sortable-concept-row";
import { BudgetStaticField } from "@/features/quote-preview";

const budgetTableHeaderCellClass = "h-14 px-0 py-0 align-middle";
const budgetTableGapCellClass = "pr-4";
const budgetPendingFieldTextClass = "text-[#b7b7b7] placeholder:text-[#b7b7b7] focus:text-[#b7b7b7]";
const exportStaticFieldErrorClass = "bg-[#fef2f2] ring-1 ring-inset ring-[#dc2626]";

function parseEmptyConceptDraftNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
}

function formatCurrencyOptionListLabel(option: CurrencyOption): string {
  return getCurrencySymbol(option.code);
}

function shouldShowCurrencyCodeLabel(option: CurrencyOption): boolean {
  const symbol = getCurrencySymbol(option.code);
  const symbolCount = CURRENCY_OPTIONS.reduce((count, candidate) => {
    return count + (getCurrencySymbol(candidate.code) === symbol ? 1 : 0);
  }, 0);

  return symbolCount > 1;
}

type ConceptTableSectionProps = {
  conceptPage: ConceptPage;
  sheetIndex: number;
  conceptPagesLength: number;
  items: QuoteItem[];
  conceptCatalog: ConceptCatalogEntry[];
  currency: string;
  currencyComboboxValue: string;
  currencyOptions: CurrencyOption[];
  isCurrencyUpdating: boolean;
  isBudgetDocument: boolean;
  isBudgetSheetActive: boolean;
  isBudgetSheetInteractive: boolean;
  isFirstSheet: boolean;
  isPageEmpty: boolean;
  emptyConceptDraft: string;
  emptyConceptQuantityDraft: number | null;
  emptyConceptUnitPriceDraft: number | null;
  animatedEmptyConceptLineBase: number;
  emptyConceptAutocompleteMatches: ConceptCatalogEntry[];
  emptyConceptComboboxActions: ComboboxAction[];
  budgetHeaderImportActions: ComboboxAction[];
  linkedQuoteSpreadsheet: LinkedGoogleSpreadsheet | null;
  linkedConceptCatalogSpreadsheet: LinkedGoogleSpreadsheet | null;
  isQuoteImporting: boolean;
  isConceptCatalogImporting: boolean;
  visibleConceptRowActionsId: string | null;
  activeConceptComboboxId: string | null;
  activeDraggedItemDndId: string | null;
  visiblePdfExportErrors: PdfExportValidationErrors;
  invalidItemDescriptionIds: Set<string>;
  invalidItemQuantityIds: Set<string>;
  invalidItemUnitPriceIds: Set<string>;
  emptyConceptBodyHeight: number;
  emptyBudgetConceptFillerHeight: number;
  conceptBodyFillerHeight: number;
  budgetConceptColumnWidthPx: number;
  budgetHasActionColumn: boolean;
  budgetTableColumnCount: number;
  budgetSheetStaticLayout: BudgetSheetStaticLayout;
  firstConceptHeadingRef?: Ref<HTMLDivElement>;
  firstTableHeaderRef?: Ref<HTMLTableSectionElement>;
  lastContentRowRef?: MutableRefObject<HTMLTableRowElement | null>;
  onConceptTableKeyDownCapture: (event: KeyboardEvent<HTMLTableElement>) => void;
  onOpenImport: () => void;
  onSpreadsheetDragOver: DragEventHandler<HTMLDivElement>;
  onSpreadsheetDragLeave: DragEventHandler<HTMLDivElement>;
  onSpreadsheetDrop: DragEventHandler<HTMLDivElement>;
  isSpreadsheetDragOver: boolean;
  onCurrencyComboboxValueChange: (nextValue: string) => void;
  onApplyCurrencyChange: (currencyCode: string) => Promise<void>;
  onSetEmptyConceptDraft: (nextValue: string) => void;
  onSetEmptyConceptQuantityDraft: (nextValue: number | null) => void;
  onSetEmptyConceptUnitPriceDraft: (nextValue: number | null) => void;
  onAddFirstConceptFromEmpty: (
    description: string,
    selectedEntry?: ConceptCatalogEntry | null,
    options?: {
      focusField?: ConceptGridField;
      activateNextCombobox?: boolean;
    },
  ) => boolean;
  onConceptGridFieldKeyDown: (
    rowId: string,
    field: ConceptGridField,
    event: KeyboardEvent<HTMLInputElement>,
  ) => void;
  onEmptyConceptInputEnter: (rawValue: string, event: KeyboardEvent<HTMLInputElement>) => void;
  onRequestQuoteSpreadsheetImport: () => void;
  onRequestLinkedQuoteSpreadsheetImport: () => void;
  onRequestConceptCatalogImport: () => void;
  onRequestLinkedConceptCatalogSpreadsheetImport: () => void;
  onOpenConceptCatalogFileUpload: () => void;
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
  onRemoveItem: (id: string) => void;
  onCategoryMeasureRef: (category: string, element: HTMLTableRowElement | null) => void;
  onItemMeasureRef: (itemId: string, element: HTMLTableRowElement | null) => void;
  onActivateCombobox: (itemId: string) => void;
  onActionRailEnter: (itemId: string) => void;
  onActionRailLeave: (itemId: string) => void;
  onActionButtonIntent: (itemId: string, action: RowActionButtonKind) => void;
  conceptRowFieldClass: string;
  conceptComboboxContentClass: string;
  budgetSecondaryFieldClass: string;
  budgetNumericFontClass: string;
};

function ConceptTableHeader({
  budgetHasActionColumn,
  budgetHeaderImportActions,
  isFirstSheet,
  isBudgetDocument,
  isBudgetSheetInteractive,
  isCurrencyUpdating,
  budgetSheetStaticLayout,
  currencyComboboxValue,
  currencyOptions,
  onCurrencyComboboxValueChange,
  onApplyCurrencyChange,
}: {
  budgetHasActionColumn: boolean;
  budgetHeaderImportActions: ComboboxAction[];
  isFirstSheet: boolean;
  isBudgetDocument: boolean;
  isBudgetSheetInteractive: boolean;
  isCurrencyUpdating: boolean;
  budgetSheetStaticLayout: BudgetSheetStaticLayout;
  currencyComboboxValue: string;
  currencyOptions: CurrencyOption[];
  onCurrencyComboboxValueChange: (nextValue: string) => void;
  onApplyCurrencyChange: (currencyCode: string) => Promise<void>;
}) {
  return (
    <TableRow>
      {budgetHasActionColumn ? (
        <TableHead
          className={budgetTableHeaderCellClass}
          style={{ width: `${budgetSheetStaticLayout.tableColumnWidths.action}px` }}
        >
          {isFirstSheet ? (
            <div className="flex h-14 items-center justify-start">
              <BudgetImportActionButton
                actions={budgetHeaderImportActions}
                disabled={!isBudgetSheetInteractive}
              />
            </div>
          ) : (
            <div aria-hidden className="h-14" />
          )}
        </TableHead>
      ) : null}
      <TableHead
        className={cn(
          isBudgetDocument ? cn(budgetTableHeaderCellClass, budgetTableGapCellClass) : "pl-0",
          !isBudgetDocument && "w-[52%]",
        )}
        style={
          isBudgetDocument
            ? { width: `${budgetSheetStaticLayout.tableColumnWidths.concept}px` }
            : undefined
        }
      >
        <span className="sr-only">Item</span>
      </TableHead>
      <TableHead
        className={cn(
          "text-[14px] font-normal text-[#737373]",
          isBudgetDocument
            ? cn(budgetTableHeaderCellClass, budgetTableGapCellClass, "text-left")
            : "w-[92px] text-right",
        )}
        style={
          isBudgetDocument
            ? { width: `${budgetSheetStaticLayout.tableColumnWidths.quantity}px` }
            : undefined
        }
      >
        {isBudgetDocument ? <span className="block pl-2">#</span> : "Qty."}
      </TableHead>
      <TableHead
        className={cn(
          "text-[14px] font-normal text-[#737373]",
          isBudgetDocument
            ? cn(budgetTableHeaderCellClass, budgetTableGapCellClass, "text-left")
            : "w-[128px] text-right",
        )}
        style={
          isBudgetDocument
            ? { width: `${budgetSheetStaticLayout.tableColumnWidths.unitPrice}px` }
            : undefined
        }
      >
        {isBudgetDocument ? (
          <div data-budget-print-currency-header="true" data-budget-print-currency-header-value={currencyComboboxValue}>
            <Combobox<CurrencyOption>
              value={currencyComboboxValue}
              options={currencyOptions}
              externalFilter
              placeholder="u/€"
              disabled={!isBudgetSheetInteractive || isCurrencyUpdating}
              className="min-h-9 w-full rounded-md"
              contentClassName="w-[96px] [&_[data-slot=combobox-list]]:max-h-[170px]"
              inputClassName={cn(
                "h-9 w-full pl-2 pr-1 text-left text-[14px] font-normal",
                budgetPendingFieldTextClass,
                (isCurrencyUpdating || !isBudgetSheetInteractive) && "cursor-wait opacity-70",
              )}
              emptyText="No matching currencies."
              getOptionLabel={(option) => `${CURRENCY_INPUT_PREFIX}${option.label} ${option.code}`}
              getOptionKey={(option) => option.code}
              onValueChange={onCurrencyComboboxValueChange}
              onOptionSelect={(option) => {
                void onApplyCurrencyChange(option.code);
              }}
              renderOption={(option) => (
                <div className="min-w-0 whitespace-nowrap">
                  <span className="text-[14px] font-normal text-muted-foreground">
                    {formatCurrencyOptionListLabel(option)}
                  </span>
                  {shouldShowCurrencyCodeLabel(option) ? (
                    <span className="ml-1 text-[12px] font-normal text-muted-foreground">
                      {option.code}
                    </span>
                  ) : null}
                </div>
              )}
            />
          </div>
        ) : (
          "Price"
        )}
      </TableHead>
      <TableHead
        className={cn(
          "text-[14px] font-normal text-[#737373]",
          isBudgetDocument ? cn(budgetTableHeaderCellClass, "text-left") : "w-[142px] text-right",
        )}
        style={
          isBudgetDocument
            ? { width: `${budgetSheetStaticLayout.tableColumnWidths.total}px` }
            : undefined
        }
      >
        {isBudgetDocument ? <span className="block w-full pl-6 text-left">Total</span> : "Total"}
      </TableHead>
    </TableRow>
  );
}

export function ConceptTableSection({
  conceptPage,
  sheetIndex,
  conceptPagesLength,
  items,
  conceptCatalog,
  currency,
  currencyComboboxValue,
  currencyOptions,
  isCurrencyUpdating,
  isBudgetDocument,
  isBudgetSheetActive,
  isBudgetSheetInteractive,
  isFirstSheet,
  isPageEmpty,
  emptyConceptDraft,
  emptyConceptQuantityDraft,
  emptyConceptUnitPriceDraft,
  animatedEmptyConceptLineBase,
  emptyConceptAutocompleteMatches,
  emptyConceptComboboxActions,
  budgetHeaderImportActions,
  linkedQuoteSpreadsheet,
  linkedConceptCatalogSpreadsheet,
  isQuoteImporting,
  isConceptCatalogImporting,
  visibleConceptRowActionsId,
  activeConceptComboboxId,
  activeDraggedItemDndId,
  visiblePdfExportErrors,
  invalidItemDescriptionIds,
  invalidItemQuantityIds,
  invalidItemUnitPriceIds,
  emptyConceptBodyHeight,
  emptyBudgetConceptFillerHeight,
  conceptBodyFillerHeight,
  budgetConceptColumnWidthPx,
  budgetHasActionColumn,
  budgetTableColumnCount,
  budgetSheetStaticLayout,
  firstConceptHeadingRef,
  firstTableHeaderRef,
  lastContentRowRef,
  onConceptTableKeyDownCapture,
  onOpenImport,
  onSpreadsheetDragOver,
  onSpreadsheetDragLeave,
  onSpreadsheetDrop,
  isSpreadsheetDragOver,
  onCurrencyComboboxValueChange,
  onApplyCurrencyChange,
  onSetEmptyConceptDraft,
  onSetEmptyConceptQuantityDraft,
  onSetEmptyConceptUnitPriceDraft,
  onAddFirstConceptFromEmpty,
  onConceptGridFieldKeyDown,
  onEmptyConceptInputEnter,
  onRequestQuoteSpreadsheetImport,
  onRequestLinkedQuoteSpreadsheetImport,
  onRequestConceptCatalogImport,
  onRequestLinkedConceptCatalogSpreadsheetImport,
  onOpenConceptCatalogFileUpload,
  onUpdateItem,
  onAddItemBelow,
  onRemoveItem,
  onCategoryMeasureRef,
  onItemMeasureRef,
  onActivateCombobox,
  onActionRailEnter,
  onActionRailLeave,
  onActionButtonIntent,
  conceptRowFieldClass,
  conceptComboboxContentClass,
  budgetSecondaryFieldClass,
  budgetNumericFontClass,
}: ConceptTableSectionProps) {
  return (
    <section
      className={cn(isBudgetDocument ? "min-w-0 space-y-0" : "space-y-3", isBudgetDocument && "flex-1")}
    >
      {isBudgetDocument ? (
        <div ref={isFirstSheet ? firstConceptHeadingRef : undefined} className="h-0 overflow-hidden" />
      ) : (
        <div ref={isFirstSheet ? firstConceptHeadingRef : undefined} className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-800">
            {isFirstSheet ? "Items" : `Items (Page ${sheetIndex + 1})`}
          </h2>
        </div>
      )}

      {isPageEmpty ? (
        <Table
          className="table-fixed"
          containerClassName={isBudgetDocument ? "overflow-visible" : undefined}
          onKeyDownCapture={onConceptTableKeyDownCapture}
        >
          {isBudgetDocument ? <BudgetTableColGroup widths={budgetSheetStaticLayout.tableColumnWidths} /> : null}
          <TableHeader
            ref={isFirstSheet ? firstTableHeaderRef : undefined}
            className={cn(isBudgetDocument && "[&_tr]:border-0")}
          >
            <ConceptTableHeader
              budgetHasActionColumn={budgetHasActionColumn}
              budgetHeaderImportActions={budgetHeaderImportActions}
              isFirstSheet={isFirstSheet}
              isBudgetDocument={isBudgetDocument}
              isBudgetSheetInteractive={isBudgetSheetInteractive}
              isCurrencyUpdating={isCurrencyUpdating}
              budgetSheetStaticLayout={budgetSheetStaticLayout}
              currencyComboboxValue={currencyComboboxValue}
              currencyOptions={currencyOptions}
              onCurrencyComboboxValueChange={onCurrencyComboboxValueChange}
              onApplyCurrencyChange={onApplyCurrencyChange}
            />
          </TableHeader>
          <TableBody className="[&_tr]:border-0">
            {isBudgetDocument ? (
              <>
                <TableRow
                  ref={sheetIndex === conceptPagesLength - 1 ? lastContentRowRef : undefined}
                  className="h-10 hover:bg-transparent"
                >
                  <TableCell
                    colSpan={budgetHasActionColumn ? 2 : undefined}
                    className={cn("py-0 pl-0", budgetTableGapCellClass)}
                    style={{ width: `${budgetConceptColumnWidthPx}px` }}
                  >
                    {isBudgetSheetInteractive ? (
                      <Combobox<ConceptCatalogEntry>
                        value={emptyConceptDraft}
                        options={emptyConceptAutocompleteMatches}
                        placeholder={BUDGET_CONCEPT_PLACEHOLDER}
                        className="w-full"
                        contentClassName={conceptComboboxContentClass}
                        inputClassName={cn(conceptRowFieldClass, "w-full")}
                        aria-invalid={visiblePdfExportErrors.emptyConceptDraft || undefined}
                        inputDataAttributes={{
                          "data-concept-grid-row-id": EMPTY_CONCEPT_ROW_ID,
                          "data-concept-grid-field": "concept",
                          "data-concept-grid-input-kind": "combobox",
                        }}
                        emptyText={
                          emptyConceptDraft.trim()
                            ? `No matches for "${emptyConceptDraft.trim()}".`
                            : conceptCatalog.length === 0
                              ? "Write your first good or service"
                              : " "
                        }
                        getOptionLabel={(entry) => entry.description}
                        getOptionKey={(entry) => entry.id}
                        getOptionSection={(entry) => getConceptCategoryLabel(entry.category)}
                        renderSectionLabel={(section) => <ConceptCatalogSectionLabel section={section} />}
                        showOptionIndicator={false}
                        onValueChange={onSetEmptyConceptDraft}
                        onOptionSelect={(entry) => onAddFirstConceptFromEmpty(entry.description, entry)}
                        onInputKeyDown={(event) =>
                          onConceptGridFieldKeyDown(EMPTY_CONCEPT_ROW_ID, "concept", event)
                        }
                        onInputEnter={onEmptyConceptInputEnter}
                        actions={emptyConceptComboboxActions}
                        renderOption={(entry) => (
                          <ConceptCatalogOptionContent
                            entry={entry}
                            currency={currency}
                            budgetNumericFontClass={budgetNumericFontClass}
                          />
                        )}
                      />
                    ) : (
                      <BudgetStaticField
                        value={emptyConceptDraft}
                        placeholder={BUDGET_CONCEPT_PLACEHOLDER}
                        className={cn(
                          conceptRowFieldClass,
                          "h-10 w-full text-[#171717]",
                          visiblePdfExportErrors.emptyConceptDraft && exportStaticFieldErrorClass,
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell
                    className={cn("pl-0 py-0", budgetTableGapCellClass)}
                    style={{ width: `${budgetSheetStaticLayout.tableColumnWidths.quantity}px` }}
                  >
                    {isBudgetSheetInteractive ? (
                      <Input
                        type="number"
                        min={0}
                        value={emptyConceptQuantityDraft ?? ""}
                        placeholder="0"
                        data-concept-grid-row-id={EMPTY_CONCEPT_ROW_ID}
                        data-concept-grid-field="quantity"
                        className={cn(
                          budgetSecondaryFieldClass,
                          "w-full pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums",
                          budgetNumericFontClass,
                        )}
                        onFocus={() => {
                          if (!emptyConceptDraft.trim()) return;
                          onAddFirstConceptFromEmpty(emptyConceptDraft, undefined, {
                            focusField: "quantity",
                          });
                        }}
                        onChange={(event) =>
                          onSetEmptyConceptQuantityDraft(
                            parseEmptyConceptDraftNumber(event.target.value),
                          )
                        }
                        onKeyDown={(event) =>
                          onConceptGridFieldKeyDown(EMPTY_CONCEPT_ROW_ID, "quantity", event)
                        }
                      />
                    ) : (
                      <div className={cn("h-10 rounded-[8px] pl-2 pr-1 text-[14px] font-normal text-[#0a0a0a]", budgetNumericFontClass)}>
                        <span className="flex h-full items-center">{emptyConceptQuantityDraft ?? 0}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn("pl-0 py-0", budgetTableGapCellClass)}
                    style={{ width: `${budgetSheetStaticLayout.tableColumnWidths.unitPrice}px` }}
                  >
                    {isBudgetSheetInteractive ? (
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={emptyConceptUnitPriceDraft ?? ""}
                        placeholder="0"
                        data-concept-grid-row-id={EMPTY_CONCEPT_ROW_ID}
                        data-concept-grid-field="unitPrice"
                        className={cn(
                          budgetSecondaryFieldClass,
                          "w-full pl-2 pr-1 text-left text-[#0a0a0a] tabular-nums",
                          budgetNumericFontClass,
                        )}
                        onFocus={() => {
                          if (!emptyConceptDraft.trim()) return;
                          onAddFirstConceptFromEmpty(emptyConceptDraft, undefined, {
                            focusField: "unitPrice",
                          });
                        }}
                        onChange={(event) =>
                          onSetEmptyConceptUnitPriceDraft(
                            parseEmptyConceptDraftNumber(event.target.value),
                          )
                        }
                        onKeyDown={(event) =>
                          onConceptGridFieldKeyDown(EMPTY_CONCEPT_ROW_ID, "unitPrice", event)
                        }
                      />
                    ) : (
                      <div className={cn("h-10 rounded-[8px] pl-2 pr-0 text-[14px] font-normal text-[#0a0a0a] text-left", budgetNumericFontClass)}>
                        <span className="flex h-full items-center">{emptyConceptUnitPriceDraft ?? 0}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell
                    className="px-0 py-0"
                    style={{ width: `${budgetSheetStaticLayout.tableColumnWidths.total}px` }}
                  >
                    <div className={cn("h-10 rounded-[8px] pl-0 pr-0 text-[14px] font-normal text-[#0a0a0a] text-right", budgetNumericFontClass)}>
                      <span className="flex h-full items-center justify-end">
                        {formatMoney(animatedEmptyConceptLineBase, currency)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {emptyBudgetConceptFillerHeight > 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={budgetTableColumnCount}
                      className="p-0"
                      style={{ height: `${emptyBudgetConceptFillerHeight}px` }}
                    />
                  </TableRow>
                ) : null}
              </>
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <div
                    role={isFirstSheet ? "button" : undefined}
                    tabIndex={isFirstSheet ? 0 : -1}
                    onClick={isFirstSheet ? onOpenImport : undefined}
                    onKeyDown={
                      isFirstSheet
                        ? (event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            onOpenImport();
                          }
                        : undefined
                    }
                    onDragOver={isFirstSheet ? onSpreadsheetDragOver : undefined}
                    onDragLeave={isFirstSheet ? onSpreadsheetDragLeave : undefined}
                    onDrop={isFirstSheet ? onSpreadsheetDrop : undefined}
                    style={{ height: `${emptyConceptBodyHeight}px` }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center transition-colors",
                      isFirstSheet
                        ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800 focus-visible:ring-offset-2"
                        : "cursor-default",
                      isSpreadsheetDragOver && isFirstSheet
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-300 bg-zinc-50/70",
                    )}
                  >
                    <FileSpreadsheet className="mb-3 h-6 w-6 text-zinc-500" />
                    <p className="text-sm font-medium text-zinc-700">
                      Drag your spreadsheet here to fill the items
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Supported formats: .xlsx, .xls, .csv</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <Table
          className="table-fixed"
          containerClassName={isBudgetDocument ? "overflow-visible" : undefined}
          onKeyDownCapture={onConceptTableKeyDownCapture}
        >
          {isBudgetDocument ? <BudgetTableColGroup widths={budgetSheetStaticLayout.tableColumnWidths} /> : null}
          <TableHeader
            ref={isFirstSheet ? firstTableHeaderRef : undefined}
            className={cn(isBudgetDocument && "[&_tr]:border-0")}
          >
            <ConceptTableHeader
              budgetHasActionColumn={budgetHasActionColumn}
              budgetHeaderImportActions={budgetHeaderImportActions}
              isFirstSheet={isFirstSheet}
              isBudgetDocument={isBudgetDocument}
              isBudgetSheetInteractive={isBudgetSheetActive}
              isCurrencyUpdating={isCurrencyUpdating}
              budgetSheetStaticLayout={budgetSheetStaticLayout}
              currencyComboboxValue={currencyComboboxValue}
              currencyOptions={currencyOptions}
              onCurrencyComboboxValueChange={onCurrencyComboboxValueChange}
              onApplyCurrencyChange={onApplyCurrencyChange}
            />
          </TableHeader>
          <TableBody className="[&_tr]:border-0">
            {conceptPage.groups.map((group: GroupedCategory, groupIndex) => (
              <Fragment key={group.category}>
                {groupIndex > 0 && !isBudgetDocument ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-8 p-0" />
                  </TableRow>
                ) : null}
                {group.isContinuation ? null : (
                  <SortableCategoryRow
                    category={group.category}
                    isBudgetStyle={isBudgetDocument}
                    budgetColumnCount={budgetTableColumnCount}
                    budgetLeadingOffsetPx={8}
                    isDimmed={Boolean(activeDraggedItemDndId)}
                    onMeasureRef={(node) => onCategoryMeasureRef(group.category, node)}
                  />
                )}
                {group.items.map((item, itemIndex) => (
                  <SortableConceptRow
                    key={item.id}
                    dndId={toItemDndId(item.id)}
                    item={item}
                    category={group.category}
                    currency={currency}
                    conceptCatalog={conceptCatalog}
                    isBudgetStyle={isBudgetDocument}
                    canRemove={items.length > 0}
                    onRequestQuoteImport={onOpenImport}
                    onRequestQuoteSpreadsheetImport={onRequestQuoteSpreadsheetImport}
                    onRequestLinkedQuoteSpreadsheetImport={onRequestLinkedQuoteSpreadsheetImport}
                    linkedQuoteSpreadsheet={linkedQuoteSpreadsheet}
                    isQuoteImporting={isQuoteImporting}
                    onRequestConceptCatalogImport={onRequestConceptCatalogImport}
                    onRequestLinkedConceptCatalogSpreadsheetImport={
                      onRequestLinkedConceptCatalogSpreadsheetImport
                    }
                    linkedConceptCatalogSpreadsheet={linkedConceptCatalogSpreadsheet}
                    onRequestConceptCatalogFileUpload={onOpenConceptCatalogFileUpload}
                    isConceptCatalogImporting={isConceptCatalogImporting}
                    isLastRow={items[items.length - 1]?.id === item.id}
                    isInteractive={!isBudgetDocument || isBudgetSheetActive}
                    isActionRailVisible={visibleConceptRowActionsId === item.id}
                    isDimmed={
                      Boolean(activeDraggedItemDndId) &&
                      activeDraggedItemDndId !== toItemDndId(item.id)
                    }
                    invalidFields={{
                      concept: invalidItemDescriptionIds.has(item.id),
                      quantity: invalidItemQuantityIds.has(item.id),
                      unitPrice: invalidItemUnitPriceIds.has(item.id),
                    }}
                    onUpdateItem={onUpdateItem}
                    onAddItemBelow={onAddItemBelow}
                    activateComboboxOnMount={activeConceptComboboxId === item.id}
                    onComboboxActivated={() => onActivateCombobox(item.id)}
                    onConceptGridFieldKeyDown={onConceptGridFieldKeyDown}
                    onActionRailEnter={onActionRailEnter}
                    onActionRailLeave={onActionRailLeave}
                    onActionButtonIntent={onActionButtonIntent}
                    onRemoveItem={onRemoveItem}
                    onMeasureRef={(node) => {
                      onItemMeasureRef(item.id, node);
                      if (
                        sheetIndex === conceptPagesLength - 1 &&
                        groupIndex === conceptPage.groups.length - 1 &&
                        itemIndex === group.items.length - 1 &&
                        lastContentRowRef
                      ) {
                        lastContentRowRef.current = node;
                      }
                    }}
                    budgetColumnWidths={budgetSheetStaticLayout.tableColumnWidths}
                    budgetNumericFieldClass={budgetSecondaryFieldClass}
                    conceptRowFieldClass={conceptRowFieldClass}
                    conceptComboboxContentClass={conceptComboboxContentClass}
                    budgetNumericFontClass={budgetNumericFontClass}
                  />
                ))}
              </Fragment>
            ))}
            {conceptBodyFillerHeight > 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={budgetTableColumnCount}
                  className="p-0"
                  style={{ height: `${conceptBodyFillerHeight}px` }}
                />
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
