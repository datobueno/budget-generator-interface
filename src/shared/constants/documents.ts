import type { DocumentKind } from "@/entities/quote";

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  budget: "Quote",
  invoice: "Invoice",
};
