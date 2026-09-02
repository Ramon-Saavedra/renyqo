import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_OBJECTS } from "../data/mock";
import { ObjectSelectorMobile } from "./ObjectSelectorMobile";

const onSelect = vi.fn();

describe("ObjectSelectorMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the object count and available objects", () => {
    render(
      <ObjectSelectorMobile
        objects={MOCK_OBJECTS}
        totalCount={MOCK_OBJECTS.length}
        selectedId="obj-kreuzberg"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Meine Mietobjekte · 4")).not.toBeNull();
    expect(screen.getByText("2,5-Zimmer-Wohnung Kreuzberg")).not.toBeNull();
    expect(screen.getByText("4-Zimmer-Reihenhaus Karlshorst")).not.toBeNull();
  });

  it("renders every available object when more than five exist", () => {
    const baseObject = MOCK_OBJECTS[0];
    if (!baseObject) throw new Error("Expected a dashboard object fixture");

    const objects = [
      ...MOCK_OBJECTS,
      {
        ...baseObject,
        id: "obj-fifth",
        title: "Fünftes Mietobjekt",
      },
      {
        ...baseObject,
        id: "obj-sixth",
        title: "Sechstes Mietobjekt",
      },
    ];

    render(
      <ObjectSelectorMobile
        objects={objects}
        totalCount={objects.length}
        selectedId="obj-kreuzberg"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Fünftes Mietobjekt")).not.toBeNull();
    expect(screen.getByText("Sechstes Mietobjekt")).not.toBeNull();
  });

  it("shows authoritative ACTIVE counts for unselected listings", () => {
    render(
      <ObjectSelectorMobile
        objects={MOCK_OBJECTS}
        totalCount={MOCK_OBJECTS.length}
        selectedId="obj-kreuzberg"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("3 / 5 aktiv")).not.toBeNull();
    expect(screen.getByText("5 / 5 aktiv")).not.toBeNull();
    expect(screen.getByText("2 / 5 aktiv")).not.toBeNull();
    expect(screen.getByText("0 / 5 aktiv")).not.toBeNull();
  });

  it("marks the selected object as pressed", () => {
    render(
      <ObjectSelectorMobile
        objects={MOCK_OBJECTS}
        totalCount={MOCK_OBJECTS.length}
        selectedId="obj-kreuzberg"
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /2,5-Zimmer-Wohnung Kreuzberg/i,
        pressed: true,
      }),
    ).not.toBeNull();
  });

  it("emits the selected object id", async () => {
    const user = userEvent.setup();
    render(
      <ObjectSelectorMobile
        objects={MOCK_OBJECTS}
        totalCount={MOCK_OBJECTS.length}
        selectedId="obj-kreuzberg"
        onSelect={onSelect}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /3-Zimmer-Altbau Prenzlauer Berg/i,
      }),
    );

    expect(onSelect).toHaveBeenCalledWith("obj-prenzlberg");
  });

  it("renders an empty state when no objects match", () => {
    render(
      <ObjectSelectorMobile
        objects={[]}
        totalCount={MOCK_OBJECTS.length}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Keine Objekte gefunden.")).not.toBeNull();
  });
});
