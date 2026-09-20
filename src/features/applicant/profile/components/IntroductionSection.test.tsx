import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  APPLICANT_INTRODUCTION_MAX_LENGTH,
  INITIAL_PROFILE,
  type ApplicantProfileDraft,
} from "../utils/profile-validation";
import { IntroductionSection } from "./IntroductionSection";

function StatefulIntroductionSection({
  initialDraft = INITIAL_PROFILE,
}: {
  initialDraft?: ApplicantProfileDraft;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const setField = <K extends keyof ApplicantProfileDraft>(
    field: K,
    value: ApplicantProfileDraft[K],
  ) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  return <IntroductionSection draft={draft} setField={setField} />;
}

describe("IntroductionSection", () => {
  it("renders the existing introduction and its counter", () => {
    render(
      <IntroductionSection
        draft={{ ...INITIAL_PROFILE, introduction: "Bereits eingetragen." }}
        setField={vi.fn()}
      />,
    );

    const textbox = screen.getByRole("textbox");
    expect(textbox instanceof HTMLTextAreaElement).toBe(true);
    if (textbox instanceof HTMLTextAreaElement) {
      expect(textbox.value).toBe("Bereits eingetragen.");
    }
    expect(
      screen.getByText(`20/${APPLICANT_INTRODUCTION_MAX_LENGTH}`),
    ).toBeInstanceOf(HTMLElement);
  });

  it("updates the value and counter while typing", async () => {
    const user = userEvent.setup();
    render(<StatefulIntroductionSection />);

    await user.type(screen.getByRole("textbox"), "Hallo");

    expect(
      screen.getByText(`5/${APPLICANT_INTRODUCTION_MAX_LENGTH}`),
    ).toBeInstanceOf(HTMLElement);

    expect(screen.getByRole("textbox").getAttribute("maxlength")).toBe(
      String(APPLICANT_INTRODUCTION_MAX_LENGTH),
    );
  });

  it("renders the friendly guidance", () => {
    render(<IntroductionSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea.getAttribute("aria-describedby")).toBeNull();
    expect(document.getElementById("applicant-introduction-error")).toBeNull();
    expect(
      screen.getByText("Erzähl uns etwas Lustiges über dich oder euch"),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the final German copy", () => {
    render(<IntroductionSection draft={INITIAL_PROFILE} setField={vi.fn()} />);

    expect(screen.getByText("03 · PERSÖNLICH")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText("Ein paar Worte über dich oder euch"),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByText(
        "Ein persönlicher Eindruck hilft Anbietern, euch ein wenig kennenzulernen.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Ein paar Worte")).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByPlaceholderText(
        "Was möchtest du über dich oder euch erzählen?",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("replaces the helper with the validation error", () => {
    render(
      <IntroductionSection
        draft={INITIAL_PROFILE}
        setField={vi.fn()}
        error="Bitte erzähl uns kurz etwas über dich oder euch."
      />,
    );

    const textarea = screen.getByRole("textbox");
    const error = screen.getByRole("alert");
    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(textarea.getAttribute("aria-describedby")).toBe(
      "applicant-introduction-error",
    );
    expect(error.getAttribute("id")).toBe("applicant-introduction-error");
    expect(error.textContent).toContain(
      "Bitte erzähl uns kurz etwas über dich oder euch.",
    );
    expect(
      screen.queryByText("Erzähl uns etwas Lustiges über dich oder euch"),
    ).toBeNull();
  });
});
