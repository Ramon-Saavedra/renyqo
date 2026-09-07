import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { reportListing } from "../../api/listing-report";
import type * as listingReportApi from "../../api/listing-report";
import { ListingReportAction } from "./ListingReportAction";

vi.mock("../../api/listing-report", async (importOriginal) => {
  const actual = await importOriginal<typeof listingReportApi>();
  return {
    ...actual,
    reportListing: vi.fn(),
  };
});

const created = {
  id: "report-1",
  listingId: "listing-1",
  reason: "MISLEADING_INFO" as const,
  createdAt: "2026-09-06T10:00:00.000Z",
};

describe("ListingReportAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the report dialog from Melden", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));

    expect(
      screen.getByRole("dialog", { name: "Objekt melden" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("locks background scroll while the dialog is open", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    expect(document.body.style.overflow).toBe("hidden");

    const dialog = screen.getByRole("dialog", { name: "Objekt melden" });
    expect(dialog.className).toContain("max-h-full");
    expect(dialog.className).toContain("min-h-0");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(dialog.className).toContain("scrollbar-slim");

    await user.click(screen.getByRole("button", { name: "Schließen" }));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("styles report radios with design-system tokens and keeps native semantics", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));

    const radio = screen.getByRole("radio", {
      name: "Irreführende oder falsche Angaben",
    });
    expect(radio.getAttribute("type")).toBe("radio");
    expect(radio.className).toContain("appearance-none");
    expect(radio.className).toContain("rounded-full");
    expect(radio.className).toContain("border-border-strong");
    expect(radio.className).toContain("checked:bg-primary");
    expect(radio.className).toContain("focus-visible:shadow-focus");
  });

  it("makes the underlying page inert while the dialog is open", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    const trigger = screen.getByRole("button", { name: "Melden" });
    await user.click(trigger);

    expect(trigger.hasAttribute("inert")).toBe(true);
    expect(
      screen.getByRole("dialog", { name: "Objekt melden" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("dialog", { name: "Objekt melden" })
        .hasAttribute("inert"),
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: "Schließen" }));
    expect(trigger.hasAttribute("inert")).toBe(false);
    expect(screen.getByRole("button", { name: "Melden" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("requires detail for Sonstiges and does not submit", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Sonstiges"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(reportListing).not.toHaveBeenCalled();
    expect(screen.getByText("Bitte beschreibe den Grund.")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("submits a reason without optional detail", async () => {
    const user = userEvent.setup();
    vi.mocked(reportListing).mockResolvedValue(created);
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(
      screen.getByLabelText("Irreführende oder falsche Angaben"),
    );
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(reportListing).toHaveBeenCalledWith("listing-1", {
      reason: "MISLEADING_INFO",
    });
    expect((await screen.findByRole("status")).textContent).toBe(
      "Danke, wir haben deine Meldung erhalten.",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("blocks a duplicate submit while pending", async () => {
    const user = userEvent.setup();
    let resolveRequest: (() => void) | undefined;
    vi.mocked(reportListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(created);
      }),
    );
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Betrugsverdacht"));
    const submit = screen.getByRole("button", { name: "Meldung senden" });
    await user.click(submit);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    await user.click(submit);
    expect(reportListing).toHaveBeenCalledTimes(1);

    resolveRequest?.();
    expect(await screen.findByRole("status")).toBeInstanceOf(HTMLElement);
  });

  it("keeps the dialog open on a 409 duplicate", async () => {
    const user = userEvent.setup();
    vi.mocked(reportListing).mockRejectedValue(new ApiError(409, "conflict"));
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Diskriminierung"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(
      await screen.findByText("Du hast dieses Objekt bereits gemeldet."),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the dialog open on a 429 rate limit", async () => {
    const user = userEvent.setup();
    vi.mocked(reportListing).mockRejectedValue(
      new ApiError(429, "limited", "http", "LISTING_REPORT_RATE_LIMITED"),
    );
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Unangemessene Inhalte"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(
      await screen.findByText(
        "Du hast zu viele Meldungen gesendet. Bitte versuche es später erneut.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);
  });

  it("requires a reason before submitting", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(reportListing).not.toHaveBeenCalled();
    expect(screen.getByText("Bitte wähle einen Grund.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);
  });

  it("clears the reason error and aria-invalid after a reason is selected", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    const reasons = screen.getByRole("group", { name: "Grund" });
    expect(screen.getByText("Bitte wähle einen Grund.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(reasons.getAttribute("aria-invalid")).toBe("true");

    await user.click(
      screen.getByLabelText("Irreführende oder falsche Angaben"),
    );

    expect(screen.queryByText("Bitte wähle einen Grund.")).toBeNull();
    expect(reasons.getAttribute("aria-invalid")).not.toBe("true");
  });

  it("clears the detail error and textarea invalid state after valid detail is entered", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Sonstiges"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    const textarea = screen.getByRole("textbox");
    expect(screen.getByText("Bitte beschreibe den Grund.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(textarea.getAttribute("aria-invalid")).toBe("true");

    await user.type(textarea, "Kurzbeschreibung des Problems");

    expect(screen.queryByText("Bitte beschreibe den Grund.")).toBeNull();
    expect(textarea.getAttribute("aria-invalid")).toBeNull();
  });

  it("clears the detail error when switching away from Sonstiges", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Sonstiges"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    const textarea = screen.getByRole("textbox");
    expect(screen.getByText("Bitte beschreibe den Grund.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(textarea.getAttribute("aria-invalid")).toBe("true");

    await user.click(screen.getByLabelText("Betrugsverdacht"));

    expect(screen.queryByText("Bitte beschreibe den Grund.")).toBeNull();
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps the dialog open on a 401", async () => {
    const user = userEvent.setup();
    vi.mocked(reportListing).mockRejectedValue(new ApiError(401, "auth"));
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Doppeltes Inserat / Spam"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));

    expect(
      await screen.findByText("Bitte melde dich an, um ein Objekt zu melden."),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("closes on Escape and restores focus to Melden", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    const trigger = screen.getByRole("button", { name: "Melden" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Melden" }),
    );
  });

  it("does not close on Escape while the request is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest: (() => void) | undefined;
    vi.mocked(reportListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(created);
      }),
    );
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(screen.getByLabelText("Betrugsverdacht"));
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);

    resolveRequest?.();
    expect(await screen.findByRole("status")).toBeInstanceOf(HTMLElement);
  });

  it("traps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));

    const close = screen.getByRole("button", { name: "Schließen" });
    const submit = screen.getByRole("button", { name: "Meldung senden" });
    close.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(submit);
    await user.tab();
    expect(document.activeElement).toBe(close);
  });

  it("closes when the overlay is clicked and stays open when the panel is clicked", async () => {
    const user = userEvent.setup();
    render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    const dialog = screen.getByRole("dialog", { name: "Objekt melden" });
    await user.click(dialog);
    expect(screen.getByRole("dialog")).toBeInstanceOf(HTMLElement);

    fireEvent.click(dialog.parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clears success feedback when the listing id changes", async () => {
    const user = userEvent.setup();
    vi.mocked(reportListing).mockResolvedValue(created);
    const { rerender } = render(<ListingReportAction listingId="listing-1" />);

    await user.click(screen.getByRole("button", { name: "Melden" }));
    await user.click(
      screen.getByLabelText("Irreführende oder falsche Angaben"),
    );
    await user.click(screen.getByRole("button", { name: "Meldung senden" }));
    expect(await screen.findByRole("status")).toBeInstanceOf(HTMLElement);

    rerender(<ListingReportAction listingId="listing-2" />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
