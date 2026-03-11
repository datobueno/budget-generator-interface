import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/entities/quote";
import {
  INVOICE_TAX_OPTIONS,
  formatInvoiceTaxRate,
  getInvoiceTaxAmount,
  getInvoiceTaxOption,
  type InvoiceTaxLine,
  type InvoiceTaxOption,
} from "@/entities/tax";
import { cn } from "@/shared/lib/utils";

type InvoiceSummaryBlockProps = {
  subtotal: number;
  total: number;
  currency: string;
  taxLines: InvoiceTaxLine[];
  interactive?: boolean;
  className?: string;
  conceptRowFieldClass: string;
  budgetNumericFontClass: string;
  onTaxQueryChange?: (taxLineId: string, nextQuery: string) => void;
  onTaxOptionSelect?: (taxLineId: string, option: InvoiceTaxOption) => void;
  onTaxInputBlur?: (taxLineId: string) => void;
  onTaxRateChange?: (taxLineId: string, nextRate: number | null) => void;
};

function parseEditableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
}

export function InvoiceSummaryBlock({
  subtotal,
  total,
  currency,
  taxLines,
  interactive = false,
  className,
  conceptRowFieldClass,
  budgetNumericFontClass,
  onTaxQueryChange,
  onTaxOptionSelect,
  onTaxInputBlur,
  onTaxRateChange,
}: InvoiceSummaryBlockProps) {
  return (
    <div className={cn("space-y-2 border border-zinc-200 p-4 text-sm", className)}>
      <div className="flex items-center justify-between">
        <span className="text-zinc-600">Subtotal</span>
        <span className={cn("tabular-nums", budgetNumericFontClass)}>
          {formatMoney(subtotal, currency)}
        </span>
      </div>

      {taxLines.map((taxLine) => {
        const selectedOption = getInvoiceTaxOption(taxLine.taxCode);
        const taxAmount = getInvoiceTaxAmount(subtotal, taxLine);
        const taxRateLabel = formatInvoiceTaxRate(taxLine.rate);
        const displayLabel = (selectedOption?.label ?? taxLine.query.trim()) || "Tax";

        if (!interactive) {
          return (
            <div
              key={taxLine.id}
              className="flex items-center justify-between gap-3"
              data-budget-print-invoice-tax-row="true"
              data-budget-print-tax-label={displayLabel}
              data-budget-print-tax-rate={taxRateLabel}
              data-budget-print-tax-amount={formatMoney(taxAmount, currency)}
            >
              <span className="text-zinc-600">
                {taxRateLabel ? `${displayLabel} ${taxRateLabel}%` : displayLabel}
              </span>
              <span className={cn("tabular-nums", budgetNumericFontClass)}>
                {formatMoney(taxAmount, currency)}
              </span>
            </div>
          );
        }

        return (
          <div
            key={taxLine.id}
            className="grid grid-cols-[minmax(0,1fr)_72px_auto] items-center gap-2"
            data-budget-print-invoice-tax-row="true"
            data-budget-print-tax-label={displayLabel}
            data-budget-print-tax-rate={taxRateLabel}
            data-budget-print-tax-amount={formatMoney(taxAmount, currency)}
          >
            <Combobox
              value={taxLine.query}
              options={[...INVOICE_TAX_OPTIONS]}
              placeholder="Tax"
              className="w-full"
              inputClassName={cn(conceptRowFieldClass, "w-full")}
              contentClassName="!w-[220px] !min-w-[220px] !max-w-[220px]"
              getOptionLabel={(option) => option.label}
              onValueChange={(nextValue) => onTaxQueryChange?.(taxLine.id, nextValue)}
              onOptionSelect={(option) => onTaxOptionSelect?.(taxLine.id, option)}
              onInputBlur={() => onTaxInputBlur?.(taxLine.id)}
              openOnFocus
              openOnEnterWhenClosed
              renderOption={(option) => (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] leading-5 text-[#171717]">{option.label}</span>
                  <span className="text-[12px] leading-4 text-[#737373]">{option.region}</span>
                </div>
              )}
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={taxRateLabel}
              onChange={(event) =>
                onTaxRateChange?.(taxLine.id, parseEditableNumber(event.target.value))
              }
              className={cn(
                conceptRowFieldClass,
                "w-[72px] pl-2 pr-1 text-left tabular-nums",
                budgetNumericFontClass,
              )}
            />
            <span className={cn("min-w-[92px] text-right tabular-nums", budgetNumericFontClass)}>
              {formatMoney(taxAmount, currency)}
            </span>
          </div>
        );
      })}

      <div className="mt-2 flex items-center justify-between border-t border-zinc-300 pt-2 text-lg font-semibold">
        <span>Total</span>
        <span className={cn("tabular-nums", budgetNumericFontClass)}>
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}
