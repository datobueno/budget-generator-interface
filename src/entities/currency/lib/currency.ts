import type { CurrencyOption } from "../types";

export const FRANKFURTER_LATEST_URL = "https://api.frankfurter.app/latest?from=EUR";
export const CURRENCY_INPUT_PREFIX = "u/";

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { code: "USD", label: "Dolar estadounidense" },
  { code: "EUR", label: "Euro" },
  { code: "JPY", label: "Yen japones" },
  { code: "GBP", label: "Libra esterlina" },
  { code: "CNY", label: "Yuan chino" },
  { code: "CAD", label: "Dolar canadiense" },
  { code: "CHF", label: "Franco suizo" },
  { code: "AUD", label: "Dolar australiano" },
  { code: "INR", label: "Rupia india" },
  { code: "MXN", label: "Peso mexicano" },
  { code: "BRL", label: "Real brasileno" },
  { code: "SEK", label: "Corona sueca" },
  { code: "NOK", label: "Corona noruega" },
  { code: "DKK", label: "Corona danesa" },
  { code: "PLN", label: "Zloty polaco" },
] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function getCurrencySymbol(currency: string): string {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const getPartValue = (currencyDisplay: "narrowSymbol" | "symbol"): string | null => {
    const part = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((entry) => entry.type === "currency");
    return part?.value ?? null;
  };

  const narrowSymbol = getPartValue("narrowSymbol");
  if (narrowSymbol) return narrowSymbol;

  const symbol = getPartValue("symbol");
  if (symbol) return symbol;

  return normalizedCurrency;
}

export function formatUnitPriceHeaderLabel(currencyCode: string): string {
  return `${CURRENCY_INPUT_PREFIX}${getCurrencySymbol(currencyCode)}`;
}

export function normalizeCurrencyComboboxInput(value: string): string {
  const trimmedStart = value.trimStart();
  if (!trimmedStart) return CURRENCY_INPUT_PREFIX;

  const lower = trimmedStart.toLowerCase();
  if (lower.startsWith(CURRENCY_INPUT_PREFIX)) {
    return `${CURRENCY_INPUT_PREFIX}${trimmedStart.slice(CURRENCY_INPUT_PREFIX.length)}`;
  }
  if (lower === "u" || trimmedStart === "/") return CURRENCY_INPUT_PREFIX;
  if (trimmedStart.startsWith("/")) return `${CURRENCY_INPUT_PREFIX}${trimmedStart.slice(1)}`;

  return `${CURRENCY_INPUT_PREFIX}${trimmedStart}`;
}

export function extractCurrencyComboboxQuery(value: string): string {
  const normalized = normalizeCurrencyComboboxInput(value);
  return normalized.slice(CURRENCY_INPUT_PREFIX.length).trim();
}

export function scaleMoney(value: number | null, scale: number): number | null {
  if (value === null) return null;
  return round2(value * scale);
}

export function resolveRateFromEur(
  rates: Record<string, number>,
  currency: string,
): number | null {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized === "EUR") return 1;
  const rate = rates[normalized];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

export async function fetchFrankfurterRates(): Promise<Record<string, number>> {
  const response = await fetch(FRANKFURTER_LATEST_URL);
  if (!response.ok) {
    throw new Error(`Frankfurter HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    rates?: Record<string, number>;
  };
  if (!payload || typeof payload !== "object" || !payload.rates) {
    throw new Error("Respuesta invalida de Frankfurter.");
  }

  const normalizedRates: Record<string, number> = { EUR: 1 };
  Object.entries(payload.rates).forEach(([code, value]) => {
    const normalizedCode = normalizeCurrencyCode(code);
    if (!normalizedCode) return;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
    normalizedRates[normalizedCode] = value;
  });

  return normalizedRates;
}
