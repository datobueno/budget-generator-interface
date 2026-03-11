export type DocumentKind = "budget" | "invoice";

export type QuoteItem = {
  id: string;
  category: string;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  discountPct: number;
  taxPct: number;
};

export type QuoteTotals = {
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
};
