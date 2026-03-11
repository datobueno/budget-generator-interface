import type { ClientDetails } from "@/entities/client";
import type { QuoteItem } from "@/entities/quote";

export type PdfExportValidationErrors = {
  contactName: boolean;
  companyName: boolean;
  issueDate: boolean;
  logo: boolean;
  emptyConceptDraft: boolean;
  itemDescriptionIds: string[];
  itemQuantityIds: string[];
  itemUnitPriceIds: string[];
};

export type PdfExportValidationResult = {
  isValid: boolean;
  errors: PdfExportValidationErrors;
};

export const EMPTY_PDF_EXPORT_VALIDATION_ERRORS: PdfExportValidationErrors = {
  contactName: false,
  companyName: false,
  issueDate: false,
  logo: false,
  emptyConceptDraft: false,
  itemDescriptionIds: [],
  itemQuantityIds: [],
  itemUnitPriceIds: [],
};

type ValidatePdfExportRequirementsInput = {
  client: Pick<ClientDetails, "contactName" | "companyName">;
  issueDate: string;
  items: QuoteItem[];
  logoDataUrl: string;
};

function hasPositiveNumber(value: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function validatePdfExportRequirements({
  client,
  issueDate,
  items,
  logoDataUrl,
}: ValidatePdfExportRequirementsInput): PdfExportValidationResult {
  const itemDescriptionIds = items
    .filter((item) => item.description.trim().length === 0)
    .map((item) => item.id);
  const itemQuantityIds = items
    .filter((item) => !hasPositiveNumber(item.quantity))
    .map((item) => item.id);
  const itemUnitPriceIds = items
    .filter((item) => !hasPositiveNumber(item.unitPrice))
    .map((item) => item.id);
  const hasCompleteItem = items.some(
    (item) =>
      item.description.trim().length > 0 &&
      hasPositiveNumber(item.quantity) &&
      hasPositiveNumber(item.unitPrice),
  );

  const errors: PdfExportValidationErrors = {
    contactName: client.contactName.trim().length === 0,
    companyName: client.companyName.trim().length === 0,
    issueDate: issueDate.trim().length === 0,
    logo: logoDataUrl.trim().length === 0,
    emptyConceptDraft: !hasCompleteItem && items.length === 0,
    itemDescriptionIds: hasCompleteItem ? [] : itemDescriptionIds,
    itemQuantityIds: hasCompleteItem ? [] : itemQuantityIds,
    itemUnitPriceIds: hasCompleteItem ? [] : itemUnitPriceIds,
  };

  const isValid =
    !errors.contactName &&
    !errors.companyName &&
    !errors.issueDate &&
    !errors.logo &&
    hasCompleteItem;

  return { isValid, errors };
}
