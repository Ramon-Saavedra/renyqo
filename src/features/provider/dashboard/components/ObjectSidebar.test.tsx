import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_OBJECTS } from "../data/mock";
import { ObjectSidebar } from "./ObjectSidebar";

const onSelect = vi.fn();
const onCollapse = vi.fn();

function renderSidebar(objects = MOCK_OBJECTS) {
  render(
    <ObjectSidebar
      objects={objects}
      totalCount={MOCK_OBJECTS.length}
      selectedId="obj-kreuzberg"
      onSelect={onSelect}
      onCollapse={onCollapse}
    />,
  );
}

describe("ObjectSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the object count and visible objects", () => {
    renderSidebar();

    expect(screen.getByText("Meine Mietobjekte")).not.toBeNull();
    expect(screen.getByText("4")).not.toBeNull();
    expect(screen.getByText("2,5-Zimmer-Wohnung Kreuzberg")).not.toBeNull();
    expect(screen.getByText("Studio am Maybachufer")).not.toBeNull();
  });

  it("renders the header without a search input", () => {
    renderSidebar();

    expect(
      screen.queryByRole("searchbox", { name: "Objekte filtern" }),
    ).toBeNull();
  });

  it("emits selected object ids", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(
      screen.getByRole("button", {
        name: /Studio am Maybachufer/i,
      }),
    );

    expect(onSelect).toHaveBeenCalledWith("obj-maybachufer");
  });

  it("emits collapse requests", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: /Ausblenden/i }));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state when no objects match", () => {
    renderSidebar([]);

    expect(screen.getByText("Keine Objekte gefunden.")).not.toBeNull();
  });
});
