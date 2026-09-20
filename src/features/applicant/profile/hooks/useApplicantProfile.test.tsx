import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_PROFILE } from "../utils/profile-validation";
import { useApplicantProfile } from "./useApplicantProfile";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

vi.mock("../api/applicant-profile", () => ({
  getApplicantProfile: vi.fn(),
  saveApplicantProfile: vi.fn(),
  getApplicantIntroductionValidationError: vi.fn(() => null),
}));

const api = await import("../api/applicant-profile");
const getApplicantProfile = vi.mocked(api.getApplicantProfile);
const saveApplicantProfile = vi.mocked(api.saveApplicantProfile);
const getApplicantIntroductionValidationError = vi.mocked(
  api.getApplicantIntroductionValidationError,
);

const VALID_PROFILE = {
  ...INITIAL_PROFILE,
  introduction: "Ich suche ein ruhiges Zuhause.",
};

function Harness() {
  const { save, saveStatus, loading, errors } = useApplicantProfile();

  return (
    <div>
      <span data-testid="status">{loading ? "loading" : saveStatus}</span>
      <span data-testid="introduction-error">{errors.introduction}</span>
      <button type="button" onClick={save}>
        save
      </button>
    </div>
  );
}

function status(): string {
  return screen.getByTestId("status").textContent ?? "";
}

async function renderHarness() {
  render(<Harness />);
  await waitFor(() => expect(status()).not.toBe("loading"));
  return screen.getByRole("button", { name: "save" });
}

describe("useApplicantProfile save flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    searchParams = new URLSearchParams();
    getApplicantProfile.mockResolvedValue(VALID_PROFILE);
    saveApplicantProfile.mockResolvedValue(undefined);
  });

  it("redirects to the listings root when no returnTo is given", async () => {
    const user = userEvent.setup();
    const button = await renderHarness();

    await user.click(button);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/listings"));
  });

  it("redirects to a safe returnTo below the listings root", async () => {
    searchParams = new URLSearchParams({ returnTo: "/listings/abc-123" });
    const user = userEvent.setup();
    const button = await renderHarness();

    await user.click(button);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/listings/abc-123"),
    );
  });

  it("falls back to the listings root for an external returnTo", async () => {
    searchParams = new URLSearchParams({ returnTo: "https://evil.com" });
    const user = userEvent.setup();
    const button = await renderHarness();

    await user.click(button);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/listings"));
  });

  it("leaves a one-time confirmation for the destination page", async () => {
    const user = userEvent.setup();
    const button = await renderHarness();

    await user.click(button);

    await waitFor(() =>
      expect(sessionStorage.getItem("renyqo.flash")).toBe(
        "Bewerbungsprofil gespeichert",
      ),
    );
  });

  it("sends a single request for rapid repeated clicks", async () => {
    let resolveSave: () => void = () => {};
    saveApplicantProfile.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const button = await renderHarness();

    await act(async () => {
      button.click();
      button.click();
      button.click();
    });

    expect(saveApplicantProfile).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
    });

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
  });

  it("does not save when the initial profile load fails", async () => {
    getApplicantProfile.mockRejectedValueOnce(new Error("load failed"));

    const button = await renderHarness();

    await userEvent.setup().click(button);

    expect(saveApplicantProfile).not.toHaveBeenCalled();
  });

  it("does not save a legacy profile until an introduction is provided", async () => {
    getApplicantProfile.mockResolvedValueOnce(INITIAL_PROFILE);
    const button = await renderHarness();

    await userEvent.setup().click(button);

    expect(saveApplicantProfile).not.toHaveBeenCalled();
  });

  it("stays on the page and re-enables saving after a failure", async () => {
    saveApplicantProfile.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    const button = await renderHarness();

    await user.click(button);

    await waitFor(() => expect(status()).toBe("error"));
    expect(replace).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("renyqo.flash")).toBeNull();

    saveApplicantProfile.mockResolvedValueOnce(undefined);
    await user.click(button);

    await waitFor(() => expect(saveApplicantProfile).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/listings"));
  });

  it("maps a backend introduction validation error to the field", async () => {
    getApplicantIntroductionValidationError.mockReturnValue("tooLong");
    saveApplicantProfile.mockRejectedValueOnce(new Error("raw backend detail"));
    const button = await renderHarness();

    await userEvent.setup().click(button);

    await waitFor(() =>
      expect(screen.getByTestId("introduction-error").textContent).toBe(
        "Dein Text darf höchstens 250 Zeichen lang sein.",
      ),
    );
    expect(screen.queryByText("raw backend detail")).toBeNull();
  });
});
