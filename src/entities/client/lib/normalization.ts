const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail",
  "googlemail",
  "hotmail",
  "outlook",
  "live",
  "msn",
  "yahoo",
  "yahooes",
  "icloud",
  "me",
  "mac",
  "aol",
  "protonmail",
  "pm",
  "gmx",
  "zoho",
]);

const COMPOSITE_TLD_PREFIXES = new Set(["co", "com", "org", "net", "edu", "gov"]);

export function inferCompanyFromEmail(email: string): string {
  const [, domain = ""] = email.trim().toLowerCase().split("@");
  if (!domain) return "";

  const segments = domain.split(".").filter(Boolean);
  if (segments.length < 2) return "";

  const secondLevel = segments[segments.length - 2] ?? "";
  const rootIndex =
    segments.length >= 3 && COMPOSITE_TLD_PREFIXES.has(secondLevel)
      ? segments.length - 3
      : segments.length - 2;
  const candidate = segments[rootIndex] ?? "";
  if (!candidate || PERSONAL_EMAIL_DOMAINS.has(candidate)) return "";

  return candidate
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
