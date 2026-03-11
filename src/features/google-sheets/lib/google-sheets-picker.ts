type GapiLoaderConfig = {
  callback: () => void;
  onerror?: () => void;
  timeout?: number;
  ontimeout?: () => void;
};

type GooglePickerDocument = Record<string, string>;

type GooglePickerResponse = {
  [key: string]: unknown;
};

type GooglePickerBuilder = {
  setAppId: (appId: string) => GooglePickerBuilder;
  setDeveloperKey: (apiKey: string) => GooglePickerBuilder;
  setOAuthToken: (oauthToken: string) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  addView: (view: unknown) => GooglePickerBuilder;
  setCallback: (callback: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
  build: () => {
    setVisible: (visible: boolean) => void;
  };
};

type GooglePickerApi = {
  Action: {
    CANCEL: string;
    PICKED: string;
  };
  Document: {
    ID: string;
    NAME: string;
    MIME_TYPE: string;
  };
  Response: {
    ACTION: string;
    DOCUMENTS: string;
  };
  ViewId: {
    SPREADSHEETS: string;
  };
  DocsView: new (viewId: string) => {
    setIncludeFolders: (enabled: boolean) => unknown;
    setSelectFolderEnabled: (enabled: boolean) => unknown;
    setMimeTypes?: (mimeTypes: string) => unknown;
  };
  PickerBuilder: new () => GooglePickerBuilder;
};

type GoogleSheetsMetadataResponse = {
  sheets?: Array<{
    properties?: {
      title?: string;
    };
  }>;
};

type GoogleSheetsValuesResponse = {
  values?: unknown[][];
};

type GoogleApiErrorPayload = {
  error?: {
    message?: string;
  };
};

declare global {
  interface Window {
    gapi?: {
      load: (module: string, config: GapiLoaderConfig) => void;
    };
  }
}

const GOOGLE_API_SCRIPT_SRC = "https://apis.google.com/js/api.js";
const GOOGLE_NATIVE_SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";

let googleApiScriptPromise: Promise<void> | null = null;
let pickerModulePromise: Promise<void> | null = null;

function trimOrEmpty(value: string | undefined): string {
  return (value ?? "").trim();
}

function loadGoogleApiScript(): Promise<void> {
  if (window.gapi) return Promise.resolve();
  if (googleApiScriptPromise) return googleApiScriptPromise;

  googleApiScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_API_SCRIPT_SRC}"]`,
    );

    const handleReady = () => {
      if (!window.gapi) {
        reject(new Error("Google API Client could not be initialized."));
        return;
      }
      resolve();
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("The Google API script could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_API_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleReady;
    script.onerror = () => reject(new Error("The Google API script could not be loaded."));
    document.head.appendChild(script);
  });

  return googleApiScriptPromise;
}

async function loadPickerModule(): Promise<void> {
  if (getPickerApi()) return;
  if (pickerModulePromise) return pickerModulePromise;

  await loadGoogleApiScript();

  pickerModulePromise = new Promise<void>((resolve, reject) => {
    const gapi = window.gapi;
    if (!gapi) {
      reject(new Error("Google API Client is unavailable."));
      return;
    }

    gapi.load("picker", {
      callback: () => {
        if (!getPickerApi()) {
          reject(new Error("Google Picker could not be initialized."));
          return;
        }
        resolve();
      },
      onerror: () => {
        reject(new Error("Google Picker could not be loaded."));
      },
      timeout: 8000,
      ontimeout: () => {
        reject(new Error("Google Picker took too long to load."));
      },
    });
  });

  return pickerModulePromise;
}

export const GOOGLE_SHEETS_PICKER_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
] as const;

export type PickGoogleSpreadsheetResult = {
  spreadsheetId: string;
  name: string;
};

export async function pickGoogleSpreadsheet(config: {
  apiKey: string;
  appId: string;
  oauthToken: string;
}): Promise<PickGoogleSpreadsheetResult> {
  const apiKey = trimOrEmpty(config.apiKey);
  const appId = trimOrEmpty(config.appId);
  const oauthToken = trimOrEmpty(config.oauthToken);

  if (!apiKey) {
    throw new Error("VITE_GOOGLE_API_KEY is missing for Google Sheets Picker.");
  }
  if (!appId) {
    throw new Error("VITE_GOOGLE_APP_ID is missing for Google Sheets Picker.");
  }
  if (!oauthToken) {
    throw new Error("Could not obtain an OAuth token for Google Sheets.");
  }

  await loadPickerModule();

  const pickerApi = getPickerApi();
  if (!pickerApi) {
    throw new Error("Google Picker is unavailable.");
  }

  return new Promise<PickGoogleSpreadsheetResult>((resolve, reject) => {
    const view = new pickerApi.DocsView(pickerApi.ViewId.SPREADSHEETS);
    view.setIncludeFolders(false);
    view.setSelectFolderEnabled(false);
    if (typeof view.setMimeTypes === "function") {
      view.setMimeTypes(GOOGLE_NATIVE_SPREADSHEET_MIME_TYPE);
    }

    const picker = new pickerApi.PickerBuilder()
      .setAppId(appId)
      .setDeveloperKey(apiKey)
      .setOAuthToken(oauthToken)
      .setTitle("Select a spreadsheet")
      .addView(view)
      .setCallback((data: GooglePickerResponse) => {
        const action = String(data[pickerApi.Response.ACTION] ?? "");
        if (!action) return;

        if (action === pickerApi.Action.CANCEL) {
          reject(new Error("Selection canceled."));
          return;
        }

        if (action !== pickerApi.Action.PICKED) return;

        const documents = data[pickerApi.Response.DOCUMENTS] as GooglePickerDocument[] | undefined;
        const firstDocument = documents?.[0];
        const mimeType = trimOrEmpty(
          firstDocument?.[pickerApi.Document.MIME_TYPE] ?? firstDocument?.mimeType,
        );
        const spreadsheetId = trimOrEmpty(firstDocument?.[pickerApi.Document.ID]);
        const name = trimOrEmpty(firstDocument?.[pickerApi.Document.NAME]);

        if (mimeType && mimeType !== GOOGLE_NATIVE_SPREADSHEET_MIME_TYPE) {
          reject(
            new Error(
              "The selected file is not a native Google Spreadsheet. Convert it to Google Sheets and try again.",
            ),
          );
          return;
        }

        if (!spreadsheetId) {
          reject(new Error("The selected spreadsheet could not be identified."));
          return;
        }

        resolve({ spreadsheetId, name });
      })
      .build();

    picker.setVisible(true);
  });
}

function getPickerApi(): GooglePickerApi | undefined {
  return (window as unknown as { google?: { picker?: GooglePickerApi } }).google?.picker;
}

function buildGoogleAuthHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function readGoogleApiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as GoogleApiErrorPayload;
    const message = trimOrEmpty(payload.error?.message);
    if (message) return message;
  } catch {
    // Ignore parse failures and try plain text.
  }

  try {
    const rawMessage = trimOrEmpty(await response.text());
    if (rawMessage) return rawMessage;
  } catch {
    // Ignore text read failures.
  }

  return "";
}

function buildGoogleSheetsApiError(status: number, apiMessage: string): string {
  if (status === 401) return "Your Google session expired. Connect again.";
  if (status === 403) return "You do not have permission to read this spreadsheet.";
  if (status === 404) return "The selected spreadsheet was not found.";
  if (status === 400) {
    const normalized = apiMessage.toLowerCase();
    if (normalized.includes("not supported for this document")) {
      return "The selected file is not a native Google Spreadsheet. Convert it to Google Sheets and try again.";
    }
    if (normalized.includes("unable to parse range")) {
      return "The spreadsheet range could not be read. Check the sheet name and try again.";
    }
  }

  if (!apiMessage) return `Google Sheets API returned error ${status}.`;
  return `Google Sheets API returned error ${status}: ${apiMessage}`;
}

async function fetchGoogleSheetsMetadata(accessToken: string, spreadsheetId: string): Promise<GoogleSheetsMetadataResponse> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}?fields=sheets(properties(title))`,
    {
      headers: buildGoogleAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    const apiMessage = await readGoogleApiErrorMessage(response);
    throw new Error(buildGoogleSheetsApiError(response.status, apiMessage));
  }

  return (await response.json()) as GoogleSheetsMetadataResponse;
}

async function fetchGoogleSheetsValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<GoogleSheetsValuesResponse> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
    {
      headers: buildGoogleAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    const apiMessage = await readGoogleApiErrorMessage(response);
    throw new Error(buildGoogleSheetsApiError(response.status, apiMessage));
  }

  return (await response.json()) as GoogleSheetsValuesResponse;
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

export async function readGoogleSpreadsheetRows(config: {
  accessToken: string;
  spreadsheetId: string;
}): Promise<unknown[][]> {
  const accessToken = trimOrEmpty(config.accessToken);
  const spreadsheetId = trimOrEmpty(config.spreadsheetId);

  if (!accessToken) {
    throw new Error("Could not obtain an OAuth token to read Google Sheets.");
  }
  if (!spreadsheetId) {
    throw new Error("The spreadsheet identifier is missing.");
  }

  const metadata = await fetchGoogleSheetsMetadata(accessToken, spreadsheetId);
  const firstSheetTitle = trimOrEmpty(metadata.sheets?.[0]?.properties?.title);
  if (!firstSheetTitle) {
    throw new Error("The spreadsheet has no available sheets.");
  }

  const firstRange = `${quoteSheetName(firstSheetTitle)}!A:Z`;

  try {
    const valuesPayload = await fetchGoogleSheetsValues(accessToken, spreadsheetId, firstRange);
    return valuesPayload.values ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("range") && !message.includes("parse range")) {
      throw error;
    }

    const fallbackValuesPayload = await fetchGoogleSheetsValues(accessToken, spreadsheetId, "A:Z");
    return fallbackValuesPayload.values ?? [];
  }
}
