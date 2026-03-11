import { Upload } from "lucide-react";

import type { ComboboxAction } from "@/components/ui/combobox";
import { GoogleSheetsIcon, type LinkedGoogleSpreadsheet } from "@/features/google-sheets";

export function createConceptComboboxActions({
  onRequestQuoteImport,
  onRequestQuoteSpreadsheetImport,
  onRequestLinkedQuoteSpreadsheetImport,
  linkedQuoteSpreadsheet,
  isQuoteImporting = false,
  includeFillQuote = true,
  onRequestConceptCatalogImport,
  onRequestLinkedConceptCatalogSpreadsheetImport,
  linkedConceptCatalogSpreadsheet,
  onRequestConceptCatalogFileUpload,
  isConceptCatalogImporting = false,
}: {
  onRequestQuoteImport?: () => void;
  onRequestQuoteSpreadsheetImport?: () => void;
  onRequestLinkedQuoteSpreadsheetImport?: () => void;
  linkedQuoteSpreadsheet?: LinkedGoogleSpreadsheet | null;
  isQuoteImporting?: boolean;
  includeFillQuote?: boolean;
  onRequestConceptCatalogImport?: () => void;
  onRequestLinkedConceptCatalogSpreadsheetImport?: () => void;
  linkedConceptCatalogSpreadsheet?: LinkedGoogleSpreadsheet | null;
  onRequestConceptCatalogFileUpload?: () => void;
  isConceptCatalogImporting?: boolean;
}): ComboboxAction[] {
  const actions: ComboboxAction[] = [];

  const linkGoodsAndServicesItems: NonNullable<ComboboxAction["items"]> = [];

  if (onRequestConceptCatalogImport) {
    linkGoodsAndServicesItems.push({
      key: "import-concepts",
      label: "Import sheet",
      icon: <GoogleSheetsIcon />,
      iconPosition: "end",
      disabled: isConceptCatalogImporting,
      onSelect: onRequestConceptCatalogImport,
    });
  }

  if (linkedConceptCatalogSpreadsheet && onRequestLinkedConceptCatalogSpreadsheetImport) {
    linkGoodsAndServicesItems.push({
      key: `linked-concepts-${linkedConceptCatalogSpreadsheet.spreadsheetId}`,
      label: linkedConceptCatalogSpreadsheet.name,
      disabled: isConceptCatalogImporting,
      onSelect: onRequestLinkedConceptCatalogSpreadsheetImport,
    });
  }

  if (onRequestConceptCatalogFileUpload) {
    linkGoodsAndServicesItems.push({
      key: "upload-concepts",
      label: "Upload xls or csv",
      icon: <Upload className="h-4 w-4" />,
      iconPosition: "end",
      separatorAbove: linkGoodsAndServicesItems.length > 0,
      disabled: isConceptCatalogImporting,
      onSelect: onRequestConceptCatalogFileUpload,
    });
  }

  if (linkGoodsAndServicesItems.length > 0) {
    actions.push({
      key: "link-goods-services",
      label: "Import goods & services",
      items: linkGoodsAndServicesItems,
    });
  }

  const fillQuoteItems: NonNullable<ComboboxAction["items"]> = [];

  if (includeFillQuote && onRequestQuoteSpreadsheetImport) {
    fillQuoteItems.push({
      key: "import-quote-spreadsheet",
      label: "Import sheet",
      icon: <GoogleSheetsIcon />,
      iconPosition: "end",
      disabled: isQuoteImporting,
      onSelect: onRequestQuoteSpreadsheetImport,
    });
  }

  if (includeFillQuote && linkedQuoteSpreadsheet && onRequestLinkedQuoteSpreadsheetImport) {
    fillQuoteItems.push({
      key: `linked-quote-${linkedQuoteSpreadsheet.spreadsheetId}`,
      label: linkedQuoteSpreadsheet.name,
      disabled: isQuoteImporting,
      onSelect: onRequestLinkedQuoteSpreadsheetImport,
    });
  }

  if (includeFillQuote && onRequestQuoteImport) {
    fillQuoteItems.push({
      key: "upload-quote",
      label: "Upload xls or csv",
      icon: <Upload className="h-4 w-4" />,
      iconPosition: "end",
      separatorAbove: fillQuoteItems.length > 0,
      disabled: isQuoteImporting,
      onSelect: onRequestQuoteImport,
    });
  }

  if (includeFillQuote && fillQuoteItems.length > 0) {
    actions.push({
      key: "fill-quote",
      label: "Fill quote",
      items: fillQuoteItems,
    });
  }

  return actions;
}
