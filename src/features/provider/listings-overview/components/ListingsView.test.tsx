import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { ListingOverviewItem } from "../types";
import { ListingsView } from "./ListingsView";

const NOW = new Date("2026-05-22T15:00:00");

const SAMPLE: readonly ListingOverviewItem[] = [
  {
    id: "a",
    title: "Helle 3-Zimmer Altbauwohnung",
    displayAddress: "Schönhauser Allee 142 · Berlin, Prenzlauer Berg · 10437",
    coldRent: 1480,
    livingArea: 84,
    rooms: 3,
    applicationsTotal: 2,
    openQuestionsCount: 0,
    status: "published",
    needsAttention: false,
    attentionReason: null,
    createdAt: "2026-03-14",
    updatedAt: "2026-05-22T14:00:00",
    publishedAt: "2026-03-15T10:00:00",
  },
  {
    id: "b",
    title: "Modernes Loft",
    displayAddress: "Friedrichstraße 88 · Hamburg, Altona · 22765",
    coldRent: 2150,
    livingArea: 112,
    rooms: 4,
    applicationsTotal: 4,
    openQuestionsCount: 1,
    status: "published",
    needsAttention: true,
    attentionReason: "open_questions",
    createdAt: "2026-04-08",
    updatedAt: "2026-05-20T10:00:00",
    publishedAt: "2026-04-09T08:00:00",
  },
  {
    id: "c",
    title: "Entwurf Studio",
    displayAddress: "Brüderstraße 8 · Leipzig, Zentrum-Süd · 04103",
    coldRent: 680,
    livingArea: 32,
    rooms: 1,
    applicationsTotal: 0,
    openQuestionsCount: 0,
    status: "draft",
    needsAttention: false,
    attentionReason: null,
    createdAt: "2026-05-19",
    updatedAt: "2026-05-19T22:10:00",
    publishedAt: null,
  },
  {
    id: "d",
    title: "Penthouse mit Rheinblick",
    displayAddress: "Konrad-Adenauer-Ufer 22 · Düsseldorf, Altstadt · 40213",
    coldRent: 3450,
    livingArea: 168,
    rooms: 5,
    applicationsTotal: 5,
    openQuestionsCount: 0,
    status: "rented",
    needsAttention: false,
    attentionReason: null,
    createdAt: "2026-01-15",
    updatedAt: "2026-05-08T12:00:00",
    publishedAt: "2026-01-16T10:00:00",
  },
];

function renderView(listings: readonly ListingOverviewItem[] = SAMPLE) {
  return render(<ListingsView initialListings={listings} now={NOW} />);
}

describe("ListingsView", () => {
  it("renders all initial listings", () => {
    renderView();
    for (const item of SAMPLE) {
      expect(screen.getByText(item.title)).toBeInstanceOf(HTMLElement);
    }
  });

  it("shows the count per status in the filter", () => {
    renderView();
    const filterGroup = screen.getByRole("radiogroup", {
      name: "Statusfilter",
    });

    expect(
      within(filterGroup).getByRole("radio", { name: /Alle/ }).textContent,
    ).toContain(String(SAMPLE.length));
    expect(
      within(filterGroup).getByRole("radio", { name: /Aktiv/ }).textContent,
    ).toContain("2");
    expect(
      within(filterGroup).getByRole("radio", { name: /Entwürfe/ }).textContent,
    ).toContain("1");
    expect(
      within(filterGroup).getByRole("radio", { name: /Vermietet/ }).textContent,
    ).toContain("1");
    expect(
      screen.getByRole("radio", { name: /Klärung nötig/ }).textContent,
    ).toContain("1");
  });

  it("filters by status when the user clicks a filter button", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("radio", { name: /Entwürfe/ }));

    expect(screen.getByText("Entwurf Studio")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Helle 3-Zimmer Altbauwohnung")).toBeNull();
    expect(screen.queryByText("Penthouse mit Rheinblick")).toBeNull();
  });

  it("filters by needsAttention when the Klärung nötig filter is active", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("radio", { name: /Klärung nötig/ }));

    expect(screen.getByText("Modernes Loft")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Helle 3-Zimmer Altbauwohnung")).toBeNull();
  });

  it("matches by title or displayAddress in the search input", async () => {
    const user = userEvent.setup();
    renderView();
    const input = screen.getByLabelText("Mietobjekte durchsuchen");

    await user.type(input, "Hamburg");
    expect(screen.getByText("Modernes Loft")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Helle 3-Zimmer Altbauwohnung")).toBeNull();

    await user.clear(input);
    await user.type(input, "10437");
    expect(screen.getByText("Helle 3-Zimmer Altbauwohnung")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.queryByText("Modernes Loft")).toBeNull();
  });

  it("shows a filtered empty state when no listings match", async () => {
    const user = userEvent.setup();
    renderView();
    const input = screen.getByLabelText("Mietobjekte durchsuchen");

    await user.type(input, "zzzz-no-match");

    expect(screen.getByText("Keine Objekte für diese Filter.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("resets filters when the user presses the empty-state reset", async () => {
    const user = userEvent.setup();
    renderView();
    const input = screen.getByLabelText("Mietobjekte durchsuchen");

    await user.type(input, "zzzz-no-match");
    await user.click(
      screen.getByRole("button", { name: "Filter zurücksetzen" }),
    );

    for (const item of SAMPLE) {
      expect(screen.getByText(item.title)).toBeInstanceOf(HTMLElement);
    }
  });

  it("shows a fresh empty state when there are no listings at all", () => {
    renderView([]);

    expect(screen.getByText("Noch keine Mietobjekte angelegt.")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows the archived-only empty state when filter Aktiv yields zero but archive exists", async () => {
    const user = userEvent.setup();
    const onlyInactive: readonly ListingOverviewItem[] = SAMPLE.filter(
      (l) => l.status === "rented" || l.status === "archived",
    );

    renderView(onlyInactive);

    await user.click(screen.getByRole("radio", { name: /Aktiv/ }));

    expect(
      screen.getByText("Du hast aktuell keine aktiven Mietobjekte."),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("button", { name: "Alle Objekte anzeigen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("marks a listing as paused when the row action is invoked", async () => {
    const user = userEvent.setup();
    renderView();

    const row = screen
      .getByText("Helle 3-Zimmer Altbauwohnung")
      .closest("article");
    expect(row).not.toBeNull();
    if (!row) return;

    const trigger = within(row as HTMLElement).getByRole("button", {
      name: "Aktionen",
    });
    await user.click(trigger);

    await user.click(screen.getByRole("menuitem", { name: /Pausieren/ }));

    expect(within(row as HTMLElement).getByText("Pausiert")).toBeInstanceOf(
      HTMLElement,
    );
  });
});
