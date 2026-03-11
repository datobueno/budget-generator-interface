import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { toast } from "sonner";

import {
  buildConceptCatalogFromItems,
  mergeConceptCatalogEntries,
  type ConceptCatalogEntry,
} from "@/entities/concept";
import type { QuoteItem } from "@/entities/quote";
import type { LinkedGoogleSpreadsheet } from "@/features/google-sheets";
import {
  pickGoogleSpreadsheet,
  readGoogleSpreadsheetRows,
} from "@/features/google-sheets";
import { type ConceptPageFocusBehavior } from "@/features/quote-preview";
import {
  createConceptComboboxActions,
} from "@/features/quote-builder";
import {
  buildConceptCatalogFromSheetRows,
  buildItemsFromSheetRows,
  readSheetRows,
} from "@/features/spreadsheet-import";
import { openFilePicker } from "@/shared/lib/files";

import type { GoogleSheetsPickerConfig, QuoteEditorNoticeApi } from "./types";

type UseImportActionsArgs = {
  setItems: Dispatch<SetStateAction<QuoteItem[]>>;
  setConceptCatalog: Dispatch<SetStateAction<ConceptCatalogEntry[]>>;
  setActiveBudgetSheetIndex: Dispatch<SetStateAction<number>>;
  setIsBudgetSheetTransitioning: Dispatch<SetStateAction<boolean>>;
  pendingManualConceptPageFocusRef: MutableRefObject<ConceptPageFocusBehavior | null>;
  noticeApi: QuoteEditorNoticeApi;
  getGoogleSheetsPickerConfig: () => GoogleSheetsPickerConfig | null;
  requestGoogleSheetsToken: () => Promise<string>;
};

export function useImportActions({
  setItems,
  setConceptCatalog,
  setActiveBudgetSheetIndex,
  setIsBudgetSheetTransitioning,
  pendingManualConceptPageFocusRef,
  noticeApi,
  getGoogleSheetsPickerConfig,
  requestGoogleSheetsToken,
}: UseImportActionsArgs) {
  const [isConceptCatalogImporting, setIsConceptCatalogImporting] = useState(false);
  const [isQuoteImporting, setIsQuoteImporting] = useState(false);
  const [linkedConceptCatalogSpreadsheet, setLinkedConceptCatalogSpreadsheet] =
    useState<LinkedGoogleSpreadsheet | null>(null);
  const [linkedQuoteSpreadsheet, setLinkedQuoteSpreadsheet] =
    useState<LinkedGoogleSpreadsheet | null>(null);
  const [isSpreadsheetDragOver, setIsSpreadsheetDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const conceptCatalogFileInputRef = useRef<HTMLInputElement | null>(null);

  const applyImportedQuoteRows = useCallback(
    async (rows: unknown[][], sourceLabel?: string) => {
      try {
        noticeApi.publishSystemNotice("Importing quote...");
        const importedItems = buildItemsFromSheetRows(rows);
        const importedCatalogEntries = buildConceptCatalogFromItems(importedItems);
        pendingManualConceptPageFocusRef.current = null;
        setItems(importedItems);
        setConceptCatalog((current) =>
          mergeConceptCatalogEntries(current, importedCatalogEntries),
        );
        setActiveBudgetSheetIndex(0);
        setIsBudgetSheetTransitioning(false);
        const sourceSuffix = sourceLabel ? ` from ${sourceLabel}` : "";
        noticeApi.publishSystemNotice(
          `${importedItems.length} items imported${sourceSuffix}.`,
          "success",
        );
      } catch (error) {
        if (error instanceof Error) {
          noticeApi.publishErrorNotice(error, "quoteImport");
        } else {
          noticeApi.publishErrorNotice(new Error("Could not import the file."), "quoteImport");
        }
      } finally {
        noticeApi.scheduleNoticeClear(3500);
      }
    },
    [
      noticeApi,
      pendingManualConceptPageFocusRef,
      setActiveBudgetSheetIndex,
      setConceptCatalog,
      setIsBudgetSheetTransitioning,
      setItems,
    ],
  );

  const handleImportSpreadsheet = useCallback(
    async (file: File) => {
      try {
        setIsQuoteImporting(true);
        noticeApi.publishSystemNotice("Importing file...");
        const rows = await readSheetRows(file);
        await applyImportedQuoteRows(rows, file.name);
      } finally {
        setIsQuoteImporting(false);
      }
    },
    [applyImportedQuoteRows, noticeApi],
  );

  const handleImportConceptCatalogRows = useCallback(
    async (rows: unknown[][], sourceLabel?: string) => {
      try {
        noticeApi.publishSystemNotice("Importing catalog...");
        const importedCatalog = buildConceptCatalogFromSheetRows(rows);
        setConceptCatalog(importedCatalog);
        const sourceSuffix = sourceLabel ? ` from ${sourceLabel}` : "";
        noticeApi.setNotice("");
        toast.success(`${importedCatalog.length} items loaded into the catalog${sourceSuffix}.`);
      } catch (error) {
        if (error instanceof Error) {
          noticeApi.publishErrorNotice(error, "catalogImport");
        } else {
          noticeApi.publishErrorNotice(new Error("Could not import the catalog."), "catalogImport");
        }
      } finally {
        noticeApi.scheduleNoticeClear(3500);
      }
    },
    [noticeApi, setConceptCatalog],
  );

  const handleImportQuoteFromGoogleSpreadsheet = useCallback(
    async (linkedSpreadsheet?: LinkedGoogleSpreadsheet | null) => {
      const config = getGoogleSheetsPickerConfig();
      if (!config) return;

      try {
        setIsQuoteImporting(true);
        const token = await requestGoogleSheetsToken();
        const pickedSpreadsheet =
          linkedSpreadsheet ??
          (await pickGoogleSpreadsheet({
            apiKey: config.apiKey,
            appId: config.appId,
            oauthToken: token,
          }));

        const rows = await readGoogleSpreadsheetRows({
          accessToken: token,
          spreadsheetId: pickedSpreadsheet.spreadsheetId,
        });

        setLinkedQuoteSpreadsheet({
          spreadsheetId: pickedSpreadsheet.spreadsheetId,
          name: pickedSpreadsheet.name || "Google Sheets",
        });
        await applyImportedQuoteRows(rows, pickedSpreadsheet.name || "Google Sheets");
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Selection canceled.") {
            noticeApi.publishSystemNotice("Quote import canceled.", "warning");
          } else {
            noticeApi.publishErrorNotice(error, "googleSheets");
          }
        } else {
          noticeApi.publishErrorNotice(
            new Error("Could not import the quote from Google Sheets."),
            "googleSheets",
          );
        }
        noticeApi.scheduleNoticeClear(3500);
      } finally {
        setIsQuoteImporting(false);
      }
    },
    [applyImportedQuoteRows, getGoogleSheetsPickerConfig, noticeApi, requestGoogleSheetsToken],
  );

  const handleImportConceptCatalogFromGoogleSpreadsheet = useCallback(async () => {
    const config = getGoogleSheetsPickerConfig();
    if (!config) return;

    try {
      setIsConceptCatalogImporting(true);
      const token = await requestGoogleSheetsToken();

      const pickedSpreadsheet = await pickGoogleSpreadsheet({
        apiKey: config.apiKey,
        appId: config.appId,
        oauthToken: token,
      });

      const rows = await readGoogleSpreadsheetRows({
        accessToken: token,
        spreadsheetId: pickedSpreadsheet.spreadsheetId,
      });

      setLinkedConceptCatalogSpreadsheet({
        spreadsheetId: pickedSpreadsheet.spreadsheetId,
        name: pickedSpreadsheet.name || "Google Sheets",
      });
      await handleImportConceptCatalogRows(rows, pickedSpreadsheet.name || "Google Sheets");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Selection canceled.") {
          noticeApi.publishSystemNotice("Catalog import canceled.", "warning");
        } else {
          noticeApi.publishErrorNotice(error, "googleSheets");
        }
      } else {
        noticeApi.publishErrorNotice(
          new Error("Could not import the catalog from Google Sheets."),
          "googleSheets",
        );
      }
      noticeApi.scheduleNoticeClear(3500);
    } finally {
      setIsConceptCatalogImporting(false);
    }
  }, [
    getGoogleSheetsPickerConfig,
    handleImportConceptCatalogRows,
    noticeApi,
    requestGoogleSheetsToken,
  ]);

  const handleReloadLinkedConceptCatalogSpreadsheet = useCallback(async () => {
    if (!linkedConceptCatalogSpreadsheet) return;

    const config = getGoogleSheetsPickerConfig();
    if (!config) return;

    try {
      setIsConceptCatalogImporting(true);
      const token = await requestGoogleSheetsToken();
      const rows = await readGoogleSpreadsheetRows({
        accessToken: token,
        spreadsheetId: linkedConceptCatalogSpreadsheet.spreadsheetId,
      });

      await handleImportConceptCatalogRows(rows, linkedConceptCatalogSpreadsheet.name);
    } catch (error) {
      if (error instanceof Error) {
        noticeApi.publishErrorNotice(error, "googleSheets");
      } else {
        noticeApi.publishErrorNotice(
          new Error("Could not reload the linked catalog spreadsheet."),
          "googleSheets",
        );
      }
      noticeApi.scheduleNoticeClear(3500);
    } finally {
      setIsConceptCatalogImporting(false);
    }
  }, [
    getGoogleSheetsPickerConfig,
    handleImportConceptCatalogRows,
    linkedConceptCatalogSpreadsheet,
    noticeApi,
    requestGoogleSheetsToken,
  ]);

  const handleOpenImport = useCallback(() => {
    openFilePicker(fileInputRef.current);
  }, []);

  const handleOpenConceptCatalogFileUpload = useCallback(() => {
    openFilePicker(conceptCatalogFileInputRef.current);
  }, []);

  const handleImportConceptCatalogFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsConceptCatalogImporting(true);
        const rows = await readSheetRows(file);
        await handleImportConceptCatalogRows(rows, file.name);
      } catch (error) {
        if (error instanceof Error) {
          noticeApi.publishErrorNotice(error, "catalogImport");
        } else {
          noticeApi.publishErrorNotice(new Error("Could not import the catalog."), "catalogImport");
        }
        noticeApi.scheduleNoticeClear(3500);
      } finally {
        setIsConceptCatalogImporting(false);
        event.target.value = "";
      }
    },
    [handleImportConceptCatalogRows, noticeApi],
  );

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await handleImportSpreadsheet(file);
      } finally {
        event.target.value = "";
      }
    },
    [handleImportSpreadsheet],
  );

  const handleRequestConceptCatalogImport = useCallback(() => {
    void handleImportConceptCatalogFromGoogleSpreadsheet();
  }, [handleImportConceptCatalogFromGoogleSpreadsheet]);

  const handleRequestQuoteSpreadsheetImport = useCallback(() => {
    void handleImportQuoteFromGoogleSpreadsheet();
  }, [handleImportQuoteFromGoogleSpreadsheet]);

  const handleRequestLinkedQuoteSpreadsheetImport = useCallback(() => {
    if (!linkedQuoteSpreadsheet) return;
    void handleImportQuoteFromGoogleSpreadsheet(linkedQuoteSpreadsheet);
  }, [handleImportQuoteFromGoogleSpreadsheet, linkedQuoteSpreadsheet]);

  const handleRequestLinkedConceptCatalogSpreadsheetImport = useCallback(() => {
    void handleReloadLinkedConceptCatalogSpreadsheet();
  }, [handleReloadLinkedConceptCatalogSpreadsheet]);

  const handleSpreadsheetDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsSpreadsheetDragOver(true);
  }, []);

  const handleSpreadsheetDragLeave = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsSpreadsheetDragOver(false);
    }
  }, []);

  const handleSpreadsheetDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsSpreadsheetDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      void handleImportSpreadsheet(file);
    },
    [handleImportSpreadsheet],
  );

  const budgetImportActions = useMemo(
    () =>
      createConceptComboboxActions({
        onRequestQuoteImport: handleOpenImport,
        onRequestQuoteSpreadsheetImport: handleRequestQuoteSpreadsheetImport,
        onRequestLinkedQuoteSpreadsheetImport: handleRequestLinkedQuoteSpreadsheetImport,
        linkedQuoteSpreadsheet,
        isQuoteImporting,
        onRequestConceptCatalogImport: handleRequestConceptCatalogImport,
        onRequestLinkedConceptCatalogSpreadsheetImport:
          handleRequestLinkedConceptCatalogSpreadsheetImport,
        linkedConceptCatalogSpreadsheet,
        onRequestConceptCatalogFileUpload: handleOpenConceptCatalogFileUpload,
        isConceptCatalogImporting,
      }),
    [
      handleOpenConceptCatalogFileUpload,
      handleOpenImport,
      handleRequestConceptCatalogImport,
      handleRequestLinkedConceptCatalogSpreadsheetImport,
      handleRequestLinkedQuoteSpreadsheetImport,
      handleRequestQuoteSpreadsheetImport,
      isConceptCatalogImporting,
      isQuoteImporting,
      linkedConceptCatalogSpreadsheet,
      linkedQuoteSpreadsheet,
    ],
  );

  return {
    fileInputRef,
    conceptCatalogFileInputRef,
    isConceptCatalogImporting,
    isQuoteImporting,
    linkedConceptCatalogSpreadsheet,
    linkedQuoteSpreadsheet,
    isSpreadsheetDragOver,
    handleImportConceptCatalogFile,
    handleImportFile,
    handleOpenConceptCatalogFileUpload,
    handleOpenImport,
    handleRequestConceptCatalogImport,
    handleRequestLinkedConceptCatalogSpreadsheetImport,
    handleRequestLinkedQuoteSpreadsheetImport,
    handleRequestQuoteSpreadsheetImport,
    handleSpreadsheetDragLeave,
    handleSpreadsheetDragOver,
    handleSpreadsheetDrop,
    budgetImportActions,
  };
}
