import { describe, expect, it } from "vitest";

import { inferCompanyFromEmail } from "@/entities/client";

describe("inferCompanyFromEmail", () => {
  it("returns a title-cased company name for business domains", () => {
    expect(inferCompanyFromEmail("team@datobueno.com")).toBe("Datobueno");
    expect(inferCompanyFromEmail("ops@acme-studio.co.uk")).toBe("Acme Studio");
  });

  it("ignores personal email providers", () => {
    expect(inferCompanyFromEmail("foo@gmail.com")).toBe("");
    expect(inferCompanyFromEmail("bar@outlook.com")).toBe("");
  });
});
