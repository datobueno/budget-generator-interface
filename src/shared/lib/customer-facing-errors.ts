import { toast } from "sonner";

export type CustomerFacingErrorContext =
  | "googleContacts"
  | "googleSheets"
  | "quoteImport"
  | "catalogImport"
  | "currencyLoad"
  | "currencyChange"
  | "logoUpload"
  | "pdfExport";

export type CustomerFacingErrorToast = {
  title: string;
  description: string;
};

const ERROR_TOASTS = {
  googleSessionExpired: {
    title: "Your Google session expired. Connect again.",
    description: "Action: Reconnect.",
  },
  googleContactsPermission: {
    title: "Google did not grant access to your contacts.",
    description: "Action: Review OAuth permissions.",
  },
  googleSpreadsheetPermission: {
    title: "Google did not grant access to the selected spreadsheet.",
    description: "Action: Review OAuth permissions.",
  },
  googleContactsProvider: {
    title: "Google returned an error while loading contacts.",
    description: "Provider: Retry.",
  },
  googleSpreadsheetProvider: {
    title: "Google returned an error while loading the spreadsheet.",
    description: "Provider: Retry.",
  },
  spreadsheetNoPermission: {
    title: "You do not have permission to access this spreadsheet.",
    description: "Action: Request access from the owner.",
  },
  spreadsheetNotFound: {
    title: "The selected spreadsheet does not exist.",
    description: "Action: Select a different one.",
  },
  spreadsheetNotIdentified: {
    title: "The selected spreadsheet could not be identified.",
    description: "Action: Select a different one.",
  },
  spreadsheetNotNative: {
    title: "The file is not a native Google Spreadsheet.",
    description: "Action: Convert it to Google Sheets.",
  },
  spreadsheetRead: {
    title: "The spreadsheet sheet could not be read.",
    description: "Action: Check the structure or retry.",
  },
  googleUnavailable: {
    title: "Google is unavailable.",
    description: "Provider: Retry later.",
  },
  currencyProviderInvalid: {
    title: "The currency exchange provider returned an invalid response.",
    description: "Provider: Retry.",
  },
  currencyRateUnavailable: {
    title: "No conversion rate is available for this currency.",
    description: "Action: Change currency or retry.",
  },
  googleConnection: {
    title: "Could not connect to Google.",
    description: "Action: Check the connection.",
  },
  googleAuthorization: {
    title: "Could not start Google authorization.",
    description: "Action: Check the connection.",
  },
  googleContactsLoad: {
    title: "Could not load Google contacts.",
    description: "Action: Check the connection.",
  },
  googleSheetsOpen: {
    title: "Could not open Google Sheets.",
    description: "Action: Check the connection.",
  },
  currencyRatesLoad: {
    title: "Could not load exchange rates.",
    description: "Action: Check the connection.",
  },
  currencyChange: {
    title: "Could not change the currency.",
    description: "Action: Check the connection.",
  },
  googleNotConfigured: {
    title: "Google integration is not configured.",
    description: "Action: Configure the integration.",
  },
  logoType: {
    title: "The logo must be an image.",
    description: "Action: Choose a different file.",
  },
  logoRead: {
    title: "Could not read or process the logo.",
    description: "Action: Choose a different file.",
  },
  fileEmpty: {
    title: "The file is empty.",
    description: "Action: Review the file.",
  },
  fileNoSheets: {
    title: "The file does not contain valid sheets.",
    description: "Action: Review the file.",
  },
  noDescriptionColumn: {
    title: "No compatible Description column was found.",
    description: "Action: Adjust the columns.",
  },
  noValidRows: {
    title: "No valid rows were found to import.",
    description: "Action: Review the data.",
  },
  noValidConcepts: {
    title: "No valid concepts were found to import.",
    description: "Action: Review the data.",
  },
  fileImport: {
    title: "Could not import the file.",
    description: "Action: Review the file.",
  },
  catalogImport: {
    title: "Could not import the catalog.",
    description: "Action: Review the file.",
  },
  documentSheetsNotFound: {
    title: "Document sheets were not found.",
    description: "Action: Review the file.",
  },
  noSheetsToPrint: {
    title: "There are no sheets to print.",
    description: "Action: Add content.",
  },
  printBlocked: {
    title: "The browser blocked the print window.",
    description: "Action: Allow popups.",
  },
  pdfGeneration: {
    title: "Could not generate the PDF.",
    description: "Action: Retry or review the content.",
  },
} as const satisfies Record<string, CustomerFacingErrorToast>;

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  return String(error ?? "").trim();
}

function matchesGoogleIntegrationConfig(message: string): boolean {
  return (
    message.includes("VITE_GOOGLE_CLIENT_ID") ||
    message.includes("VITE_GOOGLE_API_KEY") ||
    message.includes("VITE_GOOGLE_APP_ID")
  );
}

function mapGoogleContactsError(message: string): CustomerFacingErrorToast {
  if (matchesGoogleIntegrationConfig(message)) return ERROR_TOASTS.googleNotConfigured;
  if (message === "Your Google session expired. Connect again.") {
    return ERROR_TOASTS.googleSessionExpired;
  }
  if (
    message === "Access to Google contacts was not granted." ||
    message === "Access to other Google contacts was not granted."
  ) {
    return ERROR_TOASTS.googleContactsPermission;
  }
  if (message.startsWith("Google People API returned error")) {
    return ERROR_TOASTS.googleContactsProvider;
  }
  if (
    message === "Could not start the Google OAuth flow." ||
    message === "Could not obtain Google token."
  ) {
    return ERROR_TOASTS.googleAuthorization;
  }
  if (
    message === "Google Identity Services is unavailable." ||
    message === "Google Identity Services could not be initialized."
  ) {
    return ERROR_TOASTS.googleUnavailable;
  }
  if (
    message === "The Google Identity script could not be loaded." ||
    message === "Could not connect to Google Contacts."
  ) {
    return ERROR_TOASTS.googleConnection;
  }

  return ERROR_TOASTS.googleContactsLoad;
}

function mapGoogleSheetsError(message: string): CustomerFacingErrorToast {
  if (matchesGoogleIntegrationConfig(message)) return ERROR_TOASTS.googleNotConfigured;
  if (message === "Your Google session expired. Connect again.") {
    return ERROR_TOASTS.googleSessionExpired;
  }
  if (
    message === "Could not start the Google OAuth flow." ||
    message === "Could not obtain Google token." ||
    message === "Could not obtain an OAuth token for Google Sheets." ||
    message === "Could not obtain an OAuth token to read Google Sheets."
  ) {
    return ERROR_TOASTS.googleAuthorization;
  }
  if (message === "You do not have permission to read this spreadsheet.") {
    return ERROR_TOASTS.spreadsheetNoPermission;
  }
  if (message === "The selected spreadsheet was not found.") {
    return ERROR_TOASTS.spreadsheetNotFound;
  }
  if (
    message === "The selected spreadsheet could not be identified." ||
    message === "The spreadsheet identifier is missing."
  ) {
    return ERROR_TOASTS.spreadsheetNotIdentified;
  }
  if (message.includes("not a native Google Spreadsheet")) {
    return ERROR_TOASTS.spreadsheetNotNative;
  }
  if (
    message === "The spreadsheet range could not be read. Check the sheet name and try again." ||
    message === "The spreadsheet has no available sheets."
  ) {
    return ERROR_TOASTS.spreadsheetRead;
  }
  if (message.startsWith("Google Sheets API returned error")) {
    return ERROR_TOASTS.googleSpreadsheetProvider;
  }
  if (
    message === "Google Picker is unavailable." ||
    message === "Google API Client is unavailable." ||
    message === "Google API Client could not be initialized." ||
    message === "Google Picker could not be initialized."
  ) {
    return ERROR_TOASTS.googleUnavailable;
  }
  if (
    message === "The Google API script could not be loaded." ||
    message === "Google Picker could not be loaded." ||
    message === "Google Picker took too long to load."
  ) {
    return ERROR_TOASTS.googleSheetsOpen;
  }

  return ERROR_TOASTS.googleSpreadsheetProvider;
}

function mapImportError(
  message: string,
  fallback: CustomerFacingErrorToast,
): CustomerFacingErrorToast {
  if (message === "The file is empty.") return ERROR_TOASTS.fileEmpty;
  if (message === "The file does not contain any sheets.") return ERROR_TOASTS.fileNoSheets;
  if (
    message.startsWith("No compatible column exists for") ||
    message.startsWith("No compatible columns were found.")
  ) {
    return ERROR_TOASTS.noDescriptionColumn;
  }
  if (message === "No valid rows were found to import.") return ERROR_TOASTS.noValidRows;
  if (message === "No valid items were found to import.") return ERROR_TOASTS.noValidConcepts;
  return fallback;
}

function mapCurrencyError(
  message: string,
  fallback: CustomerFacingErrorToast,
): CustomerFacingErrorToast {
  if (message === "Invalid response from Frankfurter.") {
    return ERROR_TOASTS.currencyProviderInvalid;
  }
  if (message.startsWith("No conversion rate is available for")) {
    return ERROR_TOASTS.currencyRateUnavailable;
  }
  return fallback;
}

export function getCustomerFacingErrorToast(
  error: unknown,
  context: CustomerFacingErrorContext,
): CustomerFacingErrorToast {
  const message = normalizeErrorMessage(error);

  switch (context) {
    case "googleContacts":
      return mapGoogleContactsError(message);
    case "googleSheets":
      return mapGoogleSheetsError(message);
    case "quoteImport":
      return mapImportError(message, ERROR_TOASTS.fileImport);
    case "catalogImport":
      return mapImportError(message, ERROR_TOASTS.catalogImport);
    case "currencyLoad":
      return mapCurrencyError(message, ERROR_TOASTS.currencyRatesLoad);
    case "currencyChange":
      return mapCurrencyError(message, ERROR_TOASTS.currencyChange);
    case "logoUpload":
      if (message === "The logo must be an image.") return ERROR_TOASTS.logoType;
      return ERROR_TOASTS.logoRead;
    case "pdfExport":
      if (message === "Could not find the document sheets.") {
        return ERROR_TOASTS.documentSheetsNotFound;
      }
      if (message === "There are no sheets to print.") {
        return ERROR_TOASTS.noSheetsToPrint;
      }
      if (message === "The print window was blocked by the browser.") {
        return ERROR_TOASTS.printBlocked;
      }
      return ERROR_TOASTS.pdfGeneration;
    default:
      return ERROR_TOASTS.fileImport;
  }
}

export function showCustomerFacingErrorToast(
  error: unknown,
  context: CustomerFacingErrorContext,
): string {
  const { title, description } = getCustomerFacingErrorToast(error, context);
  toast.error(title, { description });
  return title;
}
