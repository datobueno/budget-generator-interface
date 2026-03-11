import {
  Document,
  Image,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatMoney, getLineBase, type DocumentKind, type QuoteItem, type QuoteTotals } from "@/entities/quote";
import type { ClientDetails } from "@/entities/client";

type QuotePdfData = {
  quoteNumber: string;
  issueDate: string;
  currency: string;
  client: ClientDetails;
  items: QuoteItem[];
  totals: QuoteTotals;
  logoDataUrl?: string;
  documentKind: DocumentKind;
};

type QuotePdfDocumentProps = {
  data: QuotePdfData;
};

type GroupedCategory = {
  category: string;
  items: QuoteItem[];
  isContinuation?: boolean;
};

type ConceptPage = {
  groups: GroupedCategory[];
};

type PaginationResult = {
  pages: ConceptPage[];
  summaryOnNewSheet: boolean;
};

type ConceptPdfPageProps = {
  client: ClientDetails;
  conceptPage: ConceptPage;
  currency: string;
  isFirstPage: boolean;
  logoDataUrl?: string;
  pageNumber: number;
  quoteNumber: string;
  showSummary: boolean;
  totalPages: number;
  totals: QuoteTotals;
  documentKind: DocumentKind;
  issueDate: string;
};

type SummaryPdfPageProps = {
  client: ClientDetails;
  currency: string;
  pageNumber: number;
  totalPages: number;
  totals: QuoteTotals;
  documentKind: DocumentKind;
};

const PX_TO_PT = 0.75;
const px = (value: number): number => Number((value * PX_TO_PT).toFixed(3));

const PORTRAIT_A4_WIDTH_PX = 793.984;
const PORTRAIT_A4_HEIGHT_PX = 1122.988;
const REFERENCE_INNER_WIDTH_PX = 714;
const PAPER_WIDTH = px(PORTRAIT_A4_HEIGHT_PX);
const PAPER_HEIGHT = px(PORTRAIT_A4_WIDTH_PX);
const PAPER_SIZE: [number, number] = [PAPER_WIDTH, PAPER_HEIGHT];
const PAPER_BORDER_COLOR = "#e4e4e7";
const PRIMARY_TEXT = "#171717";
const MUTED_TEXT = "#52525c";
const PLACEHOLDER_TEXT = "#737373";
const BRAND_MUTED_TEXT = "#cecece";
const LOGO_BORDER = "#dccbcb";
const PAGE_LEFT = px(40);
const PAGE_RIGHT = px(40);
const PAGE_TOP = px(56);
const PAGE_BOTTOM = px(56);
const INNER_WIDTH = PAPER_WIDTH - PAGE_LEFT - PAGE_RIGHT;
const REFERENCE_INNER_WIDTH = px(REFERENCE_INNER_WIDTH_PX);
const scaleLayoutWidth = (value: number): number =>
  Number(((px(value) * INNER_WIDTH) / REFERENCE_INNER_WIDTH).toFixed(3));
const scaleLayoutHeight = (value: number): number =>
  px((value * PORTRAIT_A4_WIDTH_PX) / PORTRAIT_A4_HEIGHT_PX);
const CLIENT_COLUMN_WIDTH = scaleLayoutWidth(216);
const BODY_COLUMN_GAP = px(0);
const TABLE_WIDTH = PAPER_WIDTH - PAGE_LEFT - PAGE_RIGHT - CLIENT_COLUMN_WIDTH - BODY_COLUMN_GAP;
const CONCEPT_COLUMN_WIDTH = scaleLayoutWidth(198);
const QUANTITY_COLUMN_WIDTH = scaleLayoutWidth(80);
const UNIT_PRICE_COLUMN_WIDTH = scaleLayoutWidth(96);
const TOTAL_COLUMN_WIDTH = TABLE_WIDTH - CONCEPT_COLUMN_WIDTH - QUANTITY_COLUMN_WIDTH - UNIT_PRICE_COLUMN_WIDTH;
const LOGO_BOX_SIZE = px(128);
const FIRST_PAGE_BODY_MARGIN_TOP = px(40);
const FIRST_PAGE_CLIENT_OFFSET = px(76);
const TABLE_HEADER_HEIGHT = px(56);
const CATEGORY_ROW_HEIGHT = px(44);
const ITEM_ROW_HEIGHT = px(40);
const SUMMARY_LEFT_WIDTH = scaleLayoutWidth(407.5);
const SUMMARY_GAP = px(0);
const SUMMARY_RIGHT_WIDTH = INNER_WIDTH - SUMMARY_LEFT_WIDTH - SUMMARY_GAP;
const PAGE_NUMBER_MARGIN_TOP = px(16);
const DEFAULT_CATEGORY = "General";
const BUDGET_COMPANY_REFERENCE_LINES = ["Datobueno INC.", "46766948J", "+34 656 33 23 03"] as const;
const FIRST_NO_SUMMARY_CAP = scaleLayoutHeight(660);
const FIRST_WITH_SUMMARY_CAP = scaleLayoutHeight(500);
const CONTINUATION_NO_SUMMARY_CAP = scaleLayoutHeight(900);
const CONTINUATION_WITH_SUMMARY_CAP = scaleLayoutHeight(740);

function formatBudgetDate(iso: string, placeholder: string): string {
  if (!iso) return placeholder;

  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return placeholder;

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return placeholder;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getCurrencySymbol(currency: string): string {
  const normalizedCurrency = (currency || "EUR").trim().toUpperCase() || "EUR";
  const getPartValue = (currencyDisplay: "narrowSymbol" | "symbol"): string | null => {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((entry) => entry.type === "currency");

    return part?.value ?? null;
  };

  return getPartValue("narrowSymbol") ?? getPartValue("symbol") ?? normalizedCurrency;
}

function formatBudgetAmountParts(value: number): {
  sign: string;
  integer: string;
  decimal: string;
} {
  const rounded = Math.round(value * 100) / 100;
  const absolute = Math.abs(rounded);
  const [integer, decimal] = absolute.toFixed(2).split(".");

  return {
    sign: rounded < 0 ? "-" : "",
    integer,
    decimal,
  };
}

function formatTableNumber(value: number | null | undefined): string {
  const numericValue = value ?? 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getDisplayText(value: string, placeholder: string): string {
  const trimmed = value.trim();
  return trimmed || placeholder;
}

function groupItemsByCategory(items: QuoteItem[]): GroupedCategory[] {
  const groups: GroupedCategory[] = [];
  const groupIndexByCategory = new Map<string, number>();

  items.forEach((item) => {
    const category = item.category.trim() || DEFAULT_CATEGORY;
    const index = groupIndexByCategory.get(category);

    if (index === undefined) {
      groupIndexByCategory.set(category, groups.length);
      groups.push({ category, items: [{ ...item, category }] });
      return;
    }

    groups[index].items.push({ ...item, category });
  });

  return groups;
}

function buildPageCapacities(
  pageCount: number,
  firstNoSummaryCap: number,
  firstWithSummaryCap: number,
  continuationNoSummaryCap: number,
  continuationWithSummaryCap: number,
): number[] {
  if (pageCount <= 1) return [firstWithSummaryCap];

  const capacities: number[] = [firstNoSummaryCap];
  for (let index = 1; index < pageCount - 1; index += 1) {
    capacities.push(continuationNoSummaryCap);
  }
  capacities.push(continuationWithSummaryCap);
  return capacities;
}

function tryPaginateWithCapacities(
  groups: GroupedCategory[],
  capacities: number[],
): ConceptPage[] | null {
  const pages: ConceptPage[] = [];
  let categoryIndex = 0;
  let itemIndex = 0;

  for (const capacity of capacities) {
    if (categoryIndex >= groups.length) break;

    const pageGroups: GroupedCategory[] = [];
    let usedHeight = 0;

    while (categoryIndex < groups.length) {
      const group = groups[categoryIndex];
      const isContinuation = itemIndex > 0;
      const categoryHeight = isContinuation ? 0 : CATEGORY_ROW_HEIGHT;
      const nextItem = group.items[itemIndex];

      if (!nextItem) {
        categoryIndex += 1;
        itemIndex = 0;
        continue;
      }

      const minimalChunkHeight = categoryHeight + ITEM_ROW_HEIGHT;
      if (usedHeight > 0 && usedHeight + minimalChunkHeight > capacity) break;

      const pageGroup: GroupedCategory = {
        category: group.category,
        items: [],
        isContinuation,
      };
      pageGroups.push(pageGroup);
      usedHeight += categoryHeight;

      while (itemIndex < group.items.length) {
        const item = group.items[itemIndex];
        const nextUsedHeight = usedHeight + ITEM_ROW_HEIGHT;

        if (nextUsedHeight > capacity && pageGroup.items.length > 0) break;

        pageGroup.items.push(item);
        usedHeight = nextUsedHeight;
        itemIndex += 1;
      }

      if (itemIndex < group.items.length) break;

      categoryIndex += 1;
      itemIndex = 0;
    }

    if (pageGroups.length === 0) return null;
    pages.push({ groups: pageGroups });
  }

  return categoryIndex === groups.length ? pages : null;
}

function paginateConceptGroups(groups: GroupedCategory[]): PaginationResult {
  if (groups.length === 0) return { pages: [{ groups: [] }], summaryOnNewSheet: false };

  const maxPageCount =
    groups.reduce((total, group) => total + Math.max(group.items.length, 1), 0) + groups.length;

  for (let pageCount = 1; pageCount <= maxPageCount; pageCount += 1) {
    const pages = tryPaginateWithCapacities(
      groups,
      buildPageCapacities(
        pageCount,
        FIRST_NO_SUMMARY_CAP,
        FIRST_WITH_SUMMARY_CAP,
        CONTINUATION_NO_SUMMARY_CAP,
        CONTINUATION_WITH_SUMMARY_CAP,
      ),
    );
    if (pages) return { pages, summaryOnNewSheet: false };
  }

  for (let pageCount = 1; pageCount <= maxPageCount; pageCount += 1) {
    const capacities =
      pageCount === 1
        ? [FIRST_NO_SUMMARY_CAP]
        : [
            FIRST_NO_SUMMARY_CAP,
            ...Array.from({ length: pageCount - 1 }, () => CONTINUATION_NO_SUMMARY_CAP),
          ];
    const pages = tryPaginateWithCapacities(groups, capacities);
    if (pages) return { pages, summaryOnNewSheet: true };
  }

  return {
    pages: groups.map((group) => ({ groups: [{ ...group, isContinuation: false }] })),
    summaryOnNewSheet: true,
  };
}

function CalendarIconPdf({ muted = false }: { muted?: boolean }) {
  const color = muted ? PLACEHOLDER_TEXT : MUTED_TEXT;

  return (
    <Svg width={px(16)} height={px(16)} viewBox="0 0 16 16">
      <Rect x={2} y={3} width={12} height={11} rx={1.5} stroke={color} strokeWidth={1} fill="none" />
      <Path d="M2 6.5H14" stroke={color} strokeWidth={1} />
      <Path d="M5 1.75V4.25" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Path d="M11 1.75V4.25" stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

function BudgetPdfHeader({
  logoDataUrl,
  quoteNumber,
  issueDate,
  validUntil,
  isEmptyBudget,
}: {
  logoDataUrl?: string;
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  isEmptyBudget: boolean;
}) {
  const issueLabel = formatBudgetDate(issueDate, isEmptyBudget ? "Sent on ..." : "Sent on");
  const validUntilLabel = formatBudgetDate(
    validUntil,
    isEmptyBudget ? "Valid until ..." : "Valid until",
  );
  const issueTextStyle = issueDate.trim()
    ? styles.metaFieldText
    : [styles.metaFieldText, styles.placeholderText];
  const validUntilTextStyle = validUntil.trim()
    ? styles.metaFieldText
    : [styles.metaFieldText, styles.placeholderText];

  return (
    <View style={styles.headerSection} wrap={false}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeftColumn}>
          <View style={styles.logoColumn}>
            <View style={styles.logoBox}>
              {logoDataUrl ? (
                <Image source={{ uri: logoDataUrl }} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoPlaceholder}>Logo</Text>
              )}
            </View>
          </View>

          <View style={styles.companyDetailsColumn}>
            {BUDGET_COMPANY_REFERENCE_LINES.map((line) => (
              <Text key={line} style={styles.companyReferenceLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.headerRightColumn}>
          <View style={styles.quoteNumberColumn}>
            <Text style={styles.quoteNumber}>
              {getDisplayText(quoteNumber, "####_quote_####")}
            </Text>
          </View>

          <View style={styles.datesColumn}>
            <View style={styles.dateRow}>
              <CalendarIconPdf muted={!issueDate.trim()} />
              <Text style={issueTextStyle}>{issueLabel}</Text>
            </View>

            <View style={styles.dateRow}>
              <CalendarIconPdf muted={!validUntil.trim()} />
              <Text style={validUntilTextStyle}>{validUntilLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function BudgetPdfClientColumn({ client }: { client: ClientDetails }) {
  const contactTextStyle = client.contactName.trim()
    ? styles.clientPrimaryText
    : [styles.clientPrimaryText, styles.placeholderText];

  return (
    <View style={styles.clientColumn} wrap={false}>
      <Text style={contactTextStyle}>{getDisplayText(client.contactName, "Contact person")}</Text>
      <Text style={styles.clientMutedText}>{getDisplayText(client.email, "client@example.com")}</Text>
      <Text style={styles.clientMutedText}>{getDisplayText(client.companyName, "Company")}</Text>
    </View>
  );
}

function BudgetPdfTableHeader({
  currency,
}: {
  currency: string;
}) {
  return (
    <View style={styles.tableHeader}>
      <View style={styles.descriptionColumn} />
      <View style={styles.quantityColumn}>
        <Text style={styles.tableHeaderLabel}>#</Text>
      </View>
      <View style={styles.unitPriceColumn}>
        <Text style={styles.tableHeaderLabel}>{`u/${getCurrencySymbol(currency)}`}</Text>
      </View>
      <View style={styles.totalColumn}>
        <Text style={[styles.tableHeaderLabel, styles.totalHeaderLabel]}>Total</Text>
      </View>
    </View>
  );
}

function BudgetPdfGroupRows({
  group,
  currency,
}: {
  group: GroupedCategory;
  currency: string;
}) {
  return (
    <View wrap={false}>
      {!group.isContinuation ? (
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{group.category}</Text>
        </View>
      ) : null}

      {group.items.map((item) => (
        <View style={styles.itemRow} key={item.id} wrap={false}>
          <View style={styles.descriptionColumn}>
            <Text style={styles.descriptionCell}>{item.description.trim() || "Item"}</Text>
          </View>
          <View style={styles.quantityColumn}>
            <Text style={styles.quantityCell}>{formatTableNumber(item.quantity)}</Text>
          </View>
          <View style={styles.unitPriceColumn}>
            <Text style={styles.unitPriceCell}>{formatTableNumber(item.unitPrice)}</Text>
          </View>
          <View style={styles.totalColumn}>
            <Text style={styles.totalCell}>{formatMoney(getLineBase(item), currency)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function BudgetPdfTotals({
  currency,
  totals,
  documentKind,
}: {
  currency: string;
  totals: QuoteTotals;
  documentKind: DocumentKind;
}) {
  const subtotalParts = formatBudgetAmountParts(totals.subTotal);
  const totalParts = formatBudgetAmountParts(totals.grandTotal);
  const currencySymbol = getCurrencySymbol(currency);
  const isInvoice = documentKind === "invoice";

  return (
    <View style={styles.totalsContent}>
      <Text style={styles.summaryCaption}>Subtotal</Text>
      <Text style={styles.summaryAmount}>
        <Text style={styles.summaryAmountInteger}>{`${subtotalParts.sign}${subtotalParts.integer}.`}</Text>
        <Text style={styles.summaryAmountDecimal}>{`${subtotalParts.decimal} `}</Text>
        <Text style={styles.summaryAmountInteger}>{currencySymbol}</Text>
      </Text>

      {isInvoice ? (
        <View style={styles.invoiceTotalsBlock}>
          <View style={styles.invoiceTotalsRow}>
            <Text style={styles.invoiceTotalsLabel}>VAT</Text>
            <Text style={styles.invoiceTotalsValue}>{formatMoney(totals.taxTotal, currency)}</Text>
          </View>
          <View style={styles.invoiceTotalsRow}>
            <Text style={styles.invoiceTotalsLabel}>Total</Text>
            <Text style={styles.invoiceTotalsValue}>{formatMoney(totals.grandTotal, currency)}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.summaryFootnote}>Taxes not included</Text>
      )}

      {isInvoice ? (
        <Text style={[styles.summaryAmount, styles.invoiceGrandTotal]}>
          <Text style={styles.summaryAmountInteger}>{`${totalParts.sign}${totalParts.integer}.`}</Text>
          <Text style={styles.summaryAmountDecimal}>{`${totalParts.decimal} `}</Text>
          <Text style={styles.summaryAmountInteger}>{currencySymbol}</Text>
        </Text>
      ) : null}
    </View>
  );
}

function BudgetPdfSummarySection({
  client,
  currency,
  totals,
  documentKind,
}: {
  client: ClientDetails;
  currency: string;
  totals: QuoteTotals;
  documentKind: DocumentKind;
}) {
  return (
    <View style={styles.summarySection} wrap={false}>
      <View style={styles.notesColumn}>
        <Text style={styles.summaryTitle}>Notes</Text>
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{client.notes.trim() || " "}</Text>
          <Text style={styles.notesCounter}>{`${client.notes.length}/250`}</Text>
        </View>
      </View>

      <View style={styles.totalsColumn}>
        <BudgetPdfTotals currency={currency} totals={totals} documentKind={documentKind} />
      </View>
    </View>
  );
}

function BudgetPdfPageNumber({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return <Text style={styles.pageNumber}>{`${pageNumber}/${totalPages}`}</Text>;
}

function ConceptPdfPage({
  client,
  conceptPage,
  currency,
  isFirstPage,
  logoDataUrl,
  pageNumber,
  quoteNumber,
  showSummary,
  totalPages,
  totals,
  documentKind,
  issueDate,
}: ConceptPdfPageProps) {
  const isEmptyBudget = conceptPage.groups.length === 0;

  return (
    <Page size={PAPER_SIZE} style={styles.page}>
      <View style={styles.paper}>
        {isFirstPage ? (
          <BudgetPdfHeader
            logoDataUrl={logoDataUrl}
            quoteNumber={quoteNumber}
            issueDate={issueDate}
            validUntil={client.validUntil}
            isEmptyBudget={isEmptyBudget}
          />
        ) : null}

        <View
          style={[styles.bodyRow, isFirstPage ? styles.firstPageBodyRow : styles.continuationBodyRow]}
          wrap={false}
        >
          <View style={styles.bodySideColumn}>
            {isFirstPage ? <BudgetPdfClientColumn client={client} /> : null}
          </View>

          <View style={styles.tableColumn}>
            <BudgetPdfTableHeader currency={currency} />
            <View>
              {conceptPage.groups.map((group) => (
                <BudgetPdfGroupRows
                  key={`${group.category}-${group.items[0]?.id ?? "empty"}`}
                  group={group}
                  currency={currency}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.pageFill} />

        {showSummary ? (
          <BudgetPdfSummarySection
            client={client}
            currency={currency}
            totals={totals}
            documentKind={documentKind}
          />
        ) : null}

        <BudgetPdfPageNumber pageNumber={pageNumber} totalPages={totalPages} />
      </View>
    </Page>
  );
}

function SummaryPdfPage({
  client,
  currency,
  pageNumber,
  totalPages,
  totals,
  documentKind,
}: SummaryPdfPageProps) {
  return (
    <Page size={PAPER_SIZE} style={styles.page}>
      <View style={styles.paper}>
        <View style={styles.pageFill} />
        <BudgetPdfSummarySection
          client={client}
          currency={currency}
          totals={totals}
          documentKind={documentKind}
        />
        <BudgetPdfPageNumber pageNumber={pageNumber} totalPages={totalPages} />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
  },
  paper: {
    flex: 1,
    borderWidth: px(1.25),
    borderColor: PAPER_BORDER_COLOR,
    borderRadius: px(6),
    paddingTop: PAGE_TOP,
    paddingRight: PAGE_RIGHT,
    paddingBottom: PAGE_BOTTOM,
    paddingLeft: PAGE_LEFT,
    fontFamily: "Helvetica",
    color: PRIMARY_TEXT,
  },
  headerSection: {
    width: INNER_WIDTH,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerLeftColumn: {
    flexDirection: "column",
    flexGrow: 1,
  },
  headerRightColumn: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: px(4),
    width: scaleLayoutWidth(168),
    marginLeft: px(24),
    flexShrink: 0,
  },
  logoColumn: {
    width: LOGO_BOX_SIZE,
    alignItems: "flex-start",
  },
  logoBox: {
    width: LOGO_BOX_SIZE,
    height: LOGO_BOX_SIZE,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: LOGO_BORDER,
    borderRadius: px(6),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: LOGO_BOX_SIZE,
    height: LOGO_BOX_SIZE,
    objectFit: "contain",
  },
  logoPlaceholder: {
    fontFamily: "Helvetica-Bold",
    fontSize: px(24),
    lineHeight: px(36),
    color: BRAND_MUTED_TEXT,
  },
  companyDetailsColumn: {
    marginTop: px(16),
    paddingTop: px(8),
  },
  companyReferenceLine: {
    fontSize: px(12),
    lineHeight: px(12),
    color: "#0a0a0a",
  },
  quoteNumberColumn: {
    alignItems: "stretch",
  },
  quoteNumber: {
    fontSize: px(16),
    lineHeight: px(24),
    color: MUTED_TEXT,
  },
  datesColumn: {
    flexDirection: "column",
    gap: px(4),
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaFieldText: {
    marginLeft: px(8),
    fontSize: px(14),
    lineHeight: px(20),
    color: PRIMARY_TEXT,
  },
  placeholderText: {
    color: PLACEHOLDER_TEXT,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: INNER_WIDTH,
  },
  firstPageBodyRow: {
    marginTop: FIRST_PAGE_BODY_MARGIN_TOP,
  },
  continuationBodyRow: {
    marginTop: 0,
  },
  bodySideColumn: {
    width: CLIENT_COLUMN_WIDTH,
    marginRight: BODY_COLUMN_GAP,
    flexShrink: 0,
  },
  clientColumn: {
    paddingTop: FIRST_PAGE_CLIENT_OFFSET,
  },
  clientPrimaryText: {
    fontSize: px(14),
    lineHeight: px(20),
    color: PRIMARY_TEXT,
  },
  clientMutedText: {
    marginTop: px(12),
    fontSize: px(14),
    lineHeight: px(20),
    color: PLACEHOLDER_TEXT,
  },
  tableColumn: {
    width: TABLE_WIDTH,
    flexShrink: 0,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: TABLE_HEADER_HEIGHT,
  },
  descriptionColumn: {
    width: CONCEPT_COLUMN_WIDTH,
    paddingRight: px(12),
  },
  quantityColumn: {
    width: QUANTITY_COLUMN_WIDTH,
    paddingLeft: px(8),
  },
  unitPriceColumn: {
    width: UNIT_PRICE_COLUMN_WIDTH,
    paddingLeft: px(8),
  },
  totalColumn: {
    width: TOTAL_COLUMN_WIDTH,
  },
  tableHeaderLabel: {
    fontSize: px(14),
    lineHeight: px(20),
    color: PLACEHOLDER_TEXT,
  },
  totalHeaderLabel: {
    textAlign: "right",
  },
  categoryRow: {
    height: CATEGORY_ROW_HEIGHT,
    justifyContent: "center",
  },
  categoryText: {
    fontFamily: "Helvetica-Bold",
    fontSize: px(16),
    lineHeight: px(24),
    color: PRIMARY_TEXT,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_ROW_HEIGHT,
  },
  descriptionCell: {
    fontSize: px(14),
    lineHeight: px(20),
    color: PRIMARY_TEXT,
  },
  quantityCell: {
    fontFamily: "Courier",
    fontSize: px(14),
    lineHeight: px(20),
    color: "#0a0a0a",
  },
  unitPriceCell: {
    fontFamily: "Courier",
    fontSize: px(14),
    lineHeight: px(20),
    color: "#0a0a0a",
  },
  totalCell: {
    fontFamily: "Courier",
    fontSize: px(14),
    lineHeight: px(20),
    color: "#0a0a0a",
    textAlign: "right",
  },
  pageFill: {
    flexGrow: 1,
  },
  summarySection: {
    width: INNER_WIDTH,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  notesColumn: {
    width: SUMMARY_LEFT_WIDTH,
  },
  summaryTitle: {
    marginBottom: px(8),
    fontFamily: "Helvetica-Bold",
    fontSize: px(14),
    lineHeight: px(20),
    color: PRIMARY_TEXT,
  },
  notesBox: {
    height: px(104),
    borderWidth: px(1.25),
    borderColor: "#e5e5e5",
    borderRadius: px(8),
    paddingTop: px(12),
    paddingRight: px(12),
    paddingBottom: px(12),
    paddingLeft: px(12),
  },
  notesText: {
    flexGrow: 1,
    fontSize: px(14),
    lineHeight: px(20),
    color: PRIMARY_TEXT,
  },
  notesCounter: {
    marginTop: px(8),
    fontSize: px(14),
    lineHeight: px(20),
    color: PLACEHOLDER_TEXT,
  },
  totalsColumn: {
    marginLeft: SUMMARY_GAP,
    width: SUMMARY_RIGHT_WIDTH,
    alignItems: "flex-end",
  },
  totalsContent: {
    alignItems: "flex-end",
  },
  summaryCaption: {
    fontSize: px(12),
    lineHeight: px(18),
    color: MUTED_TEXT,
  },
  summaryAmount: {
    marginTop: px(10),
    fontFamily: "Courier-Bold",
    color: "#0a0a0a",
    textAlign: "right",
  },
  summaryAmountInteger: {
    fontSize: px(24),
    lineHeight: px(28),
  },
  summaryAmountDecimal: {
    fontSize: px(18),
    lineHeight: px(28),
  },
  summaryFootnote: {
    marginTop: px(10),
    fontFamily: "Helvetica-Oblique",
    fontSize: px(12),
    lineHeight: px(18),
    color: MUTED_TEXT,
  },
  invoiceTotalsBlock: {
    marginTop: px(10),
    width: scaleLayoutWidth(180),
  },
  invoiceTotalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: px(4),
  },
  invoiceTotalsLabel: {
    fontSize: px(12),
    lineHeight: px(18),
    color: MUTED_TEXT,
  },
  invoiceTotalsValue: {
    fontFamily: "Courier",
    fontSize: px(12),
    lineHeight: px(18),
    color: PRIMARY_TEXT,
  },
  invoiceGrandTotal: {
    marginTop: px(4),
  },
  pageNumber: {
    marginTop: PAGE_NUMBER_MARGIN_TOP,
    fontSize: px(12),
    lineHeight: px(20),
    color: MUTED_TEXT,
  },
});

export function QuotePdfDocument({ data }: QuotePdfDocumentProps) {
  const {
    client,
    currency,
    issueDate,
    items,
    quoteNumber,
    totals,
    logoDataUrl,
    documentKind,
  } = data;
  const groupedItems = groupItemsByCategory(items);
  const pagination = paginateConceptGroups(groupedItems);
  const conceptPages = pagination.pages;
  const totalPages = conceptPages.length + (pagination.summaryOnNewSheet ? 1 : 0);
  const documentTitle = documentKind === "invoice" ? "Invoice" : "Quote";

  return (
    <Document title={`${documentTitle} ${quoteNumber}`.trim()}>
      {conceptPages.map((conceptPage, index) => (
        <ConceptPdfPage
          key={`concept-page-${index}`}
          client={client}
          conceptPage={conceptPage}
          currency={currency}
          documentKind={documentKind}
          isFirstPage={index === 0}
          issueDate={issueDate}
          logoDataUrl={logoDataUrl}
          pageNumber={index + 1}
          quoteNumber={quoteNumber}
          showSummary={!pagination.summaryOnNewSheet && index === conceptPages.length - 1}
          totalPages={totalPages}
          totals={totals}
        />
      ))}

      {pagination.summaryOnNewSheet ? (
        <SummaryPdfPage
          client={client}
          currency={currency}
          documentKind={documentKind}
          pageNumber={totalPages}
          totalPages={totalPages}
          totals={totals}
        />
      ) : null}
    </Document>
  );
}
