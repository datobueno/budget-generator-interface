import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { ClientDetails } from "@/entities/client";
import { inferCompanyFromEmail } from "@/entities/client";
import {
  CLIENT_AUTOCOMPLETE_DEBOUNCE_MS,
  CLIENT_AUTOCOMPLETE_MIN_CHARS,
} from "@/features/client-details";
import {
  GOOGLE_PEOPLE_SCOPES,
  fetchGoogleContacts,
  requestGoogleAccessToken,
  searchGoogleContactsLocally,
  type GoogleContact,
} from "@/features/google-contacts";
import { GOOGLE_SHEETS_PICKER_SCOPES } from "@/features/google-sheets";
import { showCustomerFacingErrorToast } from "@/shared/lib/customer-facing-errors";

import type { GoogleSheetsPickerConfig, QuoteEditorNoticeApi } from "./types";

type UseGoogleIntegrationArgs = {
  setClient: Dispatch<SetStateAction<ClientDetails>>;
  noticeApi: QuoteEditorNoticeApi;
};

export function useGoogleIntegration({
  setClient,
  noticeApi,
}: UseGoogleIntegrationArgs) {
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [googleNotice, setGoogleNotice] = useState("");
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [isContactFromGoogle, setIsContactFromGoogle] = useState(false);
  const [clientAutocompleteQuery, setClientAutocompleteQuery] = useState("");
  const [clientAutocompleteContacts, setClientAutocompleteContacts] = useState<GoogleContact[]>([]);
  const [isClientAutocompleteLoading, setIsClientAutocompleteLoading] = useState(false);

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
  const googleApiKey = (import.meta.env.VITE_GOOGLE_API_KEY ?? "").trim();
  const googleAppId = (import.meta.env.VITE_GOOGLE_APP_ID ?? "").trim();
  const isGoogleConfigured = Boolean(googleClientId);

  useEffect(() => {
    const query = clientAutocompleteQuery.trim();

    if (query.length < CLIENT_AUTOCOMPLETE_MIN_CHARS) {
      if (isGoogleConfigured && googleContacts.length > 0) {
        setClientAutocompleteContacts(searchGoogleContactsLocally(googleContacts, "", 8));
        setIsClientAutocompleteLoading(false);
        return;
      }

      setClientAutocompleteContacts([]);
      setIsClientAutocompleteLoading(false);
      return;
    }

    if (!isGoogleConfigured || googleContacts.length === 0) {
      setClientAutocompleteContacts([]);
      setIsClientAutocompleteLoading(false);
      return;
    }

    setIsClientAutocompleteLoading(true);
    const timeoutId = window.setTimeout(() => {
      setClientAutocompleteContacts(
        searchGoogleContactsLocally(googleContacts, query, 8),
      );
      setIsClientAutocompleteLoading(false);
    }, CLIENT_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clientAutocompleteQuery, googleContacts, isGoogleConfigured]);

  const handleRefreshGoogleContacts = useCallback(async () => {
    if (!isGoogleConfigured) {
      setGoogleNotice(
        showCustomerFacingErrorToast(
          new Error("VITE_GOOGLE_CLIENT_ID is missing in your .env.local."),
          "googleContacts",
        ),
      );
      return;
    }

    try {
      setIsGoogleConnecting(true);
      setGoogleNotice("Loading Google contacts...");

      let token = googleAccessToken;
      if (!token) {
        token = await requestGoogleAccessToken({
          clientId: googleClientId,
          scopes: GOOGLE_PEOPLE_SCOPES,
        });
        setGoogleAccessToken(token);
      }

      let contactsResult;
      try {
        contactsResult = await fetchGoogleContacts(token);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("expired")) throw error;

        token = await requestGoogleAccessToken({
          clientId: googleClientId,
          scopes: GOOGLE_PEOPLE_SCOPES,
        });
        setGoogleAccessToken(token);
        contactsResult = await fetchGoogleContacts(token);
      }

      const { contacts, warnings } = contactsResult;
      setGoogleContacts(contacts);

      const connectionsCount = contacts.filter(
        (contact) => contact.source === "connections",
      ).length;
      const otherContactsCount = contacts.filter(
        (contact) => contact.source === "otherContacts",
      ).length;
      const warningMessage = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";
      setGoogleNotice(
        `${contacts.length} contacts loaded (Contacts: ${connectionsCount}, Other contacts: ${otherContactsCount}).${warningMessage}`,
      );
    } catch (error) {
      const fallbackError =
        error instanceof Error ? error : new Error("Could not connect to Google Contacts.");
      setGoogleNotice(showCustomerFacingErrorToast(fallbackError, "googleContacts"));
    } finally {
      setIsGoogleConnecting(false);
    }
  }, [googleAccessToken, googleClientId, isGoogleConfigured]);

  const handleApplyGoogleContact = useCallback(
    (contact: GoogleContact) => {
      const inferredCompany = inferCompanyFromEmail(contact.email);
      setClient((current) => ({
        ...current,
        contactName: contact.name || current.contactName,
        companyName: contact.company || inferredCompany || "",
        email: contact.email || current.email,
        phone: contact.phone || current.phone,
      }));
      setIsContactFromGoogle(true);
      setGoogleNotice(`Contact applied: ${contact.name || contact.email || "No name"}.`);
      setClientAutocompleteQuery(contact.name || contact.email || "");
      setClientAutocompleteContacts([]);
      setIsClientAutocompleteLoading(false);
    },
    [setClient],
  );

  const handleClientContactNameChange = useCallback(
    (nextValue: string) => {
      setClient((current) => ({ ...current, contactName: nextValue }));
      setIsContactFromGoogle(false);
      setClientAutocompleteQuery(nextValue);
    },
    [setClient],
  );

  const getGoogleSheetsPickerConfig = useCallback((): GoogleSheetsPickerConfig | null => {
    if (!isGoogleConfigured) {
      noticeApi.publishErrorNotice(
        new Error("VITE_GOOGLE_CLIENT_ID is missing in your .env.local."),
        "googleSheets",
      );
      noticeApi.scheduleNoticeClear(3500);
      return null;
    }

    if (!googleApiKey) {
      noticeApi.publishErrorNotice(
        new Error("VITE_GOOGLE_API_KEY is missing in your .env.local."),
        "googleSheets",
      );
      noticeApi.scheduleNoticeClear(3500);
      return null;
    }

    if (!googleAppId) {
      noticeApi.publishErrorNotice(
        new Error("VITE_GOOGLE_APP_ID is missing in your .env.local."),
        "googleSheets",
      );
      noticeApi.scheduleNoticeClear(3500);
      return null;
    }

    return {
      clientId: googleClientId,
      apiKey: googleApiKey,
      appId: googleAppId,
    };
  }, [googleApiKey, googleAppId, googleClientId, isGoogleConfigured, noticeApi]);

  const requestGoogleSheetsToken = useCallback(async () => {
    noticeApi.publishSystemNotice("Connecting to Google...");
    const token = await requestGoogleAccessToken({
      clientId: googleClientId,
      scopes: GOOGLE_SHEETS_PICKER_SCOPES,
    });
    setGoogleAccessToken(token);
    return token;
  }, [googleClientId, noticeApi]);

  return {
    googleContactsCount: googleContacts.length,
    googleNotice,
    isGoogleConnecting,
    isContactFromGoogle,
    clientAutocompleteQuery,
    clientAutocompleteContacts,
    isClientAutocompleteLoading,
    isGoogleConfigured,
    handleRefreshGoogleContacts,
    handleApplyGoogleContact,
    handleClientContactNameChange,
    getGoogleSheetsPickerConfig,
    requestGoogleSheetsToken,
  };
}
