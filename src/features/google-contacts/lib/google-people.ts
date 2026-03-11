type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (config?: { prompt?: string }) => void;
};

type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: unknown) => void;
  }) => GoogleTokenClient;
};

type GooglePerson = {
  resourceName?: string;
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string; canonicalForm?: string }>;
  organizations?: Array<{ name?: string }>;
};

type GooglePeopleListResponse = {
  connections?: GooglePerson[];
  otherContacts?: GooglePerson[];
  nextPageToken?: string;
  totalSize?: number;
};

type GooglePeopleSearchResponse = {
  results?: Array<{
    person?: GooglePerson;
  }>;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}

export type GoogleContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: "connections" | "otherContacts";
};

export type FetchGoogleContactsResult = {
  contacts: GoogleContact[];
  warnings: string[];
};

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_PEOPLE_SCOPES = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
] as const;

let googleScriptPromise: Promise<void> | null = null;

function trimOrEmpty(value: string | undefined): string {
  return (value ?? "").trim();
}

function firstNonEmpty<T>(
  values: T[] | undefined,
  extractor: (value: T) => string | undefined,
): string {
  if (!values) return "";
  for (const value of values) {
    const normalized = trimOrEmpty(extractor(value));
    if (normalized) return normalized;
  }
  return "";
}

function mapPersonToContact(
  person: GooglePerson,
  source: GoogleContact["source"],
  fallbackId: string,
): GoogleContact | null {
  const name = firstNonEmpty(person.names, (item) => item.displayName);
  const email = firstNonEmpty(person.emailAddresses, (item) => item.value);
  const phone = firstNonEmpty(
    person.phoneNumbers,
    (item) => item.canonicalForm || item.value,
  );
  const company = firstNonEmpty(person.organizations, (item) => item.name);

  if (!name && !email && !phone && !company) return null;

  return {
    id: trimOrEmpty(person.resourceName) || fallbackId,
    name,
    email,
    phone,
    company,
    source,
  };
}

function dedupeContacts(contacts: GoogleContact[]): GoogleContact[] {
  const seen = new Set<string>();
  const deduped: GoogleContact[] = [];

  contacts.forEach((contact) => {
    const normalizedKey = [
      contact.email.toLowerCase(),
      contact.name.toLowerCase(),
      contact.phone.toLowerCase(),
      contact.company.toLowerCase(),
    ]
      .join("|")
      .trim();
    const key = normalizedKey === "|||" ? `id:${contact.id}` : normalizedKey;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(contact);
  });

  return deduped.sort((left, right) => {
    const leftLabel = (left.name || left.email || left.company || left.phone || "").toLowerCase();
    const rightLabel = (right.name || right.email || right.company || right.phone || "").toLowerCase();
    return leftLabel.localeCompare(rightLabel);
  });
}

async function fetchPeopleCollection(
  accessToken: string,
  source: GoogleContact["source"],
): Promise<GoogleContact[]> {
  const contacts: GoogleContact[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "500",
      pageToken: pageToken ?? "",
    });

    const endpoint =
      source === "connections"
        ? "people/me/connections"
        : "otherContacts";

    if (source === "connections") {
      params.set(
        "personFields",
        "names,emailAddresses,phoneNumbers,organizations",
      );
    } else {
      params.set(
        "readMask",
        "names,emailAddresses,phoneNumbers,organizations,metadata",
      );
      params.append("sources", "READ_SOURCE_TYPE_CONTACT");
      params.append("sources", "READ_SOURCE_TYPE_PROFILE");
    }

    if (!pageToken) params.delete("pageToken");

    const response = await fetch(
      `https://people.googleapis.com/v1/${endpoint}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Your Google session expired. Connect again.");
      }
      if (response.status === 403) {
        throw new Error(
          source === "otherContacts"
            ? "Access to other Google contacts was not granted."
            : "Access to Google contacts was not granted.",
        );
      }
      throw new Error(`Google People API returned error ${response.status}.`);
    }

    const payload = (await response.json()) as GooglePeopleListResponse;
    const people = source === "connections" ? payload.connections ?? [] : payload.otherContacts ?? [];

    people.forEach((person, index) => {
      const contact = mapPersonToContact(
        person,
        source,
        `${source}-${contacts.length + index}`,
      );
      if (!contact) return;
      contacts.push(contact);
    });

    pageToken = payload.nextPageToken;
  } while (pageToken);

  return contacts;
}

async function searchPeopleCollection(
  accessToken: string,
  query: string,
  source: GoogleContact["source"],
): Promise<GoogleContact[]> {
  const params = new URLSearchParams({
    query,
    pageSize: "10",
    readMask: "names,emailAddresses,phoneNumbers,organizations",
  });

  const endpoint =
    source === "connections" ? "people:searchContacts" : "otherContacts:search";

  const response = await fetch(`https://people.googleapis.com/v1/${endpoint}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your Google session expired. Connect again.");
    }
    if (response.status === 403) {
      throw new Error(
        source === "otherContacts"
          ? "Access to other Google contacts was not granted."
          : "Access to Google contacts was not granted.",
      );
    }
    throw new Error(`Google People API returned error ${response.status}.`);
  }

  const payload = (await response.json()) as GooglePeopleSearchResponse;
  const results = payload.results ?? [];

  const contacts: GoogleContact[] = [];
  results.forEach((result, index) => {
    const contact = mapPersonToContact(
      result.person ?? {},
      source,
      `${source}-search-${index}`,
    );
    if (!contact) return;
    contacts.push(contact);
  });

  return contacts;
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );

    const handleReady = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      reject(new Error("Google Identity Services could not be initialized."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleReady, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("The Google Identity script could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleReady;
    script.onerror = () => reject(new Error("The Google Identity script could not be loaded."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function requestGoogleAccessToken(config: {
  clientId: string;
  scopes: readonly string[];
}): Promise<string> {
  const clientId = trimOrEmpty(config.clientId);
  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is missing for Google Contacts.");
  }

  await loadGoogleIdentityScript();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google Identity Services is unavailable.");
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: config.scopes.join(" "),
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Could not obtain Google token.",
            ),
          );
          return;
        }
        resolve(response.access_token);
      },
      error_callback: () => {
        reject(new Error("Could not start the Google OAuth flow."));
      },
    });

    tokenClient.requestAccessToken();
  });
}

export async function fetchGoogleContacts(
  accessToken: string,
): Promise<FetchGoogleContactsResult> {
  const warnings: string[] = [];
  const [connectionsResult, otherContactsResult] = await Promise.allSettled([
    fetchPeopleCollection(accessToken, "connections"),
    fetchPeopleCollection(accessToken, "otherContacts"),
  ]);

  const contacts: GoogleContact[] = [];

  if (connectionsResult.status === "fulfilled") {
    contacts.push(...connectionsResult.value);
  } else {
    warnings.push(connectionsResult.reason instanceof Error ? connectionsResult.reason.message : "Google contacts could not be loaded.");
  }

  if (otherContactsResult.status === "fulfilled") {
    contacts.push(...otherContactsResult.value);
  } else {
    warnings.push(otherContactsResult.reason instanceof Error ? otherContactsResult.reason.message : "Other Google contacts could not be loaded.");
  }

  const dedupedContacts = dedupeContacts(contacts);
  if (dedupedContacts.length === 0 && warnings.length > 0) {
    throw new Error(warnings[0]);
  }

  return {
    contacts: dedupedContacts,
    warnings,
  };
}

export async function searchGoogleContacts(
  accessToken: string,
  query: string,
): Promise<FetchGoogleContactsResult> {
  const normalizedQuery = trimOrEmpty(query);
  if (!normalizedQuery) {
    return {
      contacts: [],
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const [connectionsResult, otherContactsResult] = await Promise.allSettled([
    searchPeopleCollection(accessToken, normalizedQuery, "connections"),
    searchPeopleCollection(accessToken, normalizedQuery, "otherContacts"),
  ]);

  const contacts: GoogleContact[] = [];

  if (connectionsResult.status === "fulfilled") {
    contacts.push(...connectionsResult.value);
  } else {
    warnings.push(
      connectionsResult.reason instanceof Error
        ? connectionsResult.reason.message
        : "No se pudieron buscar los contactos.",
    );
  }

  if (otherContactsResult.status === "fulfilled") {
    contacts.push(...otherContactsResult.value);
  } else {
    warnings.push(
      otherContactsResult.reason instanceof Error
        ? otherContactsResult.reason.message
        : "No se pudieron buscar los otros contactos.",
    );
  }

  return {
    contacts: dedupeContacts(contacts),
    warnings,
  };
}
