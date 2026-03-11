import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { BudgetSheetOrientation } from "../model/types";

const budgetToolbarButtonClass =
  "relative grid size-10 place-items-center rounded-[8px] border-0 bg-[#e5e5e5] p-0 text-[#0a0a0a] shadow-none hover:bg-[#d4d4d8] focus-visible:ring-0";

type ToolbarButtonIconProps = {
  className?: string;
};

function BudgetHorizontalIcon({ className }: ToolbarButtonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "absolute left-1/2 top-1/2 block size-6 shrink-0 -translate-x-1/2 -translate-y-1/2",
        className,
      )}
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="1.75" />
    </svg>
  );
}

function BudgetVerticalIcon({ className }: ToolbarButtonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "absolute left-1/2 top-1/2 block size-6 shrink-0 -translate-x-1/2 -translate-y-1/2",
        className,
      )}
      aria-hidden="true"
    >
      <rect x="6" y="3" width="12" height="18" rx="1.75" />
    </svg>
  );
}

function BudgetDownloadIcon({ className }: ToolbarButtonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "absolute left-1/2 top-1/2 block size-6 shrink-0 -translate-x-1/2 -translate-y-1/2",
        className,
      )}
      aria-hidden="true"
    >
      <path d="M12 4v9" />
      <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
      <path d="M5 20h14" />
    </svg>
  );
}

type BudgetOrientationToggleButtonProps = {
  onClick: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  orientation: BudgetSheetOrientation;
  label: string;
  isHoverPreviewActive: boolean;
  isHoverPreviewLocked: boolean;
};

export function BudgetOrientationToggleButton({
  onClick,
  onPointerEnter,
  onPointerLeave,
  orientation,
  label,
  isHoverPreviewActive,
  isHoverPreviewLocked,
}: BudgetOrientationToggleButtonProps) {
  const isLandscape = orientation === "landscape";
  const previewRotationClass = isHoverPreviewActive
    ? isLandscape
      ? "rotate-90"
      : "-rotate-90"
    : "rotate-0";
  const previewTransitionClass = isHoverPreviewLocked
    ? "transition-none"
    : "transition-transform duration-200 ease-in-out";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={budgetToolbarButtonClass}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <span
        className={cn(
          "relative block size-6 shrink-0",
          previewTransitionClass,
          previewRotationClass,
        )}
      >
        {isLandscape ? <BudgetHorizontalIcon /> : <BudgetVerticalIcon />}
      </span>
    </Button>
  );
}

type BudgetDownloadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label: string;
};

export function BudgetDownloadButton({
  onClick,
  disabled = false,
  label,
}: BudgetDownloadButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={budgetToolbarButtonClass}
    >
      <span className="relative block size-6 shrink-0">
        <BudgetDownloadIcon />
      </span>
    </Button>
  );
}
