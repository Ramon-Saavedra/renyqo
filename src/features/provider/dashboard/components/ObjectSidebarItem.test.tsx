import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ObjectSidebarItem } from "./ObjectSidebarItem";
import type { DashboardObject } from "../types";

const onSelect = vi.fn();

const publishedObject: DashboardObject = {
  id: "object-published",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte Berlin",
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
    expect(screen.getByText("900 € kalt")).not.toBeNull();
    expect(screen.getByText("Veröffentlicht")).not.toBeNull();
    expect(screen.getByText("3 / 5 aktive Bewerbungen")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Objekt teilen" }),
    ).not.toBeNull();
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

  it("renders draft state without share actions", () => {
    renderItem(draftObject);

    expect(screen.getByText("Entwurf Hamburg")).not.toBeNull();
    expect(screen.getByText("Entwurf")).not.toBeNull();
    expect(screen.getByText("Noch nicht veröffentlicht")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Objekt teilen" })).toBeNull();
  });

  it("shows the share action when not selected", () => {
    renderItem(publishedObject, false);

    expect(
      screen.getByRole("button", { name: "Objekt teilen" }),
    ).not.toBeNull();
  });
});
