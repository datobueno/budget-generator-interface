import type { Dispatch, SetStateAction } from "react";

import type { CustomerFacingErrorContext } from "@/shared/lib/customer-facing-errors";

export type QuoteEditorNoticeVariant = "info" | "success" | "warning";

export type QuoteEditorNoticeApi = {
  setNotice: Dispatch<SetStateAction<string>>;
  publishSystemNotice: (message: string, variant?: QuoteEditorNoticeVariant) => void;
  publishErrorNotice: (
    error: unknown,
    context: CustomerFacingErrorContext,
  ) => string;
  scheduleNoticeClear: (delayMs: number) => void;
};

export type GoogleSheetsPickerConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};
