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
  activeApplicationsCount: 5,
  coverImageUrl: null,
};

const draftObject: DashboardObject = {
  ...publishedObject,
  id: "object-draft",
  title: "Entwurf Hamburg",
  fullTitle: "Entwurf Hamburg Altona",
  district: "Hamburg-Altona",
  status: "draft",
  activeApplicationsCount: 0,
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

  it("renders published object details and authoritative ACTIVE count", () => {
    renderItem(publishedObject);

    expect(screen.getByText("Wohnung Mitte")).not.toBeNull();
    expect(screen.getByText("Torstraße 1, 10119 Berlin")).not.toBeNull();
    expect(screen.getByText("Kaltmiete")).not.toBeNull();
    expect(screen.getByText("900 €")).not.toBeNull();
    expect(screen.getByText("Veröffentlicht")).not.toBeNull();
    expect(screen.getByText("Bewerbungen")).not.toBeNull();
    expect(screen.getByText("5 / 5 aktiv")).not.toBeNull();
    const shareButton = screen.getByRole("button", { name: "Objekt teilen" });
    expect(shareButton.className).toContain("bg-transparent");
    expect(shareButton.className).toContain("hover:bg-primary-tint");
  });

  it("does not render a progress bar for applications", () => {
    renderItem(publishedObject);

    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("renders zero ACTIVE applications for unselected listings", () => {
    renderItem({ ...publishedObject, activeApplicationsCount: 0 });

    expect(screen.getByText("0 / 5 aktiv")).not.toBeNull();
  });

  it("keeps long titles on one truncated line", () => {
    const longTitle =
      "Sehr lange Wohnungsbezeichnung für ein außergewöhnlich großes Mietobjekt";
    renderItem({ ...publishedObject, title: longTitle });

    expect(screen.getByText(longTitle).classList.contains("truncate")).toBe(
      true,
    );
  });

  it("renders the cover image inside the card without replacing application count", () => {
    renderItem({
      ...publishedObject,
      coverImageUrl: "https://res.cloudinary.com/demo/image/upload/flat.jpg",
    });

    const image = document.querySelector("img");
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image?.getAttribute("src")).toContain("flat.jpg");
    expect(screen.getByText("Bewerbungen")).not.toBeNull();
    expect(screen.getByText("5 / 5 aktiv")).not.toBeNull();
  });

  it("lets card selection receive clicks through the thumbnail layer", () => {
    const { container } = render(
      <ul>
        <ObjectSidebarItem
          object={{
            ...publishedObject,
            coverImageUrl:
              "https://res.cloudinary.com/demo/image/upload/flat.jpg",
          }}
          selected={false}
          shareUrl="https://renyqo.test/objekt/object-published"
          onSelect={onSelect}
        />
      </ul>,
    );

    const body = container.querySelector("li > span.pointer-events-none");
    const image = container.querySelector("img");

    expect(body).toBeInstanceOf(HTMLElement);
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(
      screen
        .getByRole("button", { name: /Wohnung Mitte/i })
        .className.includes("z-10"),
    ).toBe(true);
  });

  it("keeps the application count from shrinking away", () => {
    renderItem(publishedObject);

    const count = screen.getByText("5 / 5 aktiv");
    expect(count.className).toContain("shrink-0");
    expect(count.className).toContain("whitespace-nowrap");
  });

  it("applies the elevated dark hover shadow token on the card", () => {
    renderItem(publishedObject);

    const card = screen.getByRole("button", {
      name: /Wohnung Mitte/i,
    }).parentElement;

    expect(card?.className).toContain("hover:shadow-card-hover");
    expect(card?.className).toContain("shadow-card");
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

  it("uses an inverse transparent hover for selected-item sharing", () => {
    renderItem(publishedObject, true);

    const shareButton = screen.getByRole("button", { name: "Objekt teilen" });
    expect(shareButton.className).toContain("bg-transparent");
    expect(shareButton.className).toContain("hover:bg-primary-foreground/20");
  });

  it("uses the same ACTIVE source for selected and unselected cards", () => {
    const { rerender } = render(
      <ul>
        <ObjectSidebarItem
          object={publishedObject}
          selected={false}
          shareUrl="https://renyqo.test/objekt/object-published"
          onSelect={onSelect}
        />
      </ul>,
    );

    expect(screen.getByText("5 / 5 aktiv")).not.toBeNull();

    rerender(
      <ul>
        <ObjectSidebarItem
          object={publishedObject}
          selected={true}
          shareUrl="https://renyqo.test/objekt/object-published"
          onSelect={onSelect}
        />
      </ul>,
    );

    expect(screen.getByText("5 / 5 aktiv")).not.toBeNull();
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

  it("renders draft state with ACTIVE count and without share actions", () => {
    renderItem(draftObject);

    expect(screen.getByText("Entwurf Hamburg")).not.toBeNull();
    expect(screen.getByText("Entwurf")).not.toBeNull();
    expect(screen.getByText("0 / 5 aktiv")).not.toBeNull();
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
