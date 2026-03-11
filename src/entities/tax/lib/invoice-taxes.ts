import type { InvoiceTaxLine, InvoiceTaxOption } from "../types";

export const INVOICE_TAX_OPTIONS: readonly InvoiceTaxOption[] = [
  { code: "vat", label: "VAT / IVA", region: "European Union", defaultRate: 21 },
  { code: "gst", label: "GST", region: "Global", defaultRate: 10 },
  { code: "sales-tax", label: "Sales tax", region: "United States", defaultRate: null },
  { code: "hst", label: "HST", region: "Canada", defaultRate: 13 },
  { code: "pst", label: "PST", region: "Canada", defaultRate: 7 },
  { code: "qst", label: "QST", region: "Quebec", defaultRate: 9.975 },
  { code: "igic", label: "IGIC", region: "Canary Islands", defaultRate: 7 },
  { code: "ipsi", label: "IPSI", region: "Ceuta / Melilla", defaultRate: 4 },
] as const;

export const DEFAULT_INVOICE_TAX_CODE = INVOICE_TAX_OPTIONS[0]?.code ?? "vat";
export const DEFAULT_INVOICE_TAX_RATE = INVOICE_TAX_OPTIONS[0]?.defaultRate ?? 21;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getInvoiceTaxOption(taxCode: string): InvoiceTaxOption | null {
  return INVOICE_TAX_OPTIONS.find((option) => option.code === taxCode) ?? null;
}

export function getInvoiceTaxLabel(taxCode: string): string {
  return getInvoiceTaxOption(taxCode)?.label ?? "Tax";
}

export function createInvoiceTaxLine(): InvoiceTaxLine {
  return {
    id: crypto.randomUUID(),
    taxCode: DEFAULT_INVOICE_TAX_CODE,
    query: getInvoiceTaxLabel(DEFAULT_INVOICE_TAX_CODE),
    rate: DEFAULT_INVOICE_TAX_RATE,
  };
}

export function getInvoiceTaxAmount(baseAmount: number, taxLine: InvoiceTaxLine): number {
  if (taxLine.rate === null) return 0;
  return round2(baseAmount * (taxLine.rate / 100));
}

export function formatInvoiceTaxRate(value: number | null): string {
  if (value === null) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
