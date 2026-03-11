import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import type { ComboboxAction } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { normalizeImportHeader } from "@/features/spreadsheet-import";
import { showCustomerFacingErrorToast } from "@/shared/lib/customer-facing-errors";
import { useAnimatedNumber } from "@/shared/lib/use-animated-number";
import { cn } from "@/shared/lib/utils";
import { DOCUMENT_LABELS } from "@/shared/constants";
import {
  getQuoteTotals,
  type DocumentKind,
  type QuoteItem,
} from "@/entities/quote";
import { initialClient, type ClientDetails } from "@/entities/client";
import {
  DEFAULT_CONCEPT_CATEGORY as DEFAULT_CATEGORY,
  searchConceptCatalogAcrossCategories,
  sortConceptCatalogEntriesByCategory,
  type ConceptCatalogEntry,
} from "@/entities/concept";
import {
  CURRENCY_OPTIONS,
  extractCurrencyComboboxQuery,
  fetchFrankfurterRates,
  formatUnitPriceHeaderLabel,
  getCurrencySymbol,
  normalizeCurrencyComboboxInput,
  normalizeCurrencyCode,
  resolveRateFromEur,
  scaleMoney,
} from "@/entities/currency";
import {
  CONCEPT_GRID_FIELDS,
  EMPTY_CONCEPT_ROW_ID,
  ConceptTableSection,
  RowActionButtonKind,
  fromCategoryDndId,
  fromItemDndId,
  getCategoryOrder,
  toCategoryDndId,
  toItemDndId,
  type ConceptGridField,
} from "@/features/quote-builder";
import {
  BUDGET_COMPANY_REFERENCE_LINES,
  BUDGET_HEADER_TO_CONCEPT_GAP_PX,
  BUDGET_ITEM_ROW_HEIGHT_PX,
  BUDGET_SHEET_PREVIEW_GAP_PX,
  BudgetDownloadButton,
  BudgetOrientationToggleButton,
  BudgetSheetHeader,
  BudgetSummarySection,
  BudgetSubtotalBlock,
  CONCEPT_SECTION_INNER_GAP_PX,
  DEFAULT_BUDGET_SHEET_ORIENTATION,
  DEFAULT_CATEGORY_ROW_HEIGHT_PX,
  DEFAULT_CONTINUATION_CONCEPT_CHROME_HEIGHT_PX,
  DEFAULT_FIRST_CONCEPT_CHROME_HEIGHT_PX,
  DEFAULT_FIRST_PRE_CONCEPT_HEIGHT_PX,
  DEFAULT_ITEM_ROW_HEIGHT_PX,
  DEFAULT_SUMMARY_RESERVE_HEIGHT_PX,
  GROUP_SPACER_ROW_HEIGHT_PX,
  SHEET_SECTION_GAP_PX,
  SUMMARY_PAGINATION_GUARD_PX,
  buildBudgetSheetStaticLayout,
  buildFallbackPaginationMetrics,
  getSheetDimensions,
  measureHeight,
  metricsMatch,
  paginateConceptGroupsByHeight,
  type BudgetSheetOrientation,
  type ConceptPageFocusBehavior,
  type GroupedCategory,
  type PaginationLayoutMetrics,
} from "@/features/quote-preview";
import { InvoiceSummaryBlock, useInvoiceTaxes } from "@/features/invoice-taxes";
import { ClientDetailsPanel } from "@/features/client-details";
import { todayIsoDate } from "@/shared/lib/date";
import {
  useBudgetSheetNavigation,
  useExportNotices,
  useGoogleIntegration,
  useImportActions,
  usePdfExport,
} from "./model";

const REPOSITORY_URL = "https://github.com/datobueno/budget-generator-interface";
const LICENSE_URL = `${REPOSITORY_URL}/blob/main/LICENSE`;
const TRADEMARKS_URL = `${REPOSITORY_URL}/blob/main/TRADEMARKS.md`;

const conceptRowFieldClass =
  "h-10 rounded-[8px] border-transparent bg-transparent px-2 py-0 text-[14px] font-normal text-[#171717] placeholder:text-[#b7b7b7] shadow-none focus-visible:border-[#e5e5e5] focus-visible:ring-1 focus-visible:ring-[#e5e5e5]";
const conceptComboboxContentClass =
  "!w-[280px] !min-w-[280px] !max-w-[280px]";
const budgetSecondaryFieldClass =
  "h-9 rounded-md border border-transparent bg-transparent px-2 py-1 text-[14px] font-normal text-[#171717] placeholder:text-[#b7b7b7] shadow-none transition-[color,box-shadow,border-color,background-color] hover:border-input hover:bg-white hover:shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const budgetNumericFontClass = "[font-family:'Azeret_Mono',monospace]";
const initialItems: QuoteItem[] = [];

export function QuoteEditorPage() {
  const initialCurrencyCode = normalizeCurrencyCode(
    import.meta.env.VITE_DEFAULT_CURRENCY ?? CURRENCY_OPTIONS[0].code,
  );
  const initialCurrencyHeaderLabel = formatUnitPriceHeaderLabel(initialCurrencyCode || "EUR");
  const [client, setClient] = useState<ClientDetails>(initialClient);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [conceptCatalog, setConceptCatalog] = useState<ConceptCatalogEntry[]>([]);
  const [currency, setCurrency] = useState(initialCurrencyCode || "EUR");
  const [currencyComboboxValue, setCurrencyComboboxValue] = useState(initialCurrencyHeaderLabel);
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const [eurExchangeRates, setEurExchangeRates] = useState<Record<string, number>>({
    EUR: 1,
  });
  const [documentKind] = useState<DocumentKind>("budget");
  const usesQuoteSheetLayout = documentKind === "budget" || documentKind === "invoice";
  const isBudgetDocument = usesQuoteSheetLayout;
  const [budgetSheetOrientation, setBudgetSheetOrientation] = useState<BudgetSheetOrientation>(
    DEFAULT_BUDGET_SHEET_ORIENTATION,
  );
  const [isOrientationToggleHovered, setIsOrientationToggleHovered] = useState(false);
  const [isOrientationToggleHoverLocked, setIsOrientationToggleHoverLocked] = useState(false);
  const budgetSheetDimensions = useMemo(
    () => getSheetDimensions(budgetSheetOrientation),
    [budgetSheetOrientation],
  );
  const budgetSheetStaticLayout = useMemo(
    () =>
      buildBudgetSheetStaticLayout(
        budgetSheetDimensions.budgetSheetContentWidthPx,
        budgetSheetOrientation,
      ),
    [budgetSheetDimensions.budgetSheetContentWidthPx, budgetSheetOrientation],
  );
  const budgetTableColumnWidths = budgetSheetStaticLayout.tableColumnWidths;
  const budgetHasActionColumn = isBudgetDocument && budgetTableColumnWidths.action > 0.5;
  const budgetTableColumnCount = budgetHasActionColumn ? 5 : 4;
  const budgetConceptColumnWidthPx = budgetHasActionColumn
    ? budgetTableColumnWidths.action + budgetTableColumnWidths.concept
    : budgetTableColumnWidths.concept;
  const nextBudgetSheetOrientation =
    budgetSheetOrientation === "landscape" ? "portrait" : "landscape";
  const isOrientationToggleHoverPreviewActive =
    isOrientationToggleHovered && !isOrientationToggleHoverLocked;
  const orientationToggleLabel =
    nextBudgetSheetOrientation === "portrait"
      ? "Switch to vertical layout"
      : "Switch to horizontal layout";
  const shouldRenderBudgetSummarySpacer = budgetSheetStaticLayout.summaryGapPx > 0.5;
  const budgetSummaryContainerStyle =
    isBudgetDocument && budgetSheetStaticLayout.summaryOffsetPx > 0
      ? { paddingLeft: `${budgetSheetStaticLayout.summaryOffsetPx}px` }
      : undefined;
  const budgetSummaryGridStyle = isBudgetDocument
    ? {
        gridTemplateColumns: shouldRenderBudgetSummarySpacer
          ? `${budgetSheetStaticLayout.summaryNotesWidthPx}px ${budgetSheetStaticLayout.summaryGapPx}px ${budgetSheetStaticLayout.summaryTotalsWidthPx}px`
          : `${budgetSheetStaticLayout.summaryNotesWidthPx}px ${budgetSheetStaticLayout.summaryTotalsWidthPx}px`,
      }
    : undefined;
  const paginationDefaultContentHeight = usesQuoteSheetLayout
    ? budgetSheetDimensions.budgetSheetContentHeightPx
    : budgetSheetDimensions.sheetContentHeightPx;
  const paginationDefaultItemRowHeight = usesQuoteSheetLayout
    ? BUDGET_ITEM_ROW_HEIGHT_PX
    : DEFAULT_ITEM_ROW_HEIGHT_PX;
  const paginationDefaultGroupSpacerHeight = usesQuoteSheetLayout
    ? 0
    : GROUP_SPACER_ROW_HEIGHT_PX;
  const [quoteNumber, setQuoteNumber] = useState("Q-2026-001");
  const [issueDate, setIssueDate] = useState(todayIsoDate());
  const [activeConceptComboboxId, setActiveConceptComboboxId] = useState<string | null>(null);
  const [visibleConceptRowActionsId, setVisibleConceptRowActionsId] = useState<string | null>(null);
  const [activeDraggedItemDndId, setActiveDraggedItemDndId] = useState<string | null>(null);
  const [emptyConceptDraft, setEmptyConceptDraft] = useState("");
  const [emptyConceptQuantityDraft, setEmptyConceptQuantityDraft] = useState<number | null>(null);
  const [emptyConceptUnitPriceDraft, setEmptyConceptUnitPriceDraft] = useState<number | null>(null);
  const [forceSummaryOnNewSheet, setForceSummaryOnNewSheet] = useState(false);
  const [paginationMetrics, setPaginationMetrics] = useState<PaginationLayoutMetrics>(() =>
    buildFallbackPaginationMetrics([], {
      contentHeight: paginationDefaultContentHeight,
      firstPreConceptHeight: DEFAULT_FIRST_PRE_CONCEPT_HEIGHT_PX,
      firstConceptChromeHeight: DEFAULT_FIRST_CONCEPT_CHROME_HEIGHT_PX,
      continuationConceptChromeHeight: DEFAULT_CONTINUATION_CONCEPT_CHROME_HEIGHT_PX,
      summaryReserveHeight: DEFAULT_SUMMARY_RESERVE_HEIGHT_PX,
      groupSpacerHeight: paginationDefaultGroupSpacerHeight,
      defaultCategoryRowHeight: DEFAULT_CATEGORY_ROW_HEIGHT_PX,
      defaultItemRowHeight: paginationDefaultItemRowHeight,
    }),
  );
  const pendingManualConceptPageFocusRef = useRef<ConceptPageFocusBehavior | null>(null);
  const pendingConceptGridFocusRef = useRef<{
    rowId: string;
    field: ConceptGridField;
  } | null>(null);
  const firstHeaderRef = useRef<HTMLElement | null>(null);
  const firstClientSectionRef = useRef<HTMLElement | null>(null);
  const firstConceptHeadingRef = useRef<HTMLDivElement | null>(null);
  const continuationConceptHeadingRef = useRef<HTMLDivElement | null>(null);
  const firstTableHeaderRef = useRef<HTMLTableSectionElement | null>(null);
  const summaryMeasureSectionRef = useRef<HTMLElement | null>(null);
  const summaryMeasureFooterRef = useRef<HTMLElement | null>(null);
  const summaryMeasureBlockRef = useRef<HTMLDivElement | null>(null);
  const lastConceptPageContentRef = useRef<HTMLDivElement | null>(null);
  const lastConceptPageLastContentRowRef = useRef<HTMLTableRowElement | null>(null);
  const lastConceptPageSummaryRef = useRef<HTMLDivElement | null>(null);
  const sheetExportTrackRef = useRef<HTMLDivElement | null>(null);
  const categoryRowMeasureRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const itemRowMeasureRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const hasFetchedFrankfurterRatesRef = useRef(false);
  const { exportNotice, noticeApi } = useExportNotices(isBudgetDocument);
  const {
    googleContactsCount,
    googleNotice,
    isGoogleConnecting,
    isContactFromGoogle,
    clientAutocompleteQuery,
    clientAutocompleteContacts,
    isClientAutocompleteLoading,
    isGoogleConfigured,
    handleRefreshGoogleContacts,
    handleApplyGoogleContact,
    handleClientContactNameChange,
    getGoogleSheetsPickerConfig,
    requestGoogleSheetsToken,
  } = useGoogleIntegration({
    setClient,
    noticeApi,
  });
  const {
    logoInputRef,
    isExporting,
    logoDataUrl,
    logoFileName,
    isLogoDragOver,
    visiblePdfExportErrors,
    handleExportPdf,
    handleOpenLogoUpload,
    handleLogoUpload,
    handleLogoDragOver,
    handleLogoDragLeave,
    handleLogoDrop,
  } = usePdfExport({
    client,
    issueDate,
    items,
    documentKind,
    quoteNumber,
    budgetNumericFontClass,
    budgetSheetOrientation,
    budgetSheetPreviewWidthPx: budgetSheetDimensions.budgetSheetPreviewWidthPx,
    sheetExportTrackRef,
    noticeApi,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const totals = useMemo(() => getQuoteTotals(items), [items]);
  const {
    invoiceTaxLines,
    visibleTotals,
    handleInvoiceTaxQueryChange,
    handleInvoiceTaxOptionSelect,
    handleInvoiceTaxInputBlur,
    handleInvoiceTaxRateChange,
  } = useInvoiceTaxes(documentKind, totals);

  const isInvoiceDocument = documentKind === "invoice";
  const documentTitle = DOCUMENT_LABELS[documentKind];

  const groupedItems = useMemo(() => {
    const groups: GroupedCategory[] = [];
    const groupIndexByCategory = new Map<string, number>();

    items.forEach((item) => {
      const category = item.category.trim() || DEFAULT_CATEGORY;
      const existingGroupIndex = groupIndexByCategory.get(category);

      if (existingGroupIndex === undefined) {
        groupIndexByCategory.set(category, groups.length);
        groups.push({ category, items: [{ ...item, category }] });
        return;
      }

      groups[existingGroupIndex].items.push({ ...item, category });
    });

    return groups;
  }, [items]);
  const invalidItemDescriptionIds = useMemo(
    () => new Set(visiblePdfExportErrors.itemDescriptionIds),
    [visiblePdfExportErrors.itemDescriptionIds],
  );
  const invalidItemQuantityIds = useMemo(
    () => new Set(visiblePdfExportErrors.itemQuantityIds),
    [visiblePdfExportErrors.itemQuantityIds],
  );
  const invalidItemUnitPriceIds = useMemo(
    () => new Set(visiblePdfExportErrors.itemUnitPriceIds),
    [visiblePdfExportErrors.itemUnitPriceIds],
  );

  useEffect(() => {
    setForceSummaryOnNewSheet(false);
  }, [
    budgetSheetOrientation,
    documentKind,
    items,
    client.notes,
    visibleTotals.subTotal,
    visibleTotals.taxTotal,
    visibleTotals.grandTotal,
    paginationMetrics,
  ]);

  const focusConceptGridField = useCallback(
    (rowId: string, field: ConceptGridField) => {
      const targetField = document.querySelector<HTMLInputElement>(
        `[data-concept-grid-row-id="${rowId}"][data-concept-grid-field="${field}"]`,
      );
      if (!(targetField instanceof HTMLInputElement)) return false;

      targetField.focus({ preventScroll: true });
      if (typeof targetField.select === "function") {
        targetField.select();
      }

      return true;
    },
    [],
  );

  useLayoutEffect(() => {
    const pendingConceptGridFocus = pendingConceptGridFocusRef.current;
    if (!pendingConceptGridFocus) return;

    pendingConceptGridFocusRef.current = null;

    const frameId = window.requestAnimationFrame(() => {
      focusConceptGridField(pendingConceptGridFocus.rowId, pendingConceptGridFocus.field);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [focusConceptGridField, items]);

  const getConceptGridRowIdsInDomOrder = useCallback(() => {
    const rowIds: string[] = [];
    const seenRowIds = new Set<string>();

    document
      .querySelectorAll<HTMLInputElement>("[data-concept-grid-row-id][data-concept-grid-field]")
      .forEach((input) => {
        const rowId = input.dataset.conceptGridRowId;
        if (!rowId || seenRowIds.has(rowId)) return;
        seenRowIds.add(rowId);
        rowIds.push(rowId);
      });

    return rowIds;
  }, []);

  const handleConceptGridFieldKeyDown = useCallback(
    (
      rowId: string,
      field: ConceptGridField,
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        return;
      }

      const currentFieldIndex = CONCEPT_GRID_FIELDS.indexOf(field);
      if (currentFieldIndex === -1) return;

      const inputElement =
        event.target instanceof HTMLInputElement ? event.target : null;
      const isComboboxPopupOpen =
        field === "concept" &&
        inputElement?.closest('[data-combobox-open="true"]') !== null;
      if (isComboboxPopupOpen && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        return;
      }

      let targetRowId = rowId;
      let targetFieldIndex = currentFieldIndex;

      if (event.key === "ArrowLeft") {
        targetFieldIndex -= 1;
      } else if (event.key === "ArrowRight") {
        targetFieldIndex += 1;
      } else {
        const navigableRowIds = getConceptGridRowIdsInDomOrder();
        const currentRowIndex = navigableRowIds.indexOf(rowId);
        if (currentRowIndex === -1) return;

        const nextRowIndex =
          event.key === "ArrowUp" ? currentRowIndex - 1 : currentRowIndex + 1;
        if (nextRowIndex < 0 || nextRowIndex >= navigableRowIds.length) return;

        targetRowId = navigableRowIds[nextRowIndex];
      }

      const targetField = CONCEPT_GRID_FIELDS[targetFieldIndex];
      if (!targetField) return;

      if (!focusConceptGridField(targetRowId, targetField)) return;

      event.preventDefault();
      event.stopPropagation();
    },
    [focusConceptGridField, getConceptGridRowIdsInDomOrder],
  );

  const handleConceptTableKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      const rowId = target.dataset.conceptGridRowId;
      const field = target.dataset.conceptGridField as ConceptGridField | undefined;
      if (!rowId || !field) return;

      handleConceptGridFieldKeyDown(rowId, field, event as React.KeyboardEvent<HTMLInputElement>);
    },
    [handleConceptGridFieldKeyDown],
  );

  const emptyConceptAutocompleteMatches = useMemo(
    () =>
      sortConceptCatalogEntriesByCategory(
        searchConceptCatalogAcrossCategories(conceptCatalog, emptyConceptDraft),
      ),
    [conceptCatalog, emptyConceptDraft],
  );
  const emptyConceptLineBase =
    (emptyConceptQuantityDraft ?? 0) * (emptyConceptUnitPriceDraft ?? 0);
  const animatedEmptyConceptLineBase = useAnimatedNumber(emptyConceptLineBase);
  const currencyOptions = useMemo(() => {
    const rawQuery = extractCurrencyComboboxQuery(currencyComboboxValue);
    const shouldFilterByQuery = /[a-z0-9]/i.test(rawQuery);
    if (!shouldFilterByQuery) return [...CURRENCY_OPTIONS];

    const normalizedQuery = normalizeImportHeader(rawQuery);
    if (!normalizedQuery) return [...CURRENCY_OPTIONS];

    return CURRENCY_OPTIONS.filter((option) => {
      const searchableText = normalizeImportHeader(
        `${option.code} ${option.label} ${getCurrencySymbol(option.code)}`,
      );
      return searchableText.includes(normalizedQuery);
    });
  }, [currencyComboboxValue]);

  const applyCurrencyChange = async (nextCurrencyRaw: string): Promise<void> => {
    const nextCurrency = normalizeCurrencyCode(nextCurrencyRaw);
    if (!nextCurrency) {
      setCurrencyComboboxValue(formatUnitPriceHeaderLabel(currency));
      return;
    }
    if (nextCurrency === currency) {
      setCurrencyComboboxValue(formatUnitPriceHeaderLabel(nextCurrency));
      return;
    }
    if (isCurrencyUpdating) return;

    setIsCurrencyUpdating(true);
    try {
      let rates = eurExchangeRates;
      const currentRate = resolveRateFromEur(rates, currency);
      const targetRate = resolveRateFromEur(rates, nextCurrency);

      if (currentRate === null || targetRate === null) {
        rates = await fetchFrankfurterRates();
        setEurExchangeRates(rates);
      }

      const finalCurrentRate = resolveRateFromEur(rates, currency);
      const finalTargetRate = resolveRateFromEur(rates, nextCurrency);
      if (finalCurrentRate === null || finalTargetRate === null) {
        throw new Error(`No conversion rate is available for ${nextCurrency}.`);
      }

      const conversionScale = finalTargetRate / finalCurrentRate;
      setItems((current) =>
        current.map((item) => ({
          ...item,
          unitPrice: scaleMoney(item.unitPrice, conversionScale),
        })),
      );
      setConceptCatalog((current) =>
        current.map((entry) => ({
          ...entry,
          unitPrice: scaleMoney(entry.unitPrice, conversionScale),
        })),
      );
      setCurrency(nextCurrency);
      setCurrencyComboboxValue(formatUnitPriceHeaderLabel(nextCurrency));
    } catch (error) {
      console.error(error);
      showCustomerFacingErrorToast(error, "currencyChange");
      setCurrencyComboboxValue(formatUnitPriceHeaderLabel(currency));
    } finally {
      setIsCurrencyUpdating(false);
    }
  };

  const handleCurrencyComboboxValueChange = (nextValue: string) => {
    const normalizedInputValue = normalizeCurrencyComboboxInput(nextValue);
    const query = extractCurrencyComboboxQuery(normalizedInputValue);
    setCurrencyComboboxValue(normalizedInputValue);
    if (!query) return;

    const normalizedQuery = normalizeImportHeader(query);
    const normalizedCodeQuery = normalizeCurrencyCode(query);
    const exactMatch = CURRENCY_OPTIONS.find((option) => {
      if (option.code === normalizedCodeQuery) return true;
      if (normalizeImportHeader(option.label) === normalizedQuery) return true;
      if (getCurrencySymbol(option.code) === query.trim()) return true;
      return false;
    });
    if (exactMatch) {
      void applyCurrencyChange(exactMatch.code);
    }
  };

  useEffect(() => {
    if (!activeConceptComboboxId) return;
    if (items.some((item) => item.id === activeConceptComboboxId)) return;
    setActiveConceptComboboxId(null);
  }, [activeConceptComboboxId, items]);

  useEffect(() => {
    if (!visibleConceptRowActionsId) return;
    if (items.some((item) => item.id === visibleConceptRowActionsId)) return;
    setVisibleConceptRowActionsId(null);
  }, [items, visibleConceptRowActionsId]);

  useEffect(() => {
    if (hasFetchedFrankfurterRatesRef.current) return;
    hasFetchedFrankfurterRatesRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const rates = await fetchFrankfurterRates();
        if (cancelled) return;
        setEurExchangeRates(rates);
      } catch (error) {
        console.error(error);
        if (cancelled) return;
        showCustomerFacingErrorToast(error, "currencyLoad");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCurrencyComboboxValue(formatUnitPriceHeaderLabel(currency));
  }, [currency]);

  useLayoutEffect(() => {
    const nextCategoryHeights: Record<string, number> = {};
    const nextItemHeights: Record<string, number> = {};

    groupedItems.forEach((group) => {
      nextCategoryHeights[group.category] = measureHeight(
        categoryRowMeasureRefs.current[group.category],
        DEFAULT_CATEGORY_ROW_HEIGHT_PX,
      );

      group.items.forEach((item) => {
        nextItemHeights[item.id] = measureHeight(
          itemRowMeasureRefs.current[item.id],
          usesQuoteSheetLayout ? BUDGET_ITEM_ROW_HEIGHT_PX : DEFAULT_ITEM_ROW_HEIGHT_PX,
        );
      });
    });

    const firstHeaderHeight = measureHeight(firstHeaderRef.current, 0);
    const firstClientHeight = measureHeight(firstClientSectionRef.current, 0);
    const firstPreConceptHeight = usesQuoteSheetLayout
      ? firstHeaderHeight > 0
        ? firstHeaderHeight + BUDGET_HEADER_TO_CONCEPT_GAP_PX
        : DEFAULT_FIRST_PRE_CONCEPT_HEIGHT_PX
      : firstHeaderHeight > 0 && firstClientHeight > 0
        ? firstHeaderHeight + firstClientHeight + SHEET_SECTION_GAP_PX * 2
        : DEFAULT_FIRST_PRE_CONCEPT_HEIGHT_PX;

    const tableHeaderHeight = measureHeight(firstTableHeaderRef.current, 0);
    const firstHeadingHeight = measureHeight(firstConceptHeadingRef.current, 0);
    const continuationHeadingHeight = measureHeight(continuationConceptHeadingRef.current, 0);

    const firstConceptChromeHeight = usesQuoteSheetLayout
      ? tableHeaderHeight > 0
        ? tableHeaderHeight
        : DEFAULT_FIRST_CONCEPT_CHROME_HEIGHT_PX
      : firstHeadingHeight > 0 && tableHeaderHeight > 0
        ? firstHeadingHeight + tableHeaderHeight + CONCEPT_SECTION_INNER_GAP_PX
        : DEFAULT_FIRST_CONCEPT_CHROME_HEIGHT_PX;

    const continuationConceptChromeHeight = usesQuoteSheetLayout
      ? tableHeaderHeight > 0
        ? tableHeaderHeight
        : DEFAULT_CONTINUATION_CONCEPT_CHROME_HEIGHT_PX
      : continuationHeadingHeight > 0 && tableHeaderHeight > 0
        ? continuationHeadingHeight + tableHeaderHeight + CONCEPT_SECTION_INNER_GAP_PX
        : firstHeadingHeight > 0 && tableHeaderHeight > 0
          ? firstHeadingHeight + tableHeaderHeight + CONCEPT_SECTION_INNER_GAP_PX
          : DEFAULT_CONTINUATION_CONCEPT_CHROME_HEIGHT_PX;

    const summaryBlockHeight = measureHeight(summaryMeasureBlockRef.current, 0);
    const summarySectionHeight = measureHeight(summaryMeasureSectionRef.current, 0);
    const summaryFooterHeight = measureHeight(summaryMeasureFooterRef.current, 0);
    const summaryExternalGap = usesQuoteSheetLayout ? 0 : SHEET_SECTION_GAP_PX;
    const summaryReserveHeight =
      summaryBlockHeight > 0
        ? summaryBlockHeight + summaryExternalGap + SUMMARY_PAGINATION_GUARD_PX
        : summarySectionHeight > 0 && summaryFooterHeight > 0
          ? summarySectionHeight +
            summaryFooterHeight +
            summaryExternalGap +
            SUMMARY_PAGINATION_GUARD_PX
        : DEFAULT_SUMMARY_RESERVE_HEIGHT_PX;

    const nextMetrics: PaginationLayoutMetrics = {
      contentHeight: usesQuoteSheetLayout
        ? budgetSheetDimensions.budgetSheetContentHeightPx
        : budgetSheetDimensions.sheetContentHeightPx,
      firstPreConceptHeight,
      firstConceptChromeHeight,
      continuationConceptChromeHeight,
      summaryReserveHeight,
      groupSpacerHeight: usesQuoteSheetLayout ? 0 : GROUP_SPACER_ROW_HEIGHT_PX,
      categoryHeights: nextCategoryHeights,
      itemHeights: nextItemHeights,
    };

    setPaginationMetrics((current) => (metricsMatch(current, nextMetrics) ? current : nextMetrics));
  }, [budgetSheetDimensions, groupedItems, usesQuoteSheetLayout]);

  const paginationResult = useMemo(
    () =>
      paginateConceptGroupsByHeight(
        groupedItems,
        paginationMetrics,
        DEFAULT_CATEGORY_ROW_HEIGHT_PX,
        paginationDefaultItemRowHeight,
        forceSummaryOnNewSheet,
      ),
    [forceSummaryOnNewSheet, groupedItems, paginationDefaultItemRowHeight, paginationMetrics],
  );
  const conceptPages = paginationResult.pages;
  const shouldRenderSummaryOnNewSheet = paginationResult.summaryOnNewSheet;
  const conceptPageIndexByItemId = useMemo(() => {
    const nextIndexByItemId = new Map<string, number>();

    conceptPages.forEach((conceptPage, pageIndex) => {
      conceptPage.groups.forEach((group) => {
        group.items.forEach((item) => {
          nextIndexByItemId.set(item.id, pageIndex);
        });
      });
    });

    return nextIndexByItemId;
  }, [conceptPages]);

  useLayoutEffect(() => {
    if (shouldRenderSummaryOnNewSheet || forceSummaryOnNewSheet) return;

    const contentElement = lastConceptPageContentRef.current;
    const lastContentRowElement = lastConceptPageLastContentRowRef.current;
    const summaryElement = lastConceptPageSummaryRef.current;
    if (!contentElement || !summaryElement) return;

    const contentRect = contentElement.getBoundingClientRect();
    const lastContentRowRect = lastContentRowElement?.getBoundingClientRect();
    const summaryRect = summaryElement.getBoundingClientRect();
    const tableOverlapsSummary = Boolean(
      lastContentRowRect && lastContentRowRect.bottom > summaryRect.top + 1,
    );
    const summaryOverflowsSheet = summaryRect.bottom > contentRect.bottom + 1;

    if (tableOverlapsSummary || summaryOverflowsSheet) {
      setForceSummaryOnNewSheet(true);
    }
  }, [
    client.notes,
    conceptPages.length,
    documentKind,
    forceSummaryOnNewSheet,
    items,
    paginationMetrics,
    shouldRenderSummaryOnNewSheet,
    visibleTotals.grandTotal,
    visibleTotals.subTotal,
    visibleTotals.taxTotal,
  ]);

  const emptyConceptBodyHeightByPage = useMemo(() => {
    return conceptPages.map((_, pageIndex) => {
      const isFirstSheet = pageIndex === 0;
      const hasSummaryOnThisPage =
        pageIndex === conceptPages.length - 1 && !shouldRenderSummaryOnNewSheet;
      const preConceptHeight = isFirstSheet ? paginationMetrics.firstPreConceptHeight : 0;
      const conceptChromeHeight = isFirstSheet
        ? paginationMetrics.firstConceptChromeHeight
        : paginationMetrics.continuationConceptChromeHeight;
      const summaryReserveHeight = hasSummaryOnThisPage ? paginationMetrics.summaryReserveHeight : 0;
      const availableHeight =
        paginationMetrics.contentHeight -
        preConceptHeight -
        conceptChromeHeight -
        summaryReserveHeight;
      return Math.max(220, Math.floor(availableHeight));
    });
  }, [conceptPages, paginationMetrics, shouldRenderSummaryOnNewSheet]);
  const conceptBodyFillerHeightByPage = useMemo(() => {
    return conceptPages.map((conceptPage, pageIndex) => {
      const availableHeight = emptyConceptBodyHeightByPage[pageIndex] ?? 220;
      let usedHeight = 0;

      conceptPage.groups.forEach((group, groupIndex) => {
        if (groupIndex > 0 && !isBudgetDocument) {
          usedHeight += paginationMetrics.groupSpacerHeight;
        }

        if (!group.isContinuation) {
          usedHeight +=
            paginationMetrics.categoryHeights[group.category] ?? DEFAULT_CATEGORY_ROW_HEIGHT_PX;
        }

        group.items.forEach((item) => {
          usedHeight +=
            paginationMetrics.itemHeights[item.id] ??
            paginationDefaultItemRowHeight;
        });
      });

      return Math.max(0, Math.floor(availableHeight - usedHeight));
    });
  }, [
    conceptPages,
    emptyConceptBodyHeightByPage,
    paginationDefaultItemRowHeight,
    paginationMetrics,
  ]);

  const handleClientField = (key: keyof ClientDetails, value: string) => {
    setClient((current) => ({ ...current, [key]: value }));
  };

  const handleAddItemBelow = (
    id: string,
    options?: {
      activateCombobox?: boolean;
      referenceCategory?: string;
      pageFocusBehavior?: ConceptPageFocusBehavior;
    },
  ) => {
    pendingManualConceptPageFocusRef.current = options?.pageFocusBehavior ?? "instant";
    const rowIndex = items.findIndex((item) => item.id === id);
    if (rowIndex === -1) return;

    const referenceCategory =
      options?.referenceCategory?.trim() ||
      items[rowIndex].category.trim() ||
      DEFAULT_CATEGORY;
    const nextItemId = crypto.randomUUID();
    const nextItem: QuoteItem = {
      id: nextItemId,
      category: referenceCategory,
      description: "",
      quantity: 0,
      unitPrice: 0,
      discountPct: 0,
      taxPct: 21,
    };

    setItems((current) => {
      const currentRowIndex = current.findIndex((item) => item.id === id);
      if (currentRowIndex === -1) return current;

      const nextItems = [...current];
      nextItems.splice(currentRowIndex + 1, 0, nextItem);
      return nextItems;
    });

    if (options?.activateCombobox) {
      setActiveConceptComboboxId(nextItemId);
    }
  };

  const handleRemoveItem = (id: string) => {
    const shouldReturnToEmpty = items.length === 1 && items[0]?.id === id;
    if (shouldReturnToEmpty) {
      pendingConceptGridFocusRef.current = {
        rowId: EMPTY_CONCEPT_ROW_ID,
        field: "concept",
      };
      resetEmptyConceptDraft();
    }

    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraggedItemDndId(null);
    const activeDndId = String(event.active.id);
    const overDndId = event.over ? String(event.over.id) : null;
    if (!overDndId || activeDndId === overDndId) return;

    const activeItemId = fromItemDndId(activeDndId);
    const overItemId = fromItemDndId(overDndId);
    const overCategory = fromCategoryDndId(overDndId);
    if (activeItemId && (overItemId || overCategory)) {
      setItems((current) => {
        const fromIndex = current.findIndex((item) => item.id === activeItemId);
        if (fromIndex === -1) return current;

        const nextItems = [...current];
        const [movedItem] = nextItems.splice(fromIndex, 1);
        if (!movedItem) return current;

        if (overItemId) {
          const overIndex = nextItems.findIndex((item) => item.id === overItemId);
          if (overIndex === -1) return current;

          const targetCategory = nextItems[overIndex].category.trim() || DEFAULT_CATEGORY;
          nextItems.splice(overIndex, 0, {
            ...movedItem,
            category: targetCategory,
          });
          return nextItems;
        }

        if (overCategory) {
          const targetCategory = overCategory.trim() || DEFAULT_CATEGORY;
          const firstTargetIndex = nextItems.findIndex(
            (item) => (item.category.trim() || DEFAULT_CATEGORY) === targetCategory,
          );
          if (firstTargetIndex === -1) return current;

          nextItems.splice(firstTargetIndex, 0, {
            ...movedItem,
            category: targetCategory,
          });
          return nextItems;
        }

        return current;
      });
      return;
    }

    const activeCategory = fromCategoryDndId(activeDndId);
    if (activeCategory && (overCategory || overItemId)) {
      setItems((current) => {
        const categoryOrder = getCategoryOrder(current);
        const fromIndex = categoryOrder.indexOf(activeCategory);
        const resolvedOverCategory =
          overCategory ||
          current.find((item) => item.id === overItemId)?.category.trim() ||
          DEFAULT_CATEGORY;
        const toIndex = categoryOrder.indexOf(resolvedOverCategory);
        if (fromIndex === -1 || toIndex === -1) return current;

        const nextCategoryOrder = arrayMove(categoryOrder, fromIndex, toIndex);
        const itemsByCategory = new Map<string, QuoteItem[]>();

        current.forEach((item) => {
          const category = item.category.trim() || DEFAULT_CATEGORY;
          const list = itemsByCategory.get(category);
          if (list) {
            list.push(item);
            return;
          }
          itemsByCategory.set(category, [item]);
        });

        return nextCategoryOrder.flatMap((category) => itemsByCategory.get(category) ?? []);
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeDndId = String(event.active.id);
    setActiveDraggedItemDndId(fromItemDndId(activeDndId) ? activeDndId : null);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveDraggedItemDndId(null);
  };

  const handleUpdateItem = (
    id: string,
    next: QuoteItem,
    options?: { pageFocusBehavior?: ConceptPageFocusBehavior },
  ) => {
    pendingManualConceptPageFocusRef.current = options?.pageFocusBehavior ?? "animate";
    setItems((current) => current.map((item) => (item.id === id ? next : item)));
  };

  const resetEmptyConceptDraft = useCallback(() => {
    setEmptyConceptDraft("");
    setEmptyConceptQuantityDraft(null);
    setEmptyConceptUnitPriceDraft(null);
  }, []);

  const handleAddFirstConceptFromEmpty = useCallback(
    (
      description: string,
      selectedEntry?: ConceptCatalogEntry | null,
      options?: {
        focusField?: ConceptGridField;
        activateNextCombobox?: boolean;
      },
    ) => {
      pendingManualConceptPageFocusRef.current = "instant";
      const nextDescription = description.trim();
      if (!nextDescription) return false;

      const matchedEntry =
        selectedEntry ??
        conceptCatalog.find(
          (entry) =>
            normalizeImportHeader(entry.description) === normalizeImportHeader(nextDescription),
        ) ??
        null;

      const nextCategory = matchedEntry?.category?.trim() || DEFAULT_CATEGORY;
      const nextUnitPrice =
        emptyConceptUnitPriceDraft ??
        (matchedEntry && matchedEntry.unitPrice !== null ? matchedEntry.unitPrice : 0);
      const nextQuantity = emptyConceptQuantityDraft ?? 1;
      const firstItemId = crypto.randomUUID();
      const followUpItemId = crypto.randomUUID();

      setItems([
        {
          id: firstItemId,
          category: nextCategory,
          description: nextDescription,
          quantity: nextQuantity,
          unitPrice: nextUnitPrice,
          discountPct: 0,
          taxPct: 21,
        },
        {
          id: followUpItemId,
          category: nextCategory,
          description: "",
          quantity: 0,
          unitPrice: 0,
          discountPct: 0,
          taxPct: 21,
        },
      ]);

      const shouldActivateNextCombobox = options?.activateNextCombobox ?? !options?.focusField;

      if (shouldActivateNextCombobox) {
        pendingConceptGridFocusRef.current = null;
        setActiveConceptComboboxId(followUpItemId);
      } else {
        pendingConceptGridFocusRef.current = {
          rowId: firstItemId,
          field: options?.focusField ?? "quantity",
        };
      }

      resetEmptyConceptDraft();
      return true;
    },
    [conceptCatalog, emptyConceptQuantityDraft, emptyConceptUnitPriceDraft, resetEmptyConceptDraft],
  );

  const handleEmptyConceptInputEnter = (
    rawValue: string,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    const nextDescription = rawValue.trim();
    if (!nextDescription) return;

    event.preventDefault();
    event.stopPropagation();

    const normalizedDescription = normalizeImportHeader(nextDescription);
    const selectedEntry =
      conceptCatalog.find(
        (entry) => normalizeImportHeader(entry.description) === normalizedDescription,
      ) ?? null;

    handleAddFirstConceptFromEmpty(nextDescription, selectedEntry);
  };

  const handleCategoryMeasureRef = (category: string, element: HTMLTableRowElement | null) => {
    if (element) {
      categoryRowMeasureRefs.current[category] = element;
      return;
    }

    delete categoryRowMeasureRefs.current[category];
  };

  const handleItemMeasureRef = (itemId: string, element: HTMLTableRowElement | null) => {
    if (element) {
      itemRowMeasureRefs.current[itemId] = element;
      return;
    }

    delete itemRowMeasureRefs.current[itemId];
  };

  const handleRowActionButtonIntent = useCallback(
    (itemId: string, action: RowActionButtonKind) => {
      if (action === "add") {
        setVisibleConceptRowActionsId(itemId);
        return;
      }

      const rowIndex = items.findIndex((item) => item.id === itemId);
      if (rowIndex === -1) {
        return;
      }

      const fallbackItem = items[rowIndex + 1] ?? items[rowIndex - 1] ?? null;
      if (!fallbackItem) {
        setVisibleConceptRowActionsId(null);
        return;
      }

      setVisibleConceptRowActionsId(fallbackItem.id);
      pendingConceptGridFocusRef.current = {
        rowId: fallbackItem.id,
        field: "concept",
      };
    },
    [items],
  );

  const handleConceptRowActionRailEnter = useCallback((itemId: string) => {
    setVisibleConceptRowActionsId(itemId);
  }, []);

  const handleConceptRowActionRailLeave = useCallback((itemId: string) => {
    setVisibleConceptRowActionsId((current) => (current === itemId ? null : current));
  }, []);

  const totalSheetCount =
    conceptPages.length + (shouldRenderSummaryOnNewSheet ? 1 : 0);
  const shouldRenderBudgetFooter =
    !isBudgetDocument && (totalSheetCount > 1 || Boolean(exportNotice));
  const shouldUseStackedBudgetSheets = usesQuoteSheetLayout && totalSheetCount > 1;
  const summarySheetIndex = conceptPages.length;
  const visibleConceptPageDescriptors = conceptPages.map((conceptPage, sheetIndex) => ({
    conceptPage,
    sheetIndex,
  }));
  const visibleSortableRowIds = visibleConceptPageDescriptors.flatMap(({ conceptPage }) =>
    conceptPage.groups.flatMap((group) => [
      ...(group.isContinuation ? [] : [toCategoryDndId(group.category)]),
      ...group.items.map((item) => toItemDndId(item.id)),
    ]),
  );
  const shouldRenderVisibleSummarySheet = shouldRenderSummaryOnNewSheet;
  const renderedBudgetSheetCount =
    visibleConceptPageDescriptors.length + (shouldRenderVisibleSummarySheet ? 1 : 0);
  const expandedBudgetSheetWidth = budgetSheetDimensions.budgetSheetPreviewWidthPx;
  const expandedBudgetSheetHeight = budgetSheetDimensions.budgetSheetPreviewHeightPx;
  const budgetSheetPreviewStyle = {
    width: `${budgetSheetDimensions.budgetSheetPreviewWidthPx}px`,
    maxWidth: `${budgetSheetDimensions.budgetSheetPreviewWidthPx}px`,
    height: `${budgetSheetDimensions.budgetSheetPreviewHeightPx}px`,
  } as const;
  const budgetSheetStackedStyle = {
    width: `${expandedBudgetSheetWidth}px`,
    height: `${expandedBudgetSheetHeight}px`,
  } as const;
  const {
    activeBudgetSheetIndex,
    setActiveBudgetSheetIndex,
    isBudgetSheetTransitioning,
    setIsBudgetSheetTransitioning,
    budgetSheetWheelContainerRef,
    focusBudgetSheet,
  } = useBudgetSheetNavigation({
    shouldUseStackedBudgetSheets,
    renderedBudgetSheetCount,
    conceptPagesLength: conceptPages.length,
    activeConceptComboboxId,
    conceptPageIndexByItemId,
    expandedBudgetSheetWidth,
    pendingManualConceptPageFocusRef,
  });
  const {
    fileInputRef,
    conceptCatalogFileInputRef,
    isConceptCatalogImporting,
    isQuoteImporting,
    linkedConceptCatalogSpreadsheet,
    linkedQuoteSpreadsheet,
    isSpreadsheetDragOver,
    handleImportConceptCatalogFile,
    handleImportFile,
    handleOpenConceptCatalogFileUpload,
    handleOpenImport,
    handleRequestConceptCatalogImport,
    handleRequestLinkedConceptCatalogSpreadsheetImport,
    handleRequestLinkedQuoteSpreadsheetImport,
    handleRequestQuoteSpreadsheetImport,
    handleSpreadsheetDragLeave,
    handleSpreadsheetDragOver,
    handleSpreadsheetDrop,
    budgetImportActions,
  } = useImportActions({
    setItems,
    setConceptCatalog,
    setActiveBudgetSheetIndex,
    setIsBudgetSheetTransitioning,
    pendingManualConceptPageFocusRef,
    noticeApi,
    getGoogleSheetsPickerConfig,
    requestGoogleSheetsToken,
  });
  const budgetHeaderImportActions = useMemo<ComboboxAction[]>(
    () => {
      const fillQuoteAction = budgetImportActions.find((action) => action.key === "fill-quote");
      if (!fillQuoteAction) return [];

      const fillQuoteItems = (fillQuoteAction.items ?? []).filter(
        (item) => item.key === "import-quote-spreadsheet" || item.key === "upload-quote",
      );

      if (fillQuoteItems.length === 0) return [];

      return [
        {
          ...fillQuoteAction,
          items: fillQuoteItems,
        },
      ];
    },
    [budgetImportActions],
  );
  const emptyConceptComboboxActions = useMemo(
    () => budgetImportActions.filter((action) => action.key !== "fill-quote"),
    [budgetImportActions],
  );
  const expandedBudgetTrackOffset =
    shouldUseStackedBudgetSheets
      ? -expandedBudgetSheetWidth / 2 -
        activeBudgetSheetIndex * (expandedBudgetSheetWidth + BUDGET_SHEET_PREVIEW_GAP_PX)
      : 0;
  const isSummarySheetActive =
    !shouldUseStackedBudgetSheets ||
    activeBudgetSheetIndex === summarySheetIndex;
  const isSummarySheetInteractive =
    !shouldUseStackedBudgetSheets || (isSummarySheetActive && !isBudgetSheetTransitioning);

  return (
    <div className="min-h-screen bg-zinc-100 py-6 md:py-8">
      <div
        className={cn(
          "mx-auto w-full",
          shouldUseStackedBudgetSheets
            ? "max-w-none"
            : "max-w-[1160px]",
        )}
      >
        <div className="mx-auto flex items-start justify-center">
          <div
            className="w-full"
            style={
              shouldUseStackedBudgetSheets
                ? undefined
                : { maxWidth: `${budgetSheetDimensions.budgetSheetPreviewWidthPx}px` }
            }
          >
            <div className="relative">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: `${budgetSheetDimensions.budgetSheetPreviewWidthPx}px`,
              maxWidth: "100%",
            }}
          >
            <div className="inline-flex items-center gap-2">
              <BudgetOrientationToggleButton
                onClick={() => {
                  if (isOrientationToggleHovered) {
                    setIsOrientationToggleHoverLocked(true);
                  }
                  setBudgetSheetOrientation(nextBudgetSheetOrientation);
                }}
                onPointerEnter={() => {
                  setIsOrientationToggleHovered(true);
                }}
                onPointerLeave={() => {
                  setIsOrientationToggleHovered(false);
                  setIsOrientationToggleHoverLocked(false);
                }}
                orientation={budgetSheetOrientation}
                label={orientationToggleLabel}
                isHoverPreviewActive={isOrientationToggleHoverPreviewActive}
                isHoverPreviewLocked={isOrientationToggleHoverLocked}
              />
              <BudgetDownloadButton
                onClick={handleExportPdf}
                disabled={isExporting}
                label={isExporting ? "Generating PDF" : "Download PDF"}
              />
            </div>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={handleImportFile}
          />
          <Input
            ref={conceptCatalogFileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={handleImportConceptCatalogFile}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-[-20000px] top-0 opacity-0"
            style={{ width: `${budgetSheetStaticLayout.innerWidthPx}px` }}
          >
            <div
              ref={continuationConceptHeadingRef}
              className={cn(
                "flex items-center justify-between",
                usesQuoteSheetLayout && "h-0 overflow-hidden",
              )}
            >
              {!usesQuoteSheetLayout ? (
                <h2 className="text-sm font-medium text-zinc-800">Items (Page 2)</h2>
              ) : null}
            </div>
            <div ref={summaryMeasureBlockRef} className="space-y-4">
              <section
                ref={summaryMeasureSectionRef}
                className={cn(
                  "grid gap-6",
                  !usesQuoteSheetLayout && "md:grid-cols-[1fr_280px]",
                  usesQuoteSheetLayout
                    ? "items-end pt-2"
                    : "border-t border-zinc-200 pt-6",
                )}
                style={
                  usesQuoteSheetLayout
                    ? budgetSummaryContainerStyle
                    : undefined
                }
              >
                <div
                  className={cn(usesQuoteSheetLayout && "grid items-end")}
                  style={usesQuoteSheetLayout ? budgetSummaryGridStyle : undefined}
                >
                  <div className="space-y-2">
                    <h2
                      className={cn(
                        "text-sm font-medium text-zinc-800",
                        usesQuoteSheetLayout && "text-[14px] text-[#27272a]",
                      )}
                    >
                      Notes
                    </h2>
                    <InputGroup
                      className={cn(
                        usesQuoteSheetLayout &&
                          "h-[104px] rounded-[8px] border-[1.25px] border-[#e5e5e5] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
                      )}
                    >
                      <InputGroupTextarea
                        rows={4}
                        maxLength={250}
                        value={client.notes}
                        onChange={(event) => handleClientField("notes", event.target.value)}
                        className={cn(usesQuoteSheetLayout && "px-3 py-3 text-[14px] text-[#171717]")}
                      />
                      <InputGroupAddon
                        align="block-end"
                        className={cn(usesQuoteSheetLayout && "border-0 px-3 pb-3 pt-0")}
                      >
                        <InputGroupText
                          className={cn(usesQuoteSheetLayout && "text-[14px] text-[#737373]")}
                        >
                          {client.notes.length}/250
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                  {shouldRenderBudgetSummarySpacer && usesQuoteSheetLayout ? (
                    <div aria-hidden />
                  ) : null}
                  {!isInvoiceDocument ? (
                    <BudgetSubtotalBlock
                      amount={visibleTotals.subTotal}
                      currency={currency}
                      className="self-end"
                    />
                  ) : (
                    <InvoiceSummaryBlock
                      subtotal={visibleTotals.subTotal}
                      total={visibleTotals.grandTotal}
                      currency={currency}
                      taxLines={invoiceTaxLines}
                      interactive
                      conceptRowFieldClass={conceptRowFieldClass}
                      budgetNumericFontClass={budgetNumericFontClass}
                      onTaxQueryChange={handleInvoiceTaxQueryChange}
                      onTaxOptionSelect={handleInvoiceTaxOptionSelect}
                      onTaxInputBlur={handleInvoiceTaxInputBlur}
                      onTaxRateChange={handleInvoiceTaxRateChange}
                    />
                  )}
                </div>
              </section>
              {shouldRenderBudgetFooter ? (
                <footer
                  ref={summaryMeasureFooterRef}
                  className={cn(
                    "flex min-h-9 items-center pt-4",
                    !usesQuoteSheetLayout && "border-t border-zinc-200",
                  )}
                >
                  <p className="text-sm text-zinc-500">{exportNotice || " "}</p>
                </footer>
              ) : null}
            </div>
          </div>
          <div
            ref={budgetSheetWheelContainerRef}
            className={cn(
              "relative",
              shouldUseStackedBudgetSheets && "overflow-hidden pb-2",
            )}
            style={
              shouldUseStackedBudgetSheets
                ? {
                    height: `${expandedBudgetSheetHeight}px`,
                  }
                : undefined
            }
          >
	            <div
	              ref={sheetExportTrackRef}
	              className={cn(
	                shouldUseStackedBudgetSheets
	                  ? cn(
                      "absolute left-1/2 top-0 flex w-max items-start gap-[40px] will-change-transform",
                      isBudgetSheetTransitioning
                        ? "transition-transform duration-300 ease-out"
                        : "transition-none",
                    )
                  : "relative z-20",
              )}
              style={
                shouldUseStackedBudgetSheets
                  ? { transform: `translate3d(${expandedBudgetTrackOffset}px, 0, 0)` }
                  : undefined
              }
            >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={visibleSortableRowIds}
              strategy={verticalListSortingStrategy}
            >
              {visibleConceptPageDescriptors.map(({ conceptPage, sheetIndex }) => {
                const isFirstSheet = sheetIndex === 0;
                const isPageEmpty = conceptPage.groups.length === 0;
                const emptyConceptBodyHeight = emptyConceptBodyHeightByPage[sheetIndex] ?? 220;
                const emptyBudgetConceptFillerHeight = Math.max(
                  0,
                  emptyConceptBodyHeight - BUDGET_ITEM_ROW_HEIGHT_PX,
                );
                const conceptBodyFillerHeight = conceptBodyFillerHeightByPage[sheetIndex] ?? 0;
                const isBudgetSheetActive =
                  !shouldUseStackedBudgetSheets ||
                  activeBudgetSheetIndex === sheetIndex;
                const isBudgetSheetInteractive =
                  !isBudgetDocument || (isBudgetSheetActive && !isBudgetSheetTransitioning);

                return (
                  <Fragment key={`sheet-${sheetIndex}`}>
                    <div
                      className={cn(
                        shouldUseStackedBudgetSheets
                          ? cn(
                              "relative shrink-0",
                              !isBudgetSheetActive &&
                                !isBudgetSheetTransitioning &&
                                "group/sheet-preview",
                            )
                          : "w-full",
                      )}
                      style={
                        shouldUseStackedBudgetSheets
                          ? budgetSheetStackedStyle
                          : undefined
                      }
                    >
                    <Card
                      id={`sheet-${sheetIndex + 1}`}
                      className={cn(
                        "relative scroll-mt-6",
                        isBudgetDocument
                          ? "rounded-[6px] border-[1.25px] border-[#e4e4e7] bg-white shadow-none"
                          : "rounded-sm border-zinc-300 bg-white shadow-sm",
                        shouldUseStackedBudgetSheets &&
                          !isBudgetSheetActive &&
                          "after:pointer-events-none after:absolute after:inset-0 after:rounded-[6px] after:border after:border-transparent after:transition-colors group-hover/sheet-preview:after:border-black",
                      )}
                      style={budgetSheetPreviewStyle}
                    >
                      <CardContent
                        ref={
                          sheetIndex === conceptPages.length - 1 && !shouldRenderSummaryOnNewSheet
                            ? lastConceptPageContentRef
                            : undefined
                        }
                        className={cn(
                          "p-[40px]",
                          isBudgetDocument
                            ? "flex h-full flex-col gap-10 px-[40px] pt-[56px] pb-[56px]"
                            : "space-y-8",
                        )}
                      >
                        {isFirstSheet ? (
                          <BudgetSheetHeader
                            isBudgetDocument={isBudgetDocument}
                            isBudgetSheetInteractive={isBudgetSheetInteractive}
                            documentKind={documentKind}
                            documentTitle={documentTitle}
                            quoteNumber={quoteNumber}
                            issueDate={issueDate}
                            validUntil={client.validUntil}
                            itemsCount={items.length}
                            logoDataUrl={logoDataUrl}
                            logoFileName={logoFileName}
                            isLogoDragOver={isLogoDragOver}
                            isLogoInvalid={visiblePdfExportErrors.logo}
                            isIssueDateInvalid={visiblePdfExportErrors.issueDate}
                            headerMetaWidthPx={budgetSheetStaticLayout.headerMetaWidthPx}
                            headerRef={firstHeaderRef}
                            logoInputRef={logoInputRef}
                            onLogoUpload={handleLogoUpload}
                            onOpenLogoUpload={handleOpenLogoUpload}
                            onLogoDragOver={handleLogoDragOver}
                            onLogoDragLeave={handleLogoDragLeave}
                            onLogoDrop={handleLogoDrop}
                            onQuoteNumberChange={setQuoteNumber}
                            onIssueDateChange={setIssueDate}
                            onValidUntilChange={(next) => handleClientField("validUntil", next)}
                          />
                        ) : null}

                        <div className={cn(isBudgetDocument && "min-h-0 flex flex-1 flex-col")}>
                        <div
                          className={cn("flex min-w-0", isBudgetDocument && "min-h-0 flex-1")}
                          style={
                            isBudgetDocument && budgetSheetStaticLayout.bodyGapPx > 0.5
                              ? { columnGap: `${budgetSheetStaticLayout.bodyGapPx}px` }
                              : undefined
                          }
                        >
                          <div
                            id="body-client"
                            className={cn(isBudgetDocument && "shrink-0")}
                            style={
                              isBudgetDocument
                                ? { width: `${budgetSheetStaticLayout.clientWidthPx}px` }
                                : undefined
                            }
                          >
                            <ClientDetailsPanel
                              isFirstSheet={isFirstSheet}
                              isBudgetDocument={isBudgetDocument}
                              isBudgetSheetInteractive={isBudgetSheetInteractive}
                              client={client}
                              setClient={setClient}
                              firstClientSectionRef={firstClientSectionRef}
                              firstConceptChromeHeight={paginationMetrics.firstConceptChromeHeight}
                              companyReferenceLines={BUDGET_COMPANY_REFERENCE_LINES}
                              isGoogleConfigured={isGoogleConfigured}
                              googleNotice={googleNotice}
                              isGoogleConnecting={isGoogleConnecting}
                              isContactFromGoogle={isContactFromGoogle}
                              googleContactsCount={googleContactsCount}
                              clientAutocompleteContacts={clientAutocompleteContacts}
                              clientAutocompleteQuery={clientAutocompleteQuery}
                              isClientAutocompleteLoading={isClientAutocompleteLoading}
                              conceptComboboxContentClass={conceptComboboxContentClass}
                              conceptRowFieldClass={conceptRowFieldClass}
                              budgetSecondaryFieldClass={budgetSecondaryFieldClass}
                              invalidContactName={visiblePdfExportErrors.contactName}
                              invalidCompanyName={visiblePdfExportErrors.companyName}
                              onClientFieldChange={handleClientField}
                              onRefreshGoogleContacts={handleRefreshGoogleContacts}
                              onApplyGoogleContact={handleApplyGoogleContact}
                              onClientContactNameChange={handleClientContactNameChange}
                            />
                          </div>
                          <div
                            id="body-itemsTable"
                            className="min-w-0 flex-1"
                            style={
                              isBudgetDocument
                                ? { width: `${budgetSheetStaticLayout.tableWidthPx}px` }
                                : undefined
                            }
                          >
                            <ConceptTableSection
                              conceptPage={conceptPage}
                              sheetIndex={sheetIndex}
                              conceptPagesLength={conceptPages.length}
                              items={items}
                              conceptCatalog={conceptCatalog}
                              currency={currency}
                              currencyComboboxValue={currencyComboboxValue}
                              currencyOptions={currencyOptions}
                              isCurrencyUpdating={isCurrencyUpdating}
                              isBudgetDocument={isBudgetDocument}
                              isBudgetSheetActive={isBudgetSheetActive}
                              isBudgetSheetInteractive={isBudgetSheetInteractive}
                              isFirstSheet={isFirstSheet}
                              isPageEmpty={isPageEmpty}
                              emptyConceptDraft={emptyConceptDraft}
                              emptyConceptQuantityDraft={emptyConceptQuantityDraft}
                              emptyConceptUnitPriceDraft={emptyConceptUnitPriceDraft}
                              animatedEmptyConceptLineBase={animatedEmptyConceptLineBase}
                              emptyConceptAutocompleteMatches={emptyConceptAutocompleteMatches}
                              emptyConceptComboboxActions={emptyConceptComboboxActions}
                              budgetHeaderImportActions={budgetHeaderImportActions}
                              linkedQuoteSpreadsheet={linkedQuoteSpreadsheet}
                              linkedConceptCatalogSpreadsheet={linkedConceptCatalogSpreadsheet}
                              isQuoteImporting={isQuoteImporting}
                              isConceptCatalogImporting={isConceptCatalogImporting}
                              visibleConceptRowActionsId={visibleConceptRowActionsId}
                              activeConceptComboboxId={activeConceptComboboxId}
                              activeDraggedItemDndId={activeDraggedItemDndId}
                              visiblePdfExportErrors={visiblePdfExportErrors}
                              invalidItemDescriptionIds={invalidItemDescriptionIds}
                              invalidItemQuantityIds={invalidItemQuantityIds}
                              invalidItemUnitPriceIds={invalidItemUnitPriceIds}
                              emptyConceptBodyHeight={emptyConceptBodyHeight}
                              emptyBudgetConceptFillerHeight={emptyBudgetConceptFillerHeight}
                              conceptBodyFillerHeight={conceptBodyFillerHeight}
                              budgetConceptColumnWidthPx={budgetConceptColumnWidthPx}
                              budgetHasActionColumn={budgetHasActionColumn}
                              budgetTableColumnCount={budgetTableColumnCount}
                              budgetSheetStaticLayout={budgetSheetStaticLayout}
                              firstConceptHeadingRef={firstConceptHeadingRef}
                              firstTableHeaderRef={firstTableHeaderRef}
                              lastContentRowRef={lastConceptPageLastContentRowRef}
                              onConceptTableKeyDownCapture={handleConceptTableKeyDownCapture}
                              onOpenImport={handleOpenImport}
                              onSpreadsheetDragOver={handleSpreadsheetDragOver}
                              onSpreadsheetDragLeave={handleSpreadsheetDragLeave}
                              onSpreadsheetDrop={handleSpreadsheetDrop}
                              isSpreadsheetDragOver={isSpreadsheetDragOver}
                              onCurrencyComboboxValueChange={handleCurrencyComboboxValueChange}
                              onApplyCurrencyChange={applyCurrencyChange}
                              onSetEmptyConceptDraft={setEmptyConceptDraft}
                              onSetEmptyConceptQuantityDraft={setEmptyConceptQuantityDraft}
                              onSetEmptyConceptUnitPriceDraft={setEmptyConceptUnitPriceDraft}
                              onAddFirstConceptFromEmpty={handleAddFirstConceptFromEmpty}
                              onConceptGridFieldKeyDown={handleConceptGridFieldKeyDown}
                              onEmptyConceptInputEnter={handleEmptyConceptInputEnter}
                              onRequestQuoteSpreadsheetImport={handleRequestQuoteSpreadsheetImport}
                              onRequestLinkedQuoteSpreadsheetImport={handleRequestLinkedQuoteSpreadsheetImport}
                              onRequestConceptCatalogImport={handleRequestConceptCatalogImport}
                              onRequestLinkedConceptCatalogSpreadsheetImport={
                                handleRequestLinkedConceptCatalogSpreadsheetImport
                              }
                              onOpenConceptCatalogFileUpload={handleOpenConceptCatalogFileUpload}
                              onUpdateItem={handleUpdateItem}
                              onAddItemBelow={handleAddItemBelow}
                              onRemoveItem={handleRemoveItem}
                              onCategoryMeasureRef={handleCategoryMeasureRef}
                              onItemMeasureRef={handleItemMeasureRef}
                              onActivateCombobox={(itemId) => {
                                setActiveConceptComboboxId((current) =>
                                  current === itemId ? null : current,
                                );
                              }}
                              onActionRailEnter={handleConceptRowActionRailEnter}
                              onActionRailLeave={handleConceptRowActionRailLeave}
                              onActionButtonIntent={handleRowActionButtonIntent}
                              conceptRowFieldClass={conceptRowFieldClass}
                              conceptComboboxContentClass={conceptComboboxContentClass}
                              budgetSecondaryFieldClass={budgetSecondaryFieldClass}
                              budgetNumericFontClass={budgetNumericFontClass}
                            />
                          </div>
                        </div>

                        {sheetIndex === conceptPages.length - 1 && !shouldRenderSummaryOnNewSheet ? (
                          <div
                            ref={lastConceptPageSummaryRef}
                            className="space-y-4"
                          >
                            <BudgetSummarySection
                              isBudgetDocument={isBudgetDocument}
                              usesQuoteSheetLayout={usesQuoteSheetLayout}
                              isInteractive={isBudgetSheetInteractive}
                              shouldRenderBudgetSummarySpacer={shouldRenderBudgetSummarySpacer}
                              isInvoiceDocument={isInvoiceDocument}
                              notes={client.notes}
                              onNotesChange={(next) => handleClientField("notes", next)}
                              currency={currency}
                              subtotal={visibleTotals.subTotal}
                              total={visibleTotals.grandTotal}
                              invoiceTaxLines={invoiceTaxLines}
                              conceptRowFieldClass={conceptRowFieldClass}
                              budgetNumericFontClass={budgetNumericFontClass}
                              onTaxQueryChange={handleInvoiceTaxQueryChange}
                              onTaxOptionSelect={handleInvoiceTaxOptionSelect}
                              onTaxInputBlur={handleInvoiceTaxInputBlur}
                              onTaxRateChange={handleInvoiceTaxRateChange}
                              summaryContainerStyle={budgetSummaryContainerStyle}
                              summaryGridStyle={budgetSummaryGridStyle}
                              summaryNotesWidthPx={budgetSheetStaticLayout.summaryNotesWidthPx}
                              summaryTotalsWidthPx={budgetSheetStaticLayout.summaryTotalsWidthPx}
                              contentClassName={cn(
                                isBudgetDocument ? "clear-both pt-2" : "border-t border-zinc-200 pt-6",
                              )}
                              footerClassName={cn(
                                "flex min-h-9 items-center",
                                isBudgetDocument ? "clear-both pt-4" : "border-t border-zinc-200 pt-4",
                              )}
                              showFooter={shouldRenderBudgetFooter}
                              exportNotice={exportNotice}
                            />
                          </div>
                        ) : null}
                        </div>
                      </CardContent>
                      {isBudgetDocument && totalSheetCount > 1 ? (
                        <p className="pointer-events-none absolute bottom-6 left-10 text-[12px] leading-5 text-[#52525c]">
                          {sheetIndex + 1}/{totalSheetCount}
                        </p>
                      ) : null}
                      {shouldUseStackedBudgetSheets && !isBudgetSheetActive ? (
                        <button
                          type="button"
                          aria-label={`Center page ${sheetIndex + 1}`}
                          className={cn(
                            "absolute inset-0 z-30 cursor-pointer",
                            isBudgetSheetTransitioning && "pointer-events-none",
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            focusBudgetSheet(sheetIndex);
                          }}
                        />
                      ) : null}
                    </Card>
                    </div>
                    {!shouldUseStackedBudgetSheets &&
                    (sheetIndex < conceptPages.length - 1 ||
                      (shouldRenderSummaryOnNewSheet &&
                        sheetIndex === conceptPages.length - 1)) ? (
                      <div className="h-px w-[calc(100%+48px)] -translate-x-6 bg-black" />
                    ) : null}
                  </Fragment>
                );
              })}
            </SortableContext>
          </DndContext>

          {shouldRenderVisibleSummarySheet ? (
            <div
              className={cn(
                shouldUseStackedBudgetSheets
                  ? cn(
                      "relative shrink-0",
                      !isSummarySheetActive &&
                        !isBudgetSheetTransitioning &&
                        "group/sheet-preview",
                    )
                  : "w-full",
              )}
              style={
                shouldUseStackedBudgetSheets
                  ? budgetSheetStackedStyle
                  : undefined
              }
            >
            <Card
              id={`sheet-${summarySheetIndex + 1}`}
              className={cn(
                "relative shrink-0 scroll-mt-6",
                isBudgetDocument
                  ? "rounded-[6px] border-[1.25px] border-[#e4e4e7] bg-white shadow-none"
                  : "rounded-sm border-zinc-300 bg-white shadow-sm",
                shouldUseStackedBudgetSheets &&
                  !isSummarySheetActive &&
                  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[6px] after:border after:border-transparent after:transition-colors group-hover/sheet-preview:after:border-black",
              )}
              style={budgetSheetPreviewStyle}
            >
              <CardContent
                className={cn(
                  "p-[40px]",
                  isBudgetDocument
                    ? "flex h-full flex-col gap-10 px-[40px] pt-[56px] pb-[56px]"
                    : "space-y-8",
                )}
              >
                {!isBudgetDocument ? (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium text-zinc-800">Summary</h2>
                  </section>
                ) : null}

                <div className={cn(isBudgetDocument && "mt-auto space-y-4")}>
                  <BudgetSummarySection
                    isBudgetDocument={isBudgetDocument}
                    usesQuoteSheetLayout={usesQuoteSheetLayout}
                    isInteractive={isSummarySheetInteractive}
                    shouldRenderBudgetSummarySpacer={shouldRenderBudgetSummarySpacer}
                    isInvoiceDocument={isInvoiceDocument}
                    notes={client.notes}
                    onNotesChange={(next) => handleClientField("notes", next)}
                    currency={currency}
                    subtotal={visibleTotals.subTotal}
                    total={visibleTotals.grandTotal}
                    invoiceTaxLines={invoiceTaxLines}
                    conceptRowFieldClass={conceptRowFieldClass}
                    budgetNumericFontClass={budgetNumericFontClass}
                    onTaxQueryChange={handleInvoiceTaxQueryChange}
                    onTaxOptionSelect={handleInvoiceTaxOptionSelect}
                    onTaxInputBlur={handleInvoiceTaxInputBlur}
                    onTaxRateChange={handleInvoiceTaxRateChange}
                    summaryContainerStyle={budgetSummaryContainerStyle}
                    summaryGridStyle={budgetSummaryGridStyle}
                    summaryNotesWidthPx={budgetSheetStaticLayout.summaryNotesWidthPx}
                    summaryTotalsWidthPx={budgetSheetStaticLayout.summaryTotalsWidthPx}
                    contentClassName={cn(
                      isBudgetDocument ? "pt-2" : "border-t border-zinc-200 pt-6",
                    )}
                    footerClassName={cn(
                      "flex min-h-9 items-center",
                      isBudgetDocument ? "pt-4" : "border-t border-zinc-200 pt-4",
                    )}
                    showFooter={shouldRenderBudgetFooter}
                    exportNotice={exportNotice}
                  />
                </div>
              </CardContent>
              {isBudgetDocument && totalSheetCount > 1 ? (
                <p className="pointer-events-none absolute bottom-6 left-10 text-[12px] leading-5 text-[#52525c]">
                  {summarySheetIndex + 1}/{totalSheetCount}
                </p>
              ) : null}
              {shouldUseStackedBudgetSheets &&
              activeBudgetSheetIndex !== summarySheetIndex ? (
                <button
                  type="button"
                  aria-label={`Center page ${summarySheetIndex + 1}`}
                  className={cn(
                    "absolute inset-0 z-30 cursor-pointer",
                    isBudgetSheetTransitioning && "pointer-events-none",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    focusBudgetSheet(summarySheetIndex);
                  }}
                />
              ) : null}
            </Card>
            </div>
          ) : null}
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-4 w-full max-w-[1160px] px-4 md:px-6">
        <div className="rounded-[10px] border border-zinc-200 bg-white/80 px-4 py-3 text-xs text-zinc-600 shadow-sm">
          <p>
            <span className="font-medium text-zinc-900">budget-generator-interface</span> is
            maintained by <span className="font-medium text-zinc-900">datobueno</span>, an
            association. <span className="font-medium text-zinc-900">datobueno</span> is not the
            product name.
          </p>
          <p className="mt-1">
            Copyright (C) 2026 datobueno association. Licensed under
            <span className="font-medium text-zinc-900"> AGPL-3.0-or-later</span>. You may use,
            modify, and convey this software under that license. No warranty.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              Source
            </a>
            <a
              href={LICENSE_URL}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              AGPL-3.0-or-later
            </a>
            <a
              href={TRADEMARKS_URL}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900"
            >
              Trademark Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
