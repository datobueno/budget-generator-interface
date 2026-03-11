import { type DocumentKind } from "@/entities/quote/types";

export function buildDocumentFileName(kind: DocumentKind, quoteNumber: string): string {
  const baseName = kind === "invoice" ? "invoice" : "quote";
  if (kind === "budget") return `${baseName}.pdf`;

  const slug = quoteNumber
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName}-${slug || "untitled"}.pdf`;
}
