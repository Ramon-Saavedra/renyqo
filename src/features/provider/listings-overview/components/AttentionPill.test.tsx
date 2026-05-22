import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AttentionPill } from "./AttentionPill";

describe("AttentionPill", () => {
  it("renders role='img' with aria-label 'Rückfragen offen' for open_questions", () => {
    render(<AttentionPill reason="open_questions" />);
    expect(
      screen.getByRole("img", { name: "Rückfragen offen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders role='img' with aria-label 'Manuelle Prüfung' for manual_review", () => {
    render(<AttentionPill reason="manual_review" />);
    expect(
      screen.getByRole("img", { name: "Manuelle Prüfung" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders role='img' with aria-label 'Daten unvollständig' for missing_data", () => {
    render(<AttentionPill reason="missing_data" />);
    expect(
      screen.getByRole("img", { name: "Daten unvollständig" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("sets title attribute equal to the aria-label", () => {
    render(<AttentionPill reason="open_questions" />);
    const el = screen.getByRole("img", { name: "Rückfragen offen" });
    expect(el.getAttribute("title")).toBe("Rückfragen offen");
  });

  it("applies warning color class to the wrapper span", () => {
    const { container } = render(<AttentionPill reason="missing_data" />);
    const span = container.querySelector("[role='img']");
    expect(span?.className).toContain("text-warning");
  });
});
