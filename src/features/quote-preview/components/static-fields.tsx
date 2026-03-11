import { formatMoney } from "@/entities/quote";
import { getCurrencySymbol } from "@/entities/currency";
import { cn } from "@/shared/lib/utils";

const budgetNumericFontClass = "[font-family:'Azeret_Mono',monospace]";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getStaticFieldValue(value: string | number | null | undefined, placeholder = ""): string {
  if (typeof value === "number") return String(value);
  const normalized = String(value ?? "").trim();
  return normalized || placeholder;
}

export function BudgetStaticField({
  value,
  placeholder = "",
  className,
  textClassName,
  placeholderClassName = "text-[#b7b7b7]",
}: {
  value: string | number | null | undefined;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  placeholderClassName?: string;
}) {
  const resolvedValue = getStaticFieldValue(value, placeholder);
  const hasValue = String(value ?? "").trim().length > 0;

  return (
    <div className={cn("flex items-center overflow-hidden", className)}>
      <span className={cn("truncate", hasValue ? textClassName : placeholderClassName)}>
        {resolvedValue}
      </span>
    </div>
  );
}

export function BudgetStaticNotesField({
  value,
  maxLength = 250,
}: {
  value: string;
  maxLength?: number;
}) {
  return (
    <div className="flex h-[104px] flex-col overflow-hidden rounded-[8px] border-[1.25px] border-[#e5e5e5] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="min-h-0 flex-1 px-3 pt-3">
        <p className="whitespace-pre-wrap break-words text-[14px] text-[#171717]">
          {value.trim() || " "}
        </p>
      </div>
      <div className="flex h-[38px] items-center px-3 text-[14px] text-[#737373]">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}

function formatBudgetAmountParts(value: number): {
  sign: string;
  integer: string;
  decimal: string;
} {
  const rounded = round2(value);
  const absolute = Math.abs(rounded);
  const [integer, decimal] = absolute.toFixed(2).split(".");

  return {
    sign: rounded < 0 ? "-" : "",
    integer,
    decimal,
  };
}

export function BudgetSubtotalBlock({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  const parts = formatBudgetAmountParts(amount);
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className={cn("space-y-[10px] text-right", className)}>
      <p className="text-[12px] leading-[20px] text-[#52525c]">Subtotal</p>
      <div
        className={cn(
          "flex items-end justify-end gap-[2px] text-[#171717]",
          budgetNumericFontClass,
        )}
      >
        <span className="text-[32px] leading-[20px]">
          {parts.sign}
          {parts.integer}
        </span>
        <span className="text-[24px] leading-[20px]">,{parts.decimal}</span>
        <span className="text-[24px] leading-[20px]">{currencySymbol}</span>
      </div>
      <p className="text-[12px] leading-[20px] italic text-[#52525c]">
        Taxes not included
      </p>
      <span className="sr-only">{formatMoney(amount, currency)}</span>
    </div>
  );
}
