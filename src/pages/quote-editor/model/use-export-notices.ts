import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  type CustomerFacingErrorContext,
  showCustomerFacingErrorToast,
} from "@/shared/lib/customer-facing-errors";

import type { QuoteEditorNoticeApi, QuoteEditorNoticeVariant } from "./types";

export function useExportNotices(isBudgetDocument: boolean): {
  exportNotice: string;
  noticeApi: QuoteEditorNoticeApi;
} {
  const [exportNotice, setExportNotice] = useState("");

  const publishSystemNotice = useCallback(
    (message: string, variant: QuoteEditorNoticeVariant = "info") => {
      if (!message) {
        setExportNotice("");
        return;
      }

      if (isBudgetDocument) {
        setExportNotice("");
        if (variant === "success") {
          toast.success(message);
          return;
        }
        if (variant === "warning") {
          toast.warning(message);
          return;
        }
        toast.info(message);
        return;
      }

      setExportNotice(message);
    },
    [isBudgetDocument],
  );

  const publishErrorNotice = useCallback(
    (error: unknown, context: CustomerFacingErrorContext) => {
      const message = showCustomerFacingErrorToast(error, context);
      if (isBudgetDocument) {
        setExportNotice("");
        return message;
      }

      setExportNotice(message);
      return message;
    },
    [isBudgetDocument],
  );

  const scheduleNoticeClear = useCallback(
    (delayMs: number) => {
      if (isBudgetDocument) return;
      window.setTimeout(() => setExportNotice(""), delayMs);
    },
    [isBudgetDocument],
  );

  return {
    exportNotice,
    noticeApi: {
      setNotice: setExportNotice,
      publishSystemNotice,
      publishErrorNotice,
      scheduleNoticeClear,
    },
  };
}
