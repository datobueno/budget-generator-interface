import type { CSSProperties } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import type { InvoiceTaxOption, InvoiceTaxLine } from "@/entities/tax";
import { InvoiceSummaryBlock } from "@/features/invoice-taxes";
import { cn } from "@/shared/lib/utils";

import { BudgetStaticNotesField, BudgetSubtotalBlock } from "./static-fields";

type BudgetSummarySectionProps = {
  isBudgetDocument: boolean;
  usesQuoteSheetLayout: boolean;
  isInteractive: boolean;
  shouldRenderBudgetSummarySpacer: boolean;
  isInvoiceDocument: boolean;
  notes: string;
  onNotesChange: (nextValue: string) => void;
  currency: string;
  subtotal: number;
  total: number;
  invoiceTaxLines: InvoiceTaxLine[];
  conceptRowFieldClass: string;
  budgetNumericFontClass: string;
  onTaxQueryChange: (taxLineId: string, nextQuery: string) => void;
  onTaxOptionSelect: (taxLineId: string, option: InvoiceTaxOption) => void;
  onTaxInputBlur: (taxLineId: string) => void;
  onTaxRateChange: (taxLineId: string, nextRate: number | null) => void;
  summaryContainerStyle?: CSSProperties;
  summaryGridStyle?: CSSProperties;
  summaryNotesWidthPx?: number;
  summaryTotalsWidthPx?: number;
  contentClassName?: string;
  footerClassName?: string;
  showFooter?: boolean;
  exportNotice?: string;
};

export function BudgetSummarySection({
  isBudgetDocument,
  usesQuoteSheetLayout,
  isInteractive,
  shouldRenderBudgetSummarySpacer,
  isInvoiceDocument,
  notes,
  onNotesChange,
  currency,
  subtotal,
  total,
  invoiceTaxLines,
  conceptRowFieldClass,
  budgetNumericFontClass,
  onTaxQueryChange,
  onTaxOptionSelect,
  onTaxInputBlur,
  onTaxRateChange,
  summaryContainerStyle,
  summaryGridStyle,
  summaryNotesWidthPx,
  summaryTotalsWidthPx,
  contentClassName,
  footerClassName,
  showFooter = false,
  exportNotice = "",
}: BudgetSummarySectionProps) {
  return (
    <div className="space-y-4">
      <div className={contentClassName}>
        <div
          data-budget-print-summary={isBudgetDocument ? "true" : undefined}
          className={cn("min-w-0", isBudgetDocument && "grid items-end")}
          style={isBudgetDocument ? summaryContainerStyle : undefined}
        >
          <div
            className={cn(isBudgetDocument && "grid items-end")}
            style={isBudgetDocument ? summaryGridStyle : undefined}
          >
            <div
              id="summary-notes"
              className={cn(isBudgetDocument && "shrink-0")}
              style={
                isBudgetDocument && typeof summaryNotesWidthPx === "number"
                  ? { width: `${summaryNotesWidthPx}px` }
                  : undefined
              }
            >
              <div
                className="min-w-0 space-y-2"
                data-budget-print-notes-column={isBudgetDocument ? "true" : undefined}
              >
                <h2
                  className={cn(
                    "text-sm font-medium text-zinc-800",
                    isBudgetDocument && "text-[14px] text-[#27272a]",
                  )}
                >
                  Notes
                </h2>
                <div
                  data-budget-print-notes-field={isBudgetDocument ? "true" : undefined}
                  data-budget-print-notes={isBudgetDocument ? notes : undefined}
                >
                  {isInteractive ? (
                    <InputGroup
                      className={cn(
                        isBudgetDocument &&
                          "h-[104px] rounded-[8px] border-[1.25px] border-[#e5e5e5] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
                      )}
                    >
                      <InputGroupTextarea
                        rows={4}
                        maxLength={250}
                        value={notes}
                        onChange={(event) => onNotesChange(event.target.value)}
                        className={cn(
                          isBudgetDocument && "px-3 py-3 text-[14px] text-[#171717]",
                        )}
                      />
                      <InputGroupAddon
                        align="block-end"
                        className={cn(isBudgetDocument && "border-0 px-3 pb-3 pt-0")}
                      >
                        <InputGroupText
                          className={cn(isBudgetDocument && "text-[14px] text-[#737373]")}
                        >
                          {notes.length}/250
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  ) : (
                    <BudgetStaticNotesField value={notes} />
                  )}
                </div>
              </div>
            </div>
            {shouldRenderBudgetSummarySpacer && isBudgetDocument ? <div aria-hidden /> : null}
            <div
              id="summary-totals"
              className="min-w-0"
              style={
                isBudgetDocument && typeof summaryTotalsWidthPx === "number"
                  ? { width: `${summaryTotalsWidthPx}px` }
                  : undefined
              }
            >
              <div className="min-w-0">
                {!isInvoiceDocument ? (
                  <div data-budget-print-subtotal={usesQuoteSheetLayout ? "true" : undefined}>
                    <BudgetSubtotalBlock
                      amount={subtotal}
                      currency={currency}
                      className="self-end"
                    />
                  </div>
                ) : (
                  <InvoiceSummaryBlock
                    subtotal={subtotal}
                    total={total}
                    currency={currency}
                    taxLines={invoiceTaxLines}
                    interactive={isInteractive}
                    conceptRowFieldClass={conceptRowFieldClass}
                    budgetNumericFontClass={budgetNumericFontClass}
                    onTaxQueryChange={onTaxQueryChange}
                    onTaxOptionSelect={onTaxOptionSelect}
                    onTaxInputBlur={onTaxInputBlur}
                    onTaxRateChange={onTaxRateChange}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFooter ? (
        <footer className={footerClassName}>
          <p className="text-sm text-zinc-500">{exportNotice || " "}</p>
        </footer>
      ) : null}
    </div>
  );
}
