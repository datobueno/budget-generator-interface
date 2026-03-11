import { describe, expect, it } from "vitest";

import { getCustomerFacingErrorToast } from "@/shared/lib/customer-facing-errors";

describe("customer-facing error mapping", () => {
  it("maps Google provider errors to normalized customer copy", () => {
    expect(
      getCustomerFacingErrorToast(
        new Error("Google Sheets API returned error 400: backend issue"),
        "googleSheets",
      ),
    ).toEqual({
      title: "Google returned an error while loading the spreadsheet.",
      description: "Provider: Retry.",
    });
  });

  it("maps spreadsheet file validation errors to actionable copy", () => {
    expect(
      getCustomerFacingErrorToast(new Error("The file is empty."), "quoteImport"),
    ).toEqual({
      title: "The file is empty.",
      description: "Action: Review the file.",
    });
  });
});
