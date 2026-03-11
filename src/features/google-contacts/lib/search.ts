import type { GoogleContact } from "./google-people";

export function formatGoogleContactDetails(contact: GoogleContact): string {
  const details = [contact.email, contact.phone, contact.company].filter(Boolean);
  const sourceLabel = contact.source === "otherContacts" ? "Other contacts" : "Contacts";

  if (details.length === 0) return sourceLabel;
  return `${details.join(" | ")} | ${sourceLabel}`;
}

export function searchGoogleContactsLocally(
  contacts: GoogleContact[],
  query: string,
  limit?: number,
): GoogleContact[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return limit ? contacts.slice(0, limit) : contacts;

  const scored = contacts
    .map((contact) => {
      const fields = [contact.name, contact.email, contact.phone, contact.company]
        .map((field) => field.trim().toLowerCase())
        .filter(Boolean);

      let score = 0;
      fields.forEach((field) => {
        if (field.startsWith(normalizedQuery)) {
          score = Math.max(score, 3);
          return;
        }
        if (field.includes(normalizedQuery)) {
          score = Math.max(score, 2);
          return;
        }

        const tokens = field.split(/[\s@._-]+/).filter(Boolean);
        if (tokens.some((token) => token.startsWith(normalizedQuery))) {
          score = Math.max(score, 1);
        }
      });

      return { contact, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      const leftLabel = (
        left.contact.name ||
        left.contact.email ||
        left.contact.company ||
        left.contact.phone
      ).toLowerCase();
      const rightLabel = (
        right.contact.name ||
        right.contact.email ||
        right.contact.company ||
        right.contact.phone
      ).toLowerCase();
      return leftLabel.localeCompare(rightLabel);
    })
    .map((item) => item.contact);

  return limit ? scored.slice(0, limit) : scored;
}
