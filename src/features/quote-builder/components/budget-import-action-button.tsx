import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import type { ComboboxAction } from "@/components/ui/combobox";

type BudgetImportActionButtonProps = {
  actions: ComboboxAction[];
  disabled?: boolean;
  className?: string;
};

export function BudgetImportActionButton({
  actions,
  disabled = false,
  className,
}: BudgetImportActionButtonProps) {
  const [open, setOpen] = useState(false);
  const hasActions = actions.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || !hasActions}
          aria-label="Import goods, services or spreadsheet"
          title="Import goods, services or spreadsheet"
          data-budget-print-hide="true"
          className={cn("h-11 w-11 shadow-none", className)}
        >
          <Plus className="h-6 w-6 text-[#0a0a0a]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[260px] p-2">
        <div className="space-y-2">
          {actions.map((action) => {
            const subActions = action.items ?? [];

            if (subActions.length === 0 && action.onSelect) {
              return (
                <button
                  key={String(action.key)}
                  type="button"
                  disabled={action.disabled}
                  onClick={() => {
                    action.onSelect?.();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-[#171717] hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                </button>
              );
            }

            return (
              <div key={String(action.key)} className="space-y-1">
                <p className="px-2 pt-1 text-[12px] font-medium text-[#737373]">{action.label}</p>
                <div className="space-y-1">
                  {subActions.map((subAction) => (
                    <button
                      key={String(subAction.key)}
                      type="button"
                      disabled={subAction.disabled}
                      onClick={() => {
                        subAction.onSelect();
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-[#171717] hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
                        subAction.separatorAbove && "mt-2 border-t pt-3",
                      )}
                    >
                      {subAction.iconPosition !== "end" && subAction.icon ? (
                        <span className="flex h-4 w-4 items-center justify-center">{subAction.icon}</span>
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">{subAction.label}</span>
                      {subAction.iconPosition === "end" && subAction.icon ? (
                        <span className="ml-auto flex h-4 w-4 items-center justify-center">
                          {subAction.icon}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
