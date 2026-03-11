import type { Dispatch, Ref, SetStateAction } from "react";

import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { InputGroupText } from "@/components/ui/input-group";
import { inferCompanyFromEmail, type ClientDetails } from "@/entities/client";
import {
  formatGoogleContactDetails,
  GoogleGIcon,
  type GoogleContact,
} from "@/features/google-contacts";
import { cn } from "@/shared/lib/utils";

const conceptFieldClass =
  "h-8 rounded-md border-transparent bg-transparent px-2 py-0 text-sm shadow-none focus-visible:border-zinc-300 focus-visible:ring-1 focus-visible:ring-zinc-300";

type ClientDetailsPanelProps = {
  isFirstSheet: boolean;
  isBudgetDocument: boolean;
  isBudgetSheetInteractive: boolean;
  client: ClientDetails;
  setClient: Dispatch<SetStateAction<ClientDetails>>;
  firstClientSectionRef?: Ref<HTMLElement>;
  firstConceptChromeHeight: number;
  companyReferenceLines: readonly string[];
  isGoogleConfigured: boolean;
  googleNotice: string;
  isGoogleConnecting: boolean;
  isContactFromGoogle: boolean;
  googleContactsCount: number;
  clientAutocompleteContacts: GoogleContact[];
  clientAutocompleteQuery: string;
  isClientAutocompleteLoading: boolean;
  conceptComboboxContentClass: string;
  conceptRowFieldClass: string;
  budgetSecondaryFieldClass: string;
  invalidContactName: boolean;
  invalidCompanyName: boolean;
  onClientFieldChange: (key: keyof ClientDetails, value: string) => void;
  onRefreshGoogleContacts: () => Promise<void>;
  onApplyGoogleContact: (contact: GoogleContact) => void;
  onClientContactNameChange: (nextValue: string) => void;
};

export function ClientDetailsPanel({
  isFirstSheet,
  isBudgetDocument,
  isBudgetSheetInteractive,
  client,
  setClient,
  firstClientSectionRef,
  firstConceptChromeHeight,
  companyReferenceLines,
  isGoogleConfigured,
  googleNotice,
  isGoogleConnecting,
  isContactFromGoogle,
  googleContactsCount,
  clientAutocompleteContacts,
  clientAutocompleteQuery,
  isClientAutocompleteLoading,
  conceptComboboxContentClass,
  conceptRowFieldClass,
  budgetSecondaryFieldClass,
  invalidContactName,
  invalidCompanyName,
  onClientFieldChange,
  onRefreshGoogleContacts,
  onApplyGoogleContact,
  onClientContactNameChange,
}: ClientDetailsPanelProps) {
  if (!isFirstSheet) {
    return <div aria-hidden className="w-full" />;
  }

  return (
    <section
      ref={firstClientSectionRef}
      data-budget-print-client-section={isBudgetDocument ? "true" : undefined}
      data-budget-print-company={isBudgetDocument ? client.companyName : undefined}
      data-budget-print-contact={isBudgetDocument ? client.contactName : undefined}
      data-budget-print-email={isBudgetDocument ? client.email : undefined}
      className={cn("space-y-3", isBudgetDocument && "w-full space-y-0")}
      style={
        isBudgetDocument
          ? {
              paddingTop: `${Math.max(0, firstConceptChromeHeight)}px`,
            }
          : undefined
      }
    >
      {!isBudgetDocument ? <h2 className="text-sm font-medium text-zinc-800">Client</h2> : null}
      {!isGoogleConfigured && !isBudgetDocument ? (
        <p className="text-xs text-amber-700">
          Set `VITE_GOOGLE_CLIENT_ID` in `.env.local` to enable Google Contacts.
        </p>
      ) : null}
      {googleNotice && !isBudgetDocument ? (
        <p className="text-xs text-zinc-500">{googleNotice}</p>
      ) : null}
      <div className={cn(isBudgetDocument && "flex flex-col gap-10")}>
        {isBudgetDocument ? (
          <div className="flex min-h-[83px] flex-col gap-4 pl-2 text-[14px] text-[#0a0a0a]">
            {companyReferenceLines.map((line) => (
              <p key={line} className="leading-[17px]">
                {line}
              </p>
            ))}
          </div>
        ) : null}
        <div
          className={cn(
            "grid gap-3",
            isBudgetDocument ? "gap-1" : "md:grid-cols-2",
          )}
        >
          <Combobox<GoogleContact>
            value={client.contactName}
            options={clientAutocompleteContacts}
            placeholder={isBudgetDocument ? "Contact person" : "Contact name"}
            onValueChange={onClientContactNameChange}
            onOptionSelect={onApplyGoogleContact}
            getOptionLabel={(contact) => contact.name || contact.email || "No name"}
            getOptionKey={(contact) => contact.id}
            className="w-full"
            contentClassName={conceptComboboxContentClass}
            inputClassName={cn(
              isBudgetDocument
                ? conceptRowFieldClass
                : "h-8 w-full px-2 py-0 text-left text-[14px] font-normal text-[#171717] focus:text-[#171717]",
              "w-full",
            )}
            aria-invalid={invalidContactName || undefined}
            interactive={!isBudgetDocument || isBudgetSheetInteractive}
            endAdornment={
              isContactFromGoogle ? (
                <InputGroupText title="Contact selected from Google Contacts">
                  <GoogleGIcon />
                </InputGroupText>
              ) : null
            }
            emptyContent={
              isClientAutocompleteLoading ? (
                <p className="px-2 py-2 text-xs text-zinc-500">Searching Google Contacts...</p>
              ) : googleContactsCount === 0 ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void onRefreshGoogleContacts()}
                  disabled={isGoogleConnecting}
                  className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="text-sm text-zinc-700">
                    {isGoogleConnecting ? "Connecting contacts..." : "Connect your contacts"}
                  </span>
                  <GoogleGIcon />
                </button>
              ) : (
                <p className="px-2 py-2 text-xs text-zinc-500">
                  No matches for "{clientAutocompleteQuery.trim()}".
                </p>
              )
            }
            renderOption={(contact) => (
              <div className="w-full">
                <span className="block text-sm font-medium text-zinc-800">
                  {contact.name || contact.email || "No name"}
                </span>
                <span className="block text-xs text-zinc-500">
                  {formatGoogleContactDetails(contact)}
                </span>
              </div>
            )}
          />
          <Input
            type="email"
            value={client.email}
            onChange={(event) => {
              const nextEmail = event.target.value;
              setClient((current) => ({
                ...current,
                email: nextEmail,
                companyName: (() => {
                  const previousInferred = inferCompanyFromEmail(current.email);
                  const nextInferred = inferCompanyFromEmail(nextEmail);
                  const shouldAutoReplace =
                    !current.companyName || current.companyName === previousInferred;
                  return shouldAutoReplace ? nextInferred : current.companyName;
                })(),
              }));
            }}
            readOnly={isBudgetDocument && !isBudgetSheetInteractive}
            tabIndex={isBudgetDocument && !isBudgetSheetInteractive ? -1 : undefined}
            className={cn(isBudgetDocument ? budgetSecondaryFieldClass : conceptFieldClass)}
            placeholder="client@example.com"
          />
          <Input
            value={client.companyName}
            onChange={(event) => onClientFieldChange("companyName", event.target.value)}
            readOnly={isBudgetDocument && !isBudgetSheetInteractive}
            tabIndex={isBudgetDocument && !isBudgetSheetInteractive ? -1 : undefined}
            aria-invalid={invalidCompanyName || undefined}
            className={cn(isBudgetDocument ? budgetSecondaryFieldClass : conceptFieldClass)}
            placeholder="Company"
          />
          {!isBudgetDocument ? (
            <Input
              value={client.phone}
              onChange={(event) => onClientFieldChange("phone", event.target.value)}
              className={conceptFieldClass}
              placeholder="+34 600 000 000"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
