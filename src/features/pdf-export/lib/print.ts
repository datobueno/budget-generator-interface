import {
  BUDGET_COMPANY_REFERENCE_LINES,
  type BudgetSheetOrientation,
} from "@/features/quote-preview";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createPrintTextElement(
  tagName: "div" | "p" | "span",
  className: string,
  text: string,
): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text || " ";
  return element;
}

function normalizePrintableBudgetSheet(
  clonedSheet: HTMLElement,
  budgetNumericFontClass: string,
): void {
  const printableLogo = clonedSheet.querySelector<HTMLElement>('[data-budget-print-logo="true"]');
  if (printableLogo) {
    printableLogo.removeAttribute("role");
    printableLogo.removeAttribute("tabindex");
    printableLogo.style.border = "0";
    printableLogo.style.background = "transparent";
    printableLogo.style.boxShadow = "none";
    printableLogo.style.padding = "0";
    printableLogo.style.borderRadius = "0";
  }

  const printableQuoteNumber = clonedSheet.querySelector<HTMLElement>(
    '[data-budget-print-quote-number-panel="true"]',
  );
  if (printableQuoteNumber) {
    const quoteNumber = printableQuoteNumber.dataset.budgetPrintQuoteNumber?.trim() ?? "";
    printableQuoteNumber.replaceChildren(
      createPrintTextElement(
        "p",
        `w-full px-2 text-[14px] leading-5 text-[#0a0a0a] ${budgetNumericFontClass}`,
        quoteNumber || "####_quote_####",
      ),
    );
  }

  const printableDates = clonedSheet.querySelector<HTMLElement>(
    '[data-budget-print-dates-panel="true"]',
  );
  if (printableDates) {
    const issueDate = printableDates.dataset.budgetPrintIssueDate?.trim() ?? "";
    const validUntil = printableDates.dataset.budgetPrintValidUntil?.trim() ?? "";
    const datesContent = document.createElement("div");
    datesContent.className = "flex flex-col gap-[4px] text-[12px] leading-4 text-[#0a0a0a]";

    datesContent.appendChild(
      createPrintTextElement("p", "text-[12px] leading-4 text-[#52525c]", "Sent on"),
    );
    datesContent.appendChild(
      createPrintTextElement(
        "p",
        "text-[12px] font-semibold leading-4 text-[#0a0a0a]",
        issueDate || "Sent on",
      ),
    );

    datesContent.appendChild(
      createPrintTextElement("p", "text-[12px] leading-4 text-[#52525c]", "Valid until"),
    );
    datesContent.appendChild(
      createPrintTextElement(
        "p",
        "text-[12px] font-semibold leading-4 text-[#0a0a0a]",
        validUntil || "Valid until",
      ),
    );

    printableDates.replaceChildren(datesContent);
  }

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-currency-header="true"]')
    .forEach((currencyHeader) => {
      const value = currencyHeader.dataset.budgetPrintCurrencyHeaderValue?.trim() ?? "";
      currencyHeader.replaceChildren(
        createPrintTextElement("span", "text-[14px] font-normal text-[#737373]", value),
      );
    });

  const printableClientSection = clonedSheet.querySelector<HTMLElement>(
    '[data-budget-print-client-section="true"]',
  );
  if (printableClientSection) {
    const companyName = printableClientSection.dataset.budgetPrintCompany?.trim() ?? "";
    const contactName = printableClientSection.dataset.budgetPrintContact?.trim() ?? "";
    const email = printableClientSection.dataset.budgetPrintEmail?.trim() ?? "";
    const hadCompanyReferenceBlock = Array.from(
      printableClientSection.querySelectorAll<HTMLParagraphElement>("p"),
    ).some((paragraph) =>
      BUDGET_COMPANY_REFERENCE_LINES.includes((paragraph.textContent ?? "").trim() as (typeof BUDGET_COMPANY_REFERENCE_LINES)[number]),
    );

    const clientContent = document.createElement("div");
    clientContent.className = hadCompanyReferenceBlock ? "flex flex-col gap-10" : "space-y-1 pl-2 text-[14px] leading-5";

    if (hadCompanyReferenceBlock) {
      const companyReferenceBlock = document.createElement("div");
      companyReferenceBlock.className = "flex min-h-[83px] flex-col gap-4 pl-2 text-[14px] text-[#0a0a0a]";
      BUDGET_COMPANY_REFERENCE_LINES.forEach((line) => {
        companyReferenceBlock.appendChild(
          createPrintTextElement("p", "leading-[17px] text-[#0a0a0a]", line),
        );
      });
      clientContent.appendChild(companyReferenceBlock);
    }

    const clientFields = document.createElement("div");
    clientFields.className = hadCompanyReferenceBlock ? "grid gap-1" : "space-y-1";

    if (contactName) {
      clientFields.appendChild(createPrintTextElement("p", "text-[#171717]", contactName));
    }
    if (email) {
      clientFields.appendChild(createPrintTextElement("p", "text-[#737373]", email));
    }
    if (companyName) {
      clientFields.appendChild(
        createPrintTextElement(
          "p",
          hadCompanyReferenceBlock ? "text-[#737373]" : "font-semibold text-[#0a0a0a]",
          companyName,
        ),
      );
    }

    if (clientFields.childElementCount > 0) {
      clientContent.appendChild(clientFields);
    }

    printableClientSection.replaceChildren(clientContent);
  }

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-summary="true"]')
    .forEach((summarySection) => {
      const notesField = summarySection.querySelector<HTMLElement>('[data-budget-print-notes-field="true"]');
      const notesColumn = summarySection.querySelector<HTMLElement>('[data-budget-print-notes-column="true"]');
      const notesValue = notesField?.dataset.budgetPrintNotes?.trim() ?? "";

      if (!notesValue && notesColumn) {
        notesColumn.remove();
        summarySection.style.display = "flex";
        summarySection.style.justifyContent = "flex-end";
        summarySection.style.alignItems = "flex-end";
      }
    });

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-notes-field="true"]')
    .forEach((notesField) => {
      const value = notesField.dataset.budgetPrintNotes?.trim() ?? "";
      notesField.replaceChildren(
        createPrintTextElement(
          "p",
          "whitespace-pre-wrap break-words text-[14px] leading-5 text-[#171717]",
          value,
        ),
      );
    });

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-invoice-tax-row="true"]')
    .forEach((taxRow) => {
      const label = taxRow.dataset.budgetPrintTaxLabel?.trim() ?? "Tax";
      const rate = taxRow.dataset.budgetPrintTaxRate?.trim() ?? "";
      const amount = taxRow.dataset.budgetPrintTaxAmount?.trim() ?? "";
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3";
      row.appendChild(
        createPrintTextElement(
          "span",
          "text-sm text-zinc-600",
          rate ? `${label} ${rate}%` : label,
        ),
      );
      row.appendChild(
        createPrintTextElement(
          "span",
          `text-right text-sm text-[#171717] tabular-nums ${budgetNumericFontClass}`,
          amount,
        ),
      );
      taxRow.replaceChildren(row);
    });

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-concept-field="true"]')
    .forEach((conceptField) => {
      const value = conceptField.dataset.budgetPrintValue?.trim() ?? "";
      conceptField.replaceChildren(
        createPrintTextElement(
          "div",
          "pl-2 whitespace-pre-wrap break-words text-[14px] leading-5 text-[#171717]",
          value,
        ),
      );
    });

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-quantity-field="true"]')
    .forEach((quantityField) => {
      const value = quantityField.dataset.budgetPrintValue?.trim() ?? "";
      quantityField.replaceChildren(
        createPrintTextElement(
          "div",
          `text-left text-[14px] leading-5 text-[#0a0a0a] tabular-nums ${budgetNumericFontClass}`,
          value,
        ),
      );
    });

  clonedSheet
    .querySelectorAll<HTMLElement>('[data-budget-print-unit-price-field="true"]')
    .forEach((unitPriceField) => {
      const value = unitPriceField.dataset.budgetPrintValue?.trim() ?? "";
      unitPriceField.replaceChildren(
        createPrintTextElement(
          "div",
          `text-left text-[14px] leading-5 text-[#0a0a0a] tabular-nums ${budgetNumericFontClass}`,
          value,
        ),
      );
    });
}

function copyFormControlState(sourceSheet: HTMLElement, clonedSheet: HTMLElement): void {
  const sourceControls = sourceSheet.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );
  const clonedControls = clonedSheet.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );

  sourceControls.forEach((sourceControl, index) => {
    const clonedControl = clonedControls[index];
    if (!clonedControl) return;

    if (sourceControl instanceof HTMLInputElement && clonedControl instanceof HTMLInputElement) {
      if (sourceControl.type === "file") {
        clonedControl.remove();
        return;
      }
      clonedControl.value = sourceControl.value;
      clonedControl.setAttribute("value", sourceControl.value);
      clonedControl.checked = sourceControl.checked;
      if (sourceControl.checked) {
        clonedControl.setAttribute("checked", "checked");
      } else {
        clonedControl.removeAttribute("checked");
      }
      return;
    }

    if (sourceControl instanceof HTMLTextAreaElement && clonedControl instanceof HTMLTextAreaElement) {
      clonedControl.value = sourceControl.value;
      clonedControl.textContent = sourceControl.value;
      return;
    }

    if (sourceControl instanceof HTMLSelectElement && clonedControl instanceof HTMLSelectElement) {
      clonedControl.value = sourceControl.value;
      Array.from(clonedControl.options).forEach((option) => {
        option.selected = option.value === sourceControl.value;
      });
    }
  });
}

function getPrintDocumentHeadMarkup(): string {
  return Array.from(document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>("style, link[rel='stylesheet']"))
    .map((node) => {
      if (node instanceof HTMLStyleElement) return node.outerHTML;
      return `<link rel="stylesheet" href="${node.href}">`;
    })
    .join("\n");
}

export function buildPrintableSheetsMarkup(
  sheetRoot: HTMLElement,
  options: { budgetNumericFontClass: string },
): string {
  const sheets = Array.from(sheetRoot.querySelectorAll<HTMLElement>('[id^="sheet-"]')).sort((left, right) => {
    const leftNumber = Number.parseInt(left.id.replace("sheet-", ""), 10);
    const rightNumber = Number.parseInt(right.id.replace("sheet-", ""), 10);
    return leftNumber - rightNumber;
  });

  return sheets
    .map((sheet) => {
      const clonedSheet = sheet.cloneNode(true) as HTMLElement;
      copyFormControlState(sheet, clonedSheet);
      normalizePrintableBudgetSheet(clonedSheet, options.budgetNumericFontClass);
      clonedSheet
        .querySelectorAll<HTMLElement>('[data-budget-print-hide="true"]')
        .forEach((element) => element.remove());
      clonedSheet.querySelectorAll('button[aria-label^="Center page"]').forEach((element) => element.remove());
      clonedSheet.querySelectorAll('input[type="file"]').forEach((element) => element.remove());
      return `<div class="pdf-export-sheet">${clonedSheet.outerHTML}</div>`;
    })
    .join("");
}

type BuildPrintWindowOptions = {
  orientation: BudgetSheetOrientation;
  sheetWidthPx: number;
};

export function buildPrintWindowHtml(
  title: string,
  sheetsMarkup: string,
  options: BuildPrintWindowOptions,
): string {
  const pageOrientation = options.orientation === "portrait" ? "portrait" : "landscape";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${getPrintDocumentHeadMarkup()}
    <style>
      :root {
        color-scheme: light;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      [data-pdf-export-root] {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: #ffffff;
      }

      .pdf-export-sheet {
        width: ${options.sheetWidthPx}px;
        break-after: page;
        page-break-after: always;
      }

      .pdf-export-sheet:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .pdf-export-sheet > * {
        margin: 0 !important;
      }

      .pdf-export-sheet [data-radix-popper-content-wrapper],
      .pdf-export-sheet [role="dialog"] {
        display: none !important;
      }

      .pdf-export-sheet button[aria-label^="Center page"] {
        display: none !important;
      }

      .pdf-export-sheet input,
      .pdf-export-sheet textarea,
      .pdf-export-sheet select,
      .pdf-export-sheet button {
        caret-color: transparent !important;
      }

      .pdf-export-sheet textarea {
        resize: none !important;
      }

      .pdf-export-sheet [data-budget-print-header] {
        display: grid !important;
        align-items: start !important;
        column-gap: 24px !important;
      }

      .pdf-export-sheet [data-budget-print-summary] {
        display: grid !important;
        align-items: end !important;
        column-gap: 24px !important;
      }

      .pdf-export-sheet [data-budget-print-subtotal="true"] {
        width: fit-content !important;
        margin-left: auto !important;
        justify-self: end !important;
        text-align: right !important;
      }

      .pdf-export-sheet [data-group-row="item"] {
        height: auto !important;
      }

      .pdf-export-sheet [data-group-row="item"] > td {
        vertical-align: top !important;
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }

      @page {
        size: A4 ${pageOrientation};
        margin: 0;
      }
    </style>
  </head>
  <body>
    <main data-pdf-export-root>
      ${sheetsMarkup}
    </main>
    <script>
      window.addEventListener("load", async () => {
        try {
          if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
          }
        } catch {}

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.focus();
            window.print();
          });
        });
      });

      window.addEventListener("afterprint", () => {
        window.close();
      });
    </script>
  </body>
</html>`;
}
