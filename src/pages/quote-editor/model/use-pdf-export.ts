import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type RefObject,
} from "react";
import { toast } from "sonner";

import { buildDocumentFileName, type DocumentKind, type QuoteItem } from "@/entities/quote";
import type { ClientDetails } from "@/entities/client";
import {
  EMPTY_PDF_EXPORT_VALIDATION_ERRORS,
  buildPdfCompatibleLogoDataUrl,
  buildPrintableSheetsMarkup,
  buildPrintWindowHtml,
  validatePdfExportRequirements,
} from "@/features/pdf-export";
import { openFilePicker } from "@/shared/lib/files";

import type { QuoteEditorNoticeApi } from "./types";

type UsePdfExportArgs = {
  client: ClientDetails;
  issueDate: string;
  items: QuoteItem[];
  documentKind: DocumentKind;
  quoteNumber: string;
  budgetNumericFontClass: string;
  budgetSheetOrientation: "landscape" | "portrait";
  budgetSheetPreviewWidthPx: number;
  sheetExportTrackRef: RefObject<HTMLDivElement | null>;
  noticeApi: QuoteEditorNoticeApi;
};

export function usePdfExport({
  client,
  issueDate,
  items,
  documentKind,
  quoteNumber,
  budgetNumericFontClass,
  budgetSheetOrientation,
  budgetSheetPreviewWidthPx,
  sheetExportTrackRef,
  noticeApi,
}: UsePdfExportArgs) {
  const [isExporting, setIsExporting] = useState(false);
  const [hasAttemptedPdfExport, setHasAttemptedPdfExport] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [isLogoDragOver, setIsLogoDragOver] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const pdfExportValidation = useMemo(
    () =>
      validatePdfExportRequirements({
        client,
        issueDate,
        items,
        logoDataUrl,
      }),
    [client, issueDate, items, logoDataUrl],
  );

  useEffect(() => {
    if (!hasAttemptedPdfExport || !pdfExportValidation.isValid) return;
    noticeApi.setNotice("");
  }, [hasAttemptedPdfExport, noticeApi, pdfExportValidation.isValid]);

  const visiblePdfExportErrors = hasAttemptedPdfExport
    ? pdfExportValidation.errors
    : EMPTY_PDF_EXPORT_VALIDATION_ERRORS;

  const handleExportPdf = useCallback(async () => {
    if (!pdfExportValidation.isValid) {
      setHasAttemptedPdfExport(true);
      noticeApi.setNotice("");
      toast.warning(
        "Complete contact person, company, sent date, logo, and one good or service before downloading the PDF.",
      );
      return;
    }

    const suggestedFileName = buildDocumentFileName(documentKind, quoteNumber);

    try {
      setHasAttemptedPdfExport(false);
      setIsExporting(true);
      noticeApi.publishSystemNotice("Opening print dialog...");

      const sheetRoot = sheetExportTrackRef.current;
      if (!sheetRoot) {
        throw new Error("Could not find the document sheets.");
      }

      const sheetsMarkup = buildPrintableSheetsMarkup(sheetRoot, {
        budgetNumericFontClass,
      });
      if (!sheetsMarkup.trim()) {
        throw new Error("There are no sheets to print.");
      }

      const printWindow = window.open(
        "",
        "_blank",
        "popup=yes,width=1280,height=1800,resizable=yes,scrollbars=yes",
      );
      if (!printWindow) {
        throw new Error("The print window was blocked by the browser.");
      }

      printWindow.document.title = suggestedFileName;
      printWindow.document.open();
      printWindow.document.write(
        buildPrintWindowHtml(suggestedFileName, sheetsMarkup, {
          orientation: budgetSheetOrientation,
          sheetWidthPx: budgetSheetPreviewWidthPx,
        }),
      );
      printWindow.document.close();
      noticeApi.publishSystemNotice("Print dialog opened.", "success");
    } catch (error) {
      const fallbackError =
        error instanceof Error ? error : new Error("Could not generate the PDF.");
      noticeApi.publishErrorNotice(fallbackError, "pdfExport");
    } finally {
      setIsExporting(false);
      noticeApi.scheduleNoticeClear(2500);
    }
  }, [
    budgetNumericFontClass,
    budgetSheetOrientation,
    budgetSheetPreviewWidthPx,
    documentKind,
    noticeApi,
    pdfExportValidation.isValid,
    quoteNumber,
    sheetExportTrackRef,
  ]);

  const handleOpenLogoUpload = useCallback(() => {
    openFilePicker(logoInputRef.current);
  }, []);

  const handleImportLogo = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        noticeApi.publishErrorNotice(new Error("The logo must be an image."), "logoUpload");
        noticeApi.scheduleNoticeClear(2500);
        return;
      }

      try {
        const dataUrl = await buildPdfCompatibleLogoDataUrl(file);
        setLogoDataUrl(dataUrl);
        setLogoFileName(file.name);
        noticeApi.setNotice("");
        toast.success("Logo uploaded.");
      } catch (error) {
        noticeApi.publishErrorNotice(error, "logoUpload");
      } finally {
        noticeApi.scheduleNoticeClear(2500);
      }
    },
    [noticeApi],
  );

  const handleLogoUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await handleImportLogo(file);
      } finally {
        event.target.value = "";
      }
    },
    [handleImportLogo],
  );

  const handleLogoDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsLogoDragOver(true);
  }, []);

  const handleLogoDragLeave = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsLogoDragOver(false);
    }
  }, []);

  const handleLogoDrop = useCallback(
    async (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsLogoDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      await handleImportLogo(file);
    },
    [handleImportLogo],
  );

  return {
    logoInputRef,
    isExporting,
    logoDataUrl,
    logoFileName,
    isLogoDragOver,
    pdfExportValidation,
    visiblePdfExportErrors,
    handleExportPdf,
    handleOpenLogoUpload,
    handleImportLogo,
    handleLogoUpload,
    handleLogoDragOver,
    handleLogoDragLeave,
    handleLogoDrop,
  };
}
