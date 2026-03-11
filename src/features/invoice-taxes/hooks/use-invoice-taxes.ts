import { useCallback, useEffect, useMemo, useState } from "react";
import { type DocumentKind, type QuoteTotals } from "@/entities/quote";
import {
  createInvoiceTaxLine,
  getInvoiceTaxAmount,
  getInvoiceTaxLabel,
  type InvoiceTaxLine,
  type InvoiceTaxOption,
} from "@/entities/tax";
import { round2 } from "@/shared/lib/numbers";

export function useInvoiceTaxes(documentKind: DocumentKind, totals: QuoteTotals) {
  const [invoiceTaxLines, setInvoiceTaxLines] = useState<InvoiceTaxLine[]>([]);

  const invoiceTaxableBase = useMemo(
    () => round2(totals.subTotal - totals.discountTotal),
    [totals.discountTotal, totals.subTotal],
  );

  const invoiceTaxTotal = useMemo(
    () =>
      round2(
        invoiceTaxLines.reduce(
          (sum, taxLine) => sum + getInvoiceTaxAmount(invoiceTaxableBase, taxLine),
          0,
        ),
      ),
    [invoiceTaxLines, invoiceTaxableBase],
  );

  const visibleTotals = useMemo(() => {
    if (documentKind === "invoice") {
      return {
        ...totals,
        subTotal: invoiceTaxableBase,
        taxTotal: invoiceTaxTotal,
        grandTotal: round2(invoiceTaxableBase + invoiceTaxTotal),
      };
    }

    return {
      ...totals,
      taxTotal: 0,
      grandTotal: round2(totals.subTotal - totals.discountTotal),
    };
  }, [documentKind, invoiceTaxTotal, invoiceTaxableBase, totals]);

  useEffect(() => {
    if (documentKind !== "invoice") return;
    setInvoiceTaxLines((current) => (current.length > 0 ? current : [createInvoiceTaxLine()]));
  }, [documentKind]);

  const handleInvoiceTaxQueryChange = useCallback((taxLineId: string, nextQuery: string) => {
    setInvoiceTaxLines((current) =>
      current.map((taxLine) =>
        taxLine.id === taxLineId ? { ...taxLine, query: nextQuery } : taxLine,
      ),
    );
  }, []);

  const handleInvoiceTaxOptionSelect = useCallback(
    (taxLineId: string, option: InvoiceTaxOption) => {
      setInvoiceTaxLines((current) =>
        current.map((taxLine) =>
          taxLine.id === taxLineId
            ? {
                ...taxLine,
                taxCode: option.code,
                query: option.label,
                rate: taxLine.rate ?? option.defaultRate,
              }
            : taxLine,
        ),
      );
    },
    [],
  );

  const handleInvoiceTaxInputBlur = useCallback((taxLineId: string) => {
    setInvoiceTaxLines((current) =>
      current.map((taxLine) =>
        taxLine.id === taxLineId
          ? { ...taxLine, query: getInvoiceTaxLabel(taxLine.taxCode) }
          : taxLine,
      ),
    );
  }, []);

  const handleInvoiceTaxRateChange = useCallback((taxLineId: string, nextRate: number | null) => {
    setInvoiceTaxLines((current) =>
      current.map((taxLine) =>
        taxLine.id === taxLineId ? { ...taxLine, rate: nextRate } : taxLine,
      ),
    );
  }, []);

  const ensureInvoiceTaxesInitialized = useCallback(() => {
    setInvoiceTaxLines((current) => (current.length > 0 ? current : [createInvoiceTaxLine()]));
  }, []);

  return {
    invoiceTaxLines,
    setInvoiceTaxLines,
    invoiceTaxableBase,
    invoiceTaxTotal,
    visibleTotals,
    handleInvoiceTaxQueryChange,
    handleInvoiceTaxOptionSelect,
    handleInvoiceTaxInputBlur,
    handleInvoiceTaxRateChange,
    ensureInvoiceTaxesInitialized,
  };
}
