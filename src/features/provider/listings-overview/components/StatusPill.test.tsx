import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusPill } from "./StatusPill";

describe("StatusPill", () => {
  it("renders the German label for each status", () => {
    const cases = [
      { status: "published", label: "Aktiv" },
      { status: "draft", label: "Entwurf" },
      { status: "paused", label: "Pausiert" },
      { status: "rented", label: "Vermietet" },
      { status: "archived", label: "Archiviert" },
    ] as const;

    for (const { status, label } of cases) {
      const { unmount } = render(<StatusPill status={status} />);
      expect(screen.getByText(label)).toBeInstanceOf(HTMLElement);
      unmount();
    }
  });

  it("applies the matching pill color class for published", () => {
    render(<StatusPill status="published" />);
    const pill = screen.getByText("Aktiv");
    expect(pill.className).toContain("text-primary");
  });

  it("applies the success color class for rented", () => {
    render(<StatusPill status="rented" />);
    const pill = screen.getByText("Vermietet");
    expect(pill.className).toContain("text-success");
  });

  it("appends an additional className when provided", () => {
    render(<StatusPill status="draft" className="custom-token" />);
    const pill = screen.getByText("Entwurf");
    expect(pill.className).toContain("custom-token");
  });
});