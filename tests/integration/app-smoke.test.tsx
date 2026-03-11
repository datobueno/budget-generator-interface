import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "@/App";

describe("App smoke", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { USD: 1.08, GBP: 0.86 } }),
      }),
    );
  });

  it("renders the quote editor shell", async () => {
    render(<App />);

    expect(
      await screen.findByRole("button", { name: /switch to vertical layout/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contact person/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^company$/i)).toBeInTheDocument();
  });
});
