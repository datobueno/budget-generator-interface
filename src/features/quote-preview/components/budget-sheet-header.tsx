import type {
  ChangeEventHandler,
  DragEventHandler,
  KeyboardEventHandler,
  Ref,
} from "react";

import { ImagePlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField, formatDateFieldLabel } from "@/shared/ui/date-field";
import { cn } from "@/shared/lib/utils";
import type { DocumentKind } from "@/entities/quote";

const lineFieldClass =
  "h-8 rounded-none border-0 border-b border-zinc-300 bg-transparent px-1 py-0 text-sm font-normal shadow-none focus-visible:border-zinc-700 focus-visible:ring-0";
const budgetMetaFieldClass =
  "h-9 rounded-md border border-transparent bg-transparent px-2 py-1 text-[14px] font-normal leading-5 text-[#0a0a0a] shadow-none transition-[color,box-shadow,border-color,background-color] hover:border-input hover:bg-white hover:shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";
const exportFieldErrorClass =
  "border-[#dc2626] bg-[#fef2f2] hover:border-[#dc2626] hover:bg-[#fef2f2] focus-visible:border-[#dc2626] focus-visible:bg-[#fef2f2]";

type BudgetSheetHeaderProps = {
  isBudgetDocument: boolean;
  isBudgetSheetInteractive: boolean;
  documentKind: DocumentKind;
  documentTitle: string;
  quoteNumber: string;
  issueDate: string;
  validUntil: string;
  itemsCount: number;
  logoDataUrl: string;
  logoFileName: string;
  isLogoDragOver: boolean;
  isLogoInvalid: boolean;
  isIssueDateInvalid: boolean;
  headerMetaWidthPx: number;
  headerRef?: Ref<HTMLElement>;
  logoInputRef: Ref<HTMLInputElement>;
  onLogoUpload: ChangeEventHandler<HTMLInputElement>;
  onOpenLogoUpload: () => void;
  onLogoDragOver: DragEventHandler<HTMLDivElement>;
  onLogoDragLeave: DragEventHandler<HTMLDivElement>;
  onLogoDrop: DragEventHandler<HTMLDivElement>;
  onQuoteNumberChange: (nextValue: string) => void;
  onIssueDateChange: (nextValue: string) => void;
  onValidUntilChange: (nextValue: string) => void;
};

export function BudgetSheetHeader({
  isBudgetDocument,
  isBudgetSheetInteractive,
  documentKind,
  documentTitle,
  quoteNumber,
  issueDate,
  validUntil,
  itemsCount,
  logoDataUrl,
  logoFileName,
  isLogoDragOver,
  isLogoInvalid,
  isIssueDateInvalid,
  headerMetaWidthPx,
  headerRef,
  logoInputRef,
  onLogoUpload,
  onOpenLogoUpload,
  onLogoDragOver,
  onLogoDragLeave,
  onLogoDrop,
  onQuoteNumberChange,
  onIssueDateChange,
  onValidUntilChange,
}: BudgetSheetHeaderProps) {
  const handleLogoKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpenLogoUpload();
  };

  return (
    <>
      <Input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onLogoUpload}
      />
      <header
        ref={headerRef}
        className={cn(
          "min-w-0",
          isBudgetDocument ? "items-start pb-0" : "border-b border-zinc-200 pb-6",
        )}
      >
        <div
          data-budget-print-header={isBudgetDocument ? "true" : undefined}
          className="grid min-w-0 gap-0"
          style={
            isBudgetDocument
              ? {
                  gridTemplateColumns: `minmax(0, 1fr) ${headerMetaWidthPx}px`,
                }
              : undefined
          }
        >
          <div className={cn("min-w-0", isBudgetDocument && "pl-2")}>
            {!isBudgetDocument ? <h1 className="text-sm font-semibold text-zinc-900">{documentTitle}</h1> : null}
            <div className={cn(!isBudgetDocument && "pt-1")}>
              <div
                data-budget-print-logo={isBudgetDocument ? "true" : undefined}
                role={isBudgetDocument && !isBudgetSheetInteractive ? undefined : "button"}
                tabIndex={isBudgetDocument && !isBudgetSheetInteractive ? -1 : 0}
                onClick={isBudgetDocument && !isBudgetSheetInteractive ? undefined : onOpenLogoUpload}
                onKeyDown={
                  isBudgetDocument && !isBudgetSheetInteractive ? undefined : handleLogoKeyDown
                }
                onDragOver={
                  isBudgetDocument && !isBudgetSheetInteractive ? undefined : onLogoDragOver
                }
                onDragLeave={
                  isBudgetDocument && !isBudgetSheetInteractive ? undefined : onLogoDragLeave
                }
                onDrop={isBudgetDocument && !isBudgetSheetInteractive ? undefined : onLogoDrop}
                className={cn(
                  "focus-visible:outline-none",
                  isBudgetDocument
                    ? logoDataUrl
                      ? "inline-flex h-[128px] w-[128px] items-center justify-center rounded-[6px] border border-transparent bg-transparent text-[#cecece] shadow-none transition-[color,box-shadow,border-color,background-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      : "flex h-[128px] w-[128px] items-center justify-center rounded-[6px] border border-dashed border-[#dccbcb] bg-transparent text-[#cecece] shadow-none transition-[color,box-shadow,border-color,background-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    : "flex min-h-[96px] w-full max-w-[240px] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 text-center focus-visible:ring-2 focus-visible:ring-zinc-800 focus-visible:ring-offset-2",
                  ((!isBudgetDocument || isBudgetSheetInteractive) && "cursor-pointer") || undefined,
                  isBudgetDocument &&
                    isBudgetSheetInteractive &&
                    "hover:border-input hover:bg-white hover:shadow-xs",
                  isLogoInvalid &&
                    "border-[#dc2626] bg-[#fef2f2] text-[#a1a1aa] hover:border-[#dc2626] hover:bg-[#fef2f2] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20",
                  !isBudgetDocument &&
                    (isLogoDragOver
                      ? "border-zinc-900 bg-zinc-100"
                      : "border-zinc-300 bg-zinc-50/70"),
                )}
              >
                {logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Logo"
                    className={cn(
                      "w-auto object-contain",
                      isBudgetDocument ? "block h-auto max-h-[128px] max-w-[128px]" : "h-10 max-w-[180px]",
                    )}
                  />
                ) : isBudgetDocument ? (
                  <span className="text-[24px] font-bold leading-[36px] tracking-tight text-[#cecece]">
                    Logo
                  </span>
                ) : (
                  <ImagePlus className="h-5 w-5 text-zinc-500" />
                )}
                {!isBudgetDocument ? (
                  <span className="text-xs font-medium text-zinc-700">
                    {logoDataUrl
                      ? "Drag or click to change the logo"
                      : "Drag or click to upload the logo"}
                  </span>
                ) : null}
                {!isBudgetDocument && logoFileName ? (
                  <span className="max-w-[190px] truncate text-[11px] text-zinc-500">
                    {logoFileName}
                  </span>
                ) : null}
              </div>
            </div>
            {!isBudgetDocument ? <div aria-hidden className="min-h-[72px]" /> : null}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div
              data-budget-print-quote-number-panel={isBudgetDocument ? "true" : undefined}
              data-budget-print-quote-number={isBudgetDocument ? quoteNumber : undefined}
              className="min-w-0"
            >
              {isBudgetDocument ? (
                <Input
                  value={quoteNumber}
                  onChange={(event) => onQuoteNumberChange(event.target.value)}
                  readOnly={!isBudgetSheetInteractive}
                  tabIndex={isBudgetSheetInteractive ? undefined : -1}
                  placeholder="####_quote_####"
                  className={cn(budgetMetaFieldClass, "w-full px-2")}
                />
              ) : documentKind === "invoice" ? (
                <div className="grid grid-cols-[88px_1fr] items-center gap-2">
                  <Label className="text-zinc-600">Number</Label>
                  <Input
                    value={quoteNumber}
                    onChange={(event) => onQuoteNumberChange(event.target.value)}
                    className={lineFieldClass}
                  />
                </div>
              ) : null}
            </div>

            <div
              data-budget-print-dates-panel={isBudgetDocument ? "true" : undefined}
              data-budget-print-issue-date={
                isBudgetDocument && issueDate ? formatDateFieldLabel(issueDate, "") : undefined
              }
              data-budget-print-valid-until={
                isBudgetDocument && validUntil ? formatDateFieldLabel(validUntil, "") : undefined
              }
              className={cn(
                "flex min-w-0 flex-col gap-1 text-sm",
                isBudgetDocument && "text-right",
              )}
            >
              {isBudgetDocument ? (
                <>
                  <div className="w-full">
                    <DateField
                      value={issueDate}
                      onChange={onIssueDateChange}
                      placeholder={itemsCount === 0 ? "Sent on ..." : "Sent on"}
                      interactive={isBudgetSheetInteractive}
                      icon="today"
                      className={isIssueDateInvalid ? exportFieldErrorClass : undefined}
                    />
                  </div>
                  <div className="w-full">
                    <DateField
                      value={validUntil}
                      onChange={onValidUntilChange}
                      placeholder={itemsCount === 0 ? "Valid until ..." : "Valid until"}
                      interactive={isBudgetSheetInteractive}
                      icon="validUntil"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-[88px_1fr] items-center gap-2">
                    <Label className="text-zinc-600">Date</Label>
                    <DateField value={issueDate} onChange={onIssueDateChange} />
                  </div>
                  <div className="grid grid-cols-[88px_1fr] items-center gap-2">
                    <Label className="text-zinc-600">Valid until</Label>
                    <DateField value={validUntil} onChange={onValidUntilChange} icon="validUntil" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
