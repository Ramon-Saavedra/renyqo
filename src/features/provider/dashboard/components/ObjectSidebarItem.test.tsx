import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ObjectSidebarItem } from "./ObjectSidebarItem";
import { MAX_ACTIVE_APPLICATIONS, type DashboardObject } from "../types";

const onSelect = vi.fn();

const publishedObject: DashboardObject = {
  id: "object-published",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte Berlin",
  objectType: null,
  district: "Berlin-Mitte",
  address: "Torstraße 1, 10119 Berlin",
  coldRent: 900,
  livingArea: 60,
  rooms: "2",
  availableFrom: "01.08.2026",
  publishedAt: "02.07.2026, 13:00",
  updatedAt: "02.07.2026, 12:00",
  status: "published",
  activeApplications: 3,
};

const draftObject: DashboardObject = {
  ...publishedObject,
  id: "object-draft",
  title: "Entwurf Hamburg",
  fullTitle: "Entwurf Hamburg Altona",
  district: "Hamburg-Altona",
  status: "draft",
  activeApplications: 0,
};

function renderItem(object: DashboardObject, selected = false) {
  render(
    <ul>
      <ObjectSidebarItem
        object={object}
        selected={selected}
        shareUrl={`https://renyqo.test/objekt/${object.id}`}
        onSelect={onSelect}
      />
    </ul>,
  );
}

describe("ObjectSidebarItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders published object details, application count, and share action", () => {
    renderItem(publishedObject);

    expect(screen.getByText("Wohnung Mitte")).not.toBeNull();
    expect(screen.getByText("Torstraße 1, 10119 Berlin")).not.toBeNull();
    expect(screen.getByText("Kaltmiete")).not.toBeNull();
    expect(screen.getByText("900 €")).not.toBeNull();
    expect(screen.getByText("Veröffentlicht")).not.toBeNull();
    expect(screen.getByText("Bewerbungen")).not.toBeNull();
    expect(
      screen.getByText(`3 / ${MAX_ACTIVE_APPLICATIONS}`),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Objekt teilen" }),
    ).not.toBeNull();
  });

  it("exposes the application progress as a progressbar", () => {
    renderItem(publishedObject);

    const progress = screen.getByRole("progressbar", {
      name: `3 / ${MAX_ACTIVE_APPLICATIONS} aktive Bewerbungen`,
    });

    expect(progress.getAttribute("aria-valuenow")).toBe("3");
    expect(progress.getAttribute("aria-valuemax")).toBe(
      String(MAX_ACTIVE_APPLICATIONS),
    );
    expect((progress.firstElementChild as HTMLElement | null)?.style.width).toBe(
      `${(3 / MAX_ACTIVE_APPLICATIONS) * 100}%`,
    );
  });

  it("renders an empty progress bar without applications", () => {
    renderItem({ ...publishedObject, activeApplications: 0 });

    expect(
      screen.getByText(`0 / ${MAX_ACTIVE_APPLICATIONS}`),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("progressbar", {
          name: `0 / ${MAX_ACTIVE_APPLICATIONS} aktive Bewerbungen`,
        })
        .getAttribute("aria-valuenow"),
    ).toBe("0");
  });

  it("keeps long titles on one truncated line", () => {
    const longTitle =
      "Sehr lange Wohnungsbezeichnung für ein außergewöhnlich großes Mietobjekt";
    renderItem({ ...publishedObject, title: longTitle });

    expect(screen.getByText(longTitle).classList.contains("truncate")).toBe(true);
  });

  it("marks the selected object with aria-pressed", () => {
    renderItem(publishedObject, true);

    expect(
      screen.getByRole("button", {
        name: /Wohnung Mitte/i,
        pressed: true,
      }),
    ).not.toBeNull();
  });

  it("emits the object id when selected", async () => {
    const user = userEvent.setup();
    renderItem(publishedObject);

    await user.click(screen.getByRole("button", { name: /Wohnung Mitte/i }));

    expect(onSelect).toHaveBeenCalledWith("object-published");
  });

  it("selects the card with the keyboard", async () => {
    const user = userEvent.setup();
    renderItem(publishedObject);

    const selectButton = screen.getByRole("button", { name: /Wohnung Mitte/i });
    selectButton.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("object-published");
  });

  it("renders draft state without share actions", () => {
    renderItem(draftObject);

    expect(screen.getByText("Entwurf Hamburg")).not.toBeNull();
    expect(screen.getByText("Entwurf")).not.toBeNull();
    expect(screen.getByText("Noch nicht veröffentlicht")).not.toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("button", { name: "Objekt teilen" })).toBeNull();
  });

  it("shows the share action when not selected", () => {
    renderItem(publishedObject, false);

    expect(
      screen.getByRole("button", { name: "Objekt teilen" }),
    ).not.toBeNull();
  });

  it("does not select the object when sharing", async () => {
    const user = userEvent.setup();
    renderItem(publishedObject);

    await user.click(screen.getByRole("button", { name: "Objekt teilen" }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
