import { describe, expect, it } from "vitest";

import { buildPrintableSheetsMarkup } from "@/features/pdf-export";

describe("print export markup", () => {
  it("preserves issuer company lines and keeps quote number alignment classes", () => {
    const sheetRoot = document.createElement("div");
    const sheet = document.createElement("section");
    sheet.id = "sheet-1";
    sheet.innerHTML = `
      <div data-budget-print-quote-number-panel="true" data-budget-print-quote-number="Q-2026-001"></div>
      <section
        data-budget-print-client-section="true"
        data-budget-print-company="Client Company"
        data-budget-print-contact="Jane Doe"
        data-budget-print-email="jane@example.com"
      >
        <div class="flex flex-col gap-10">
          <div class="flex min-h-[83px] flex-col gap-4 pl-2 text-[14px] text-[#0a0a0a]">
            <p class="leading-[17px]">Datobueno INC.</p>
            <p class="leading-[17px]">46766948J</p>
            <p class="leading-[17px]">+34 656 33 23 03</p>
          </div>
        </div>
      </section>
    `;
    sheetRoot.appendChild(sheet);

    const markup = buildPrintableSheetsMarkup(sheetRoot, {
      budgetNumericFontClass: "font-mono",
    });

    expect(markup).toContain("Datobueno INC.");
    expect(markup).toContain("46766948J");
    expect(markup).toContain("+34 656 33 23 03");
    expect(markup).toContain("Jane Doe");
    expect(markup).toContain("Client Company");
    expect(markup).toContain("Q-2026-001");
    expect(markup).toContain("w-full px-2 text-[14px] leading-5 text-[#0a0a0a] font-mono");
  });
});
