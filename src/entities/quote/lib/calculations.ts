import type { QuoteItem, QuoteTotals } from "../types";

const round2 = (value: number): number => Math.round(value * 100) / 100;
const safe = (value: number | null | undefined): number => value ?? 0;

export const getLineBase = (item: QuoteItem): number =>
  round2(safe(item.quantity) * safe(item.unitPrice));

export const getLineDiscount = (item: QuoteItem): number =>
  round2(getLineBase(item) * (item.discountPct / 100));

export const getLineTax = (item: QuoteItem): number => {
  const taxable = getLineBase(item) - getLineDiscount(item);
  return round2(taxable * (item.taxPct / 100));
};

export const getLineTotal = (item: QuoteItem): number => {
  const net = getLineBase(item) - getLineDiscount(item);
  return round2(net + getLineTax(item));
};

export const getQuoteTotals = (items: QuoteItem[]): QuoteTotals => {
  const subTotal = round2(items.reduce((acc, item) => acc + getLineBase(item), 0));
  const discountTotal = round2(
    items.reduce((acc, item) => acc + getLineDiscount(item), 0),
  );
  const taxTotal = round2(items.reduce((acc, item) => acc + getLineTax(item), 0));
  const grandTotal = round2(subTotal - discountTotal + taxTotal);

  return { subTotal, discountTotal, taxTotal, grandTotal };
};

export const formatMoney = (value: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
