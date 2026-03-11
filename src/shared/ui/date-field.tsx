import * as React from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  interactive?: boolean;
  icon?: "calendar" | "today" | "validUntil";
  className?: string;
};

function renderDateFieldIcon(
  _icon: NonNullable<DateFieldProps["icon"]>,
  hasSelectedDate: boolean,
) {
  return (
    <CalendarIcon
      className={cn(
        "h-4 w-4 shrink-0",
        hasSelectedDate ? "text-[#0a0a0a]" : "text-[#b7b7b7]",
      )}
    />
  );
}

function dateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateFieldLabel(iso: string, placeholder: string): string {
  const date = isoToDate(iso);
  if (!date) return placeholder;

  return format(date, "MMMM d, yyyy", { locale: enUS });
}

function DateField({
  value,
  onChange,
  placeholder = "Valid until",
  interactive = true,
  icon = "calendar",
  className,
}: DateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = isoToDate(value);

  return (
    <Popover
      open={interactive ? open : false}
      onOpenChange={(nextOpen) => {
        if (!interactive) return;
        setOpen(nextOpen);
      }}
    >
      <PopoverAnchor asChild>
        <div className="w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (!interactive) return;
              setOpen((current) => !current);
            }}
            aria-expanded={interactive ? open : false}
            aria-haspopup="dialog"
            aria-disabled={!interactive || undefined}
            tabIndex={interactive ? undefined : -1}
            className={cn(
              "h-8 w-full justify-start gap-2 rounded-[8px] border border-transparent bg-transparent px-2 has-[>svg]:px-2 text-left text-[14px] font-normal leading-5 shadow-none",
              "hover:border-[#e4e4e7] hover:bg-white hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
              "focus-visible:border-[#e4e4e7] focus-visible:bg-white focus-visible:ring-0 focus-visible:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
              selectedDate ? "text-[#0a0a0a]" : "text-[#b7b7b7]",
              className,
            )}
          >
            {renderDateFieldIcon(icon, Boolean(selectedDate))}
            {formatDateFieldLabel(value, placeholder)}
          </Button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-auto p-0"
        align="end"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!interactive) return;
            onChange(date ? dateToIso(date) : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DateField, formatDateFieldLabel };
