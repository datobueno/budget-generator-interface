import * as React from "react";

import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

type ComboboxAction = {
  key: React.Key;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
};

type ComboboxProps<T> = {
  value: string;
  options: T[];
  placeholder?: string;
  emptyText?: string;
  emptyContent?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  contentClassName?: string;
  endAdornment?: React.ReactNode;
  getOptionLabel: (option: T) => string;
  getOptionKey?: (option: T, index: number) => React.Key;
  onValueChange: (nextValue: string) => void;
  onOptionSelect: (option: T) => void;
  renderOption?: (option: T, highlighted: boolean) => React.ReactNode;
  actions?: ComboboxAction[];
};

function Combobox<T>({
  value,
  options,
  placeholder,
  emptyText = "No matches.",
  emptyContent,
  disabled = false,
  className,
  inputClassName,
  contentClassName,
  endAdornment,
  getOptionLabel,
  getOptionKey,
  onValueChange,
  onOptionSelect,
  renderOption,
  actions = [],
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const shouldShow = open && !disabled;

  React.useEffect(() => {
    setHighlightedIndex((current) => Math.min(current, Math.max(options.length - 1, 0)));
  }, [options.length]);

  const handleSelect = (option: T) => {
    onOptionSelect(option);
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleAction = (action: ComboboxAction) => {
    action.onSelect();
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleBlur = () => {
    window.setTimeout(() => setOpen(false), 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && shouldShow) {
      const selectedOption = options[highlightedIndex];
      if (!selectedOption) return;
      event.preventDefault();
      handleSelect(selectedOption);
    }
  };

  return (
    <Popover
      open={shouldShow}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div className={cn("w-full", className)}>
          <InputGroup
            className={cn(
              "h-10 rounded-[8px] border-[1.25px] border-transparent bg-transparent shadow-none transition-[border-color,box-shadow]",
              "hover:border-[#e5e5e5] hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
              "has-[[data-slot=input-group-control]:focus-visible]:border-[#e5e5e5] has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]:focus-visible]:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
            )}
          >
            <InputGroupInput
              value={value}
              spellCheck={false}
              onChange={(event) => {
                onValueChange(event.target.value);
                setOpen(true);
                setHighlightedIndex(0);
              }}
              onFocus={() => {
                setOpen(true);
                setHighlightedIndex(0);
              }}
              onClick={() => {
                setOpen(true);
                setHighlightedIndex(0);
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className={cn(
                "h-10 rounded-[8px] border-0 px-2 text-[14px] font-normal text-[#171717] shadow-none placeholder:text-[#171717] focus:text-[#737373] focus-visible:ring-0",
                inputClassName,
              )}
              placeholder={placeholder}
            />
            {endAdornment ? <InputGroupAddon align="inline-end">{endAdornment}</InputGroupAddon> : null}
          </InputGroup>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className={cn("p-1", contentClassName)}
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {options.length === 0 ? (
          emptyContent ?? <p className="px-2 py-2 text-xs text-zinc-500">{emptyText}</p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={getOptionKey ? getOptionKey(option, index) : `${getOptionLabel(option)}-${index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                className={cn(
                  "w-full rounded-sm px-2 py-2 text-left",
                  index === highlightedIndex ? "bg-zinc-100" : "hover:bg-zinc-50",
                )}
              >
                {renderOption ? renderOption(option, index === highlightedIndex) : getOptionLabel(option)}
              </button>
            ))}
          </div>
        )}
        {actions.length > 0 ? (
          <div className={cn("mt-1 space-y-1", options.length > 0 && "border-t border-zinc-200 pt-1")}>
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleAction(action)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              >
                {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export { Combobox };
