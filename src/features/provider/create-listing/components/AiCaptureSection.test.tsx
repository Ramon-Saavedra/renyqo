import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import type { ListingExtractionResult } from "@/lib/api/listing-assistance";
import { AiCaptureSection } from "./AiCaptureSection";

vi.mock("@/lib/api/listing-assistance", () => ({
  extractListingFromText: vi.fn(),
  extractListingFromPdf: vi.fn(),
  extractListingFromAudio: vi.fn(),
}));

import {
  extractListingFromPdf,
  extractListingFromText,
} from "@/lib/api/listing-assistance";

function pdfFile(name = "expose.pdf"): File {
  return new File(["%PDF-1.4 test"], name, { type: "application/pdf" });
}

function getPdfInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error("pdf file input not found");
  return input as HTMLInputElement;
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /Immobilie mit KI erfassen/i }),
  );
}

describe("AiCaptureSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts closed and opens the panel on click, with the PDF tab active", async () => {
    const user = userEvent.setup();
    render(<AiCaptureSection setField={vi.fn()} />);

    expect(
      screen.queryByRole("heading", { name: "Immobilie mit KI erfassen" }),
    ).toBeNull();

    await openPanel(user);

    expect(
      screen.getByRole("heading", { name: "Immobilie mit KI erfassen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("radio", { name: "PDF" }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("closes the panel and resets to input state", async () => {
    const user = userEvent.setup();
    render(<AiCaptureSection setField={vi.fn()} />);

    await openPanel(user);
    await user.click(
      screen.getByRole("button", { name: /KI-Erfassung schließen/i }),
    );

    expect(
      screen.getByRole("button", { name: /Immobilie mit KI erfassen/i }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("disables the PDF submit action until a valid file is picked", async () => {
    const user = userEvent.setup();
    render(<AiCaptureSection setField={vi.fn()} />);
    await openPanel(user);

    expect(
      screen.queryByRole("button", { name: "Angaben erkennen" }),
    ).toBeNull();

    await user.upload(getPdfInput(), pdfFile());

    const submitButton = screen.getByRole("button", {
      name: "Angaben erkennen",
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(false);
  });

  it("shows an inline error for a non-PDF file without calling the API", async () => {
    const user = userEvent.setup();
    render(<AiCaptureSection setField={vi.fn()} />);
    await openPanel(user);

    const textFile = new File(["hi"], "notes.txt", { type: "text/plain" });
    const input = getPdfInput();
    Object.defineProperty(input, "files", { value: [textFile] });
    fireEvent.change(input);

    expect(
      await screen.findByText(
        "Diese Datei ist kein lesbares PDF. Bitte lade das Exposé als PDF hoch.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(extractListingFromPdf).not.toHaveBeenCalled();
  });

  it("runs the PDF extraction, renders the result and applies it to the draft", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();
    const response: ListingExtractionResult = {
      values: { city: "Berlin", zip: "10115", coldRent: 1200 },
      requiredMissingFields: ["street"],
      recommendedMissingFields: [],
      inconsistencies: [],
      warnings: [],
    };
    vi.mocked(extractListingFromPdf).mockResolvedValue(response);

    render(<AiCaptureSection setField={setField} />);
    await openPanel(user);
    await user.upload(getPdfInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: "Angaben erkennen" }));

    expect(await screen.findByText("Angaben erkannt")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("Straße")).toBeInstanceOf(HTMLElement);

    await user.click(
      screen.getByRole("button", { name: "Ins Formular übernehmen" }),
    );

    expect(setField).toHaveBeenCalledWith("city", "Berlin");
    expect(setField).toHaveBeenCalledWith("zip", "10115");
    expect(setField).toHaveBeenCalledWith("price", "1200");
    expect(screen.getByText("Angaben übertragen")).toBeInstanceOf(HTMLElement);
  });

  it("renders the current backend contract and maps NOT_ALLOWED when applied", async () => {
    const user = userEvent.setup();
    const setField = vi.fn();
    vi.mocked(extractListingFromPdf).mockResolvedValue({
      values: {
        objectType: "HOUSE",
        city: "Berlin",
        zip: "44444",
        street: "Rabenstraße",
        livingArea: 100,
        rooms: 5,
        bedrooms: 3,
        coldRent: 1000,
        availableFrom: "2027-01-20",
        minimumHouseholdNetIncome: 3000,
        incomeProofRequired: true,
        suitableForPeopleCount: 2,
        petsPolicy: "NOT_ALLOWED",
        smokingPolicy: "NON_SMOKERS_PREFERRED",
      },
      requiredMissingFields: [],
      recommendedMissingFields: ["schufaRequired"],
      inconsistencies: [],
      warnings: [],
    });

    render(<AiCaptureSection setField={setField} />);
    await openPanel(user);
    await user.upload(getPdfInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: "Angaben erkennen" }));

    expect(await screen.findByText("SCHUFA-Anforderung")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByText(/Alle Pflichtangaben sind vollständig/),
    ).toBeInstanceOf(HTMLElement);

    await user.click(
      screen.getByRole("button", { name: "Ins Formular übernehmen" }),
    );

    expect(setField).toHaveBeenCalledWith("pets", "keine");
  });

  it("renders required and recommended gaps together", async () => {
    const user = userEvent.setup();
    vi.mocked(extractListingFromPdf).mockResolvedValue({
      values: {
        objectType: "HOUSE",
        city: "Berlin",
        zip: "44444",
        street: "Rabenstraße",
        livingArea: 100,
        rooms: 5,
        bedrooms: 3,
        coldRent: 1000,
        availableFrom: "2027-01-20",
        minimumHouseholdNetIncome: 3000,
        incomeProofRequired: true,
        suitableForPeopleCount: 2,
        petsPolicy: "NOT_ALLOWED",
        smokingPolicy: "NON_SMOKERS_PREFERRED",
      },
      requiredMissingFields: ["title"],
      recommendedMissingFields: ["schufaRequired"],
      inconsistencies: [],
      warnings: [],
    });

    render(<AiCaptureSection setField={vi.fn()} />);
    await openPanel(user);
    await user.upload(getPdfInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: "Angaben erkennen" }));

    expect(await screen.findByText("Objekttitel")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("SCHUFA-Anforderung")).toBeInstanceOf(HTMLElement);
  });

  it("surfaces a rate-limit message and allows retrying", async () => {
    const user = userEvent.setup();
    vi.mocked(extractListingFromText).mockRejectedValue(
      new ApiError(429, "Too Many Requests"),
    );

    render(<AiCaptureSection setField={vi.fn()} />);
    await openPanel(user);
    await user.click(screen.getByRole("radio", { name: "Text" }));
    await user.type(
      screen.getByPlaceholderText(/Zimmer-Wohnung in Freiburg/i),
      "3-Zimmer-Wohnung in Freiburg, 82 m², 1.450 € Kaltmiete, verfügbar sofort.",
    );
    await user.click(screen.getByRole("button", { name: "Angaben erkennen" }));

    await waitFor(() => {
      expect(screen.getByText("Zu viele Anfragen")).toBeInstanceOf(HTMLElement);
    });

    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(
      screen.getByRole("button", { name: "Angaben erkennen" }),
    ).toBeInstanceOf(HTMLElement);
  });
});
