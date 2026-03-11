import { describe, expect, it, vi } from "vitest";

import {
  extractCurrencyComboboxQuery,
  fetchFrankfurterRates,
  formatUnitPriceHeaderLabel,
  getCurrencySymbol,
  normalizeCurrencyComboboxInput,
  resolveRateFromEur,
  scaleMoney,
} from "@/entities/currency";

describe("currency helpers", () => {
  it("normalizes the combobox input and extracts the query", () => {
    expect(normalizeCurrencyComboboxInput("usd")).toBe("u/usd");
    expect(extractCurrencyComboboxQuery("u/yen")).toBe("yen");
  });

  it("formats the unit price header with the correct symbol", () => {
    expect(formatUnitPriceHeaderLabel("EUR")).toBe("u/€");
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("scales money using the resolved rate from EUR", () => {
    expect(resolveRateFromEur({ EUR: 1, USD: 1.1 }, "USD")).toBe(1.1);
    expect(scaleMoney(10, 1.5)).toBe(15);
    expect(scaleMoney(null, 1.5)).toBeNull();
  });

  it("loads and normalizes Frankfurter rates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { usd: 1.08, GBP: 0.86, BAD: -1 } }),
      }),
    );

    await expect(fetchFrankfurterRates()).resolves.toEqual({
      EUR: 1,
      USD: 1.08,
      GBP: 0.86,
    });
  });
});
