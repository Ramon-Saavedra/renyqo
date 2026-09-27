import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DashboardObject } from "../types";
import { getProviderActiveApplications } from "../api/provider-listing-applications";
import { ListingMatrix } from "./ListingMatrix";

vi.mock("../api/provider-listing-applications", () => ({
  getProviderActiveApplications: vi.fn().mockResolvedValue([]),
}));

function buildObject(id: string): DashboardObject {
  return {
    id,
    title: id,
    fullTitle: `${id} Wohnung`,
    objectType: null,
    district: "Berlin-Mitte",
    address: `${id} Straße 1`,
    coldRent: 900,
    livingArea: 60,
    rooms: "2",
    availableFrom: null,
    publishedAt: null,
    updatedAt: null,
    status: "published",
    activeApplicationsCount: 0,
    coverImageUrl: null,
    needsAttention: false,
    attentionReason: null,
    openQuestionsCount: 0,
  };
}

function buildOrderedObject(id: string, displayOrder: number): DashboardObject {
  return { ...buildObject(id), displayOrder };
}

function dataTransfer() {
  return { effectAllowed: "", setData: vi.fn() };
}

function cell(container: HTMLElement, id: string) {
  const result = container.querySelector<HTMLElement>(
    `[data-listing-cell="${id}"]`,
  );
  if (!result) throw new Error(`Missing listing cell ${id}`);
  return result;
}

function listingButton(container: HTMLElement, id: string) {
  const button = cell(container, id).querySelector("button[aria-pressed]");
  if (!button) throw new Error(`Missing listing button ${id}`);
  return button;
}

function order(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-listing-cell]"),
  ).map((item) => item.dataset.listingCell);
}

function drag(
  container: HTMLElement,
  sourceId: string,
  targetId: string,
  options?: { drop?: boolean },
) {
  const transfer = dataTransfer();
  fireEvent.dragStart(cell(container, sourceId), { dataTransfer: transfer });
  fireEvent.dragOver(cell(container, targetId), { dataTransfer: transfer });
  if (options?.drop !== false) {
    fireEvent.drop(cell(container, targetId), { dataTransfer: transfer });
  }
  fireEvent.dragEnd(cell(container, sourceId), { dataTransfer: transfer });
}

describe("ListingMatrix", () => {
  it("uses the backend display order when it is provided", async () => {
    const { container } = render(
      <ListingMatrix
        objects={[
          buildOrderedObject("C", 3),
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(order(container)).toEqual(["A", "B", "C"]);
    });
  });

  it("persists a position chosen from the non-modal chooser", async () => {
    const onReorder = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Position von A ändern" }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Auf Position 3 verschieben",
      }),
    );

    await waitFor(() => {
      expect(onReorder).toHaveBeenCalledWith("A", 3);
      expect(container.querySelector("[aria-live='polite']")?.textContent).toBe(
        "Objekt wurde auf Position 3 verschoben.",
      );
    });
  });

  it.each([
    ["C", "A", ["C", "A", "B"]],
    ["A", "C", ["B", "C", "A"]],
  ])(
    "moves %s before %s without losing listings",
    (sourceId, targetId, expected) => {
      const objects = ["A", "B", "C"].map(buildObject);
      const { container } = render(
        <ListingMatrix
          objects={objects}
          selectedId={null}
          onSelect={vi.fn()}
        />,
      );

      drag(container, sourceId, targetId);
      expect(order(container)).toEqual(expected);
      expect(new Set(order(container)).size).toBe(3);
    },
  );

  it("does not flip order when the same target receives repeated dragover events", () => {
    const { container } = render(
      <ListingMatrix
        objects={["A", "B", "C"].map(buildObject)}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    const transfer = dataTransfer();
    fireEvent.dragStart(cell(container, "A"), { dataTransfer: transfer });
    fireEvent.dragOver(cell(container, "B"), { dataTransfer: transfer });
    fireEvent.dragOver(cell(container, "B"), { dataTransfer: transfer });

    expect(order(container)).toEqual(["B", "A", "C"]);
  });

  it("does not select or open a listing after a drag ends", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B")]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    const transfer = dataTransfer();
    fireEvent.dragStart(cell(container, "A"), { dataTransfer: transfer });
    fireEvent.dragEnd(cell(container, "A"), { dataTransfer: transfer });
    fireEvent.click(listingButton(container, "A"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not open a preview after a drag ends", () => {
    const { container } = render(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B")]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    const transfer = dataTransfer();
    fireEvent.dragStart(cell(container, "A"), { dataTransfer: transfer });
    fireEvent.dragEnd(cell(container, "A"), { dataTransfer: transfer });
    fireEvent.click(screen.getByRole("button", { name: "Vorschau zu A" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not suppress the next normal click after an external drop", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B")]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.drop(cell(container, "A"), {
      dataTransfer: { types: ["text/plain"], getData: vi.fn() },
    });
    fireEvent.click(listingButton(container, "A"));

    expect(onSelect).toHaveBeenCalledWith("A");
  });

  it("reorders listings added after the initial render", () => {
    const { container, rerender } = render(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B")]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    rerender(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B"), buildObject("C")]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    drag(container, "C", "A");
    expect(order(container)).toEqual(["C", "A", "B"]);
  });

  it("keeps the source array unchanged and renders unique listing ids", () => {
    const objects = ["A", "B", "C"].map(buildObject);
    const originalIds = objects.map((object) => object.id);
    const { container } = render(
      <ListingMatrix objects={objects} selectedId={null} onSelect={vi.fn()} />,
    );

    drag(container, "A", "C");
    expect(objects.map((object) => object.id)).toEqual(originalIds);
    expect(order(container)).toEqual(["B", "C", "A"]);
    expect(new Set(order(container)).size).toBe(order(container).length);
  });

  it("ignores a second reorder while the first save is in flight", async () => {
    let release: (() => void) | undefined;
    const onReorder = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Position von A ändern" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Auf Position 3 verschieben" }),
    );

    await waitFor(() => {
      expect(onReorder).toHaveBeenCalledTimes(1);
    });
    expect(
      (
        screen.getByRole("button", {
          name: "Position von B ändern",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Position von B ändern" }),
    );
    expect(onReorder).toHaveBeenCalledTimes(1);
    release?.();
  });

  it("keeps the new order when the save succeeds and the refresh fails", async () => {
    const onReorder = vi.fn().mockResolvedValue("refresh-failed");
    const { container } = render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Position von A ändern" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Auf Position 3 verschieben" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Die Reihenfolge wurde gespeichert",
      );
    });
    expect(onReorder).toHaveBeenCalledWith("A", 3);
    expect(order(container)).toEqual(["B", "C", "A"]);
  });

  it("restores the previous order when the position save fails", async () => {
    const onReorder = vi.fn().mockRejectedValue(new Error("save failed"));
    const { container } = render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Position von A ändern" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Auf Position 3 verschieben" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "konnte nicht gespeichert werden",
      );
    });
    expect(order(container)).toEqual(["A", "B", "C"]);
  });

  it("restores the saved order when a drag ends without a drop", () => {
    const onReorder = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    drag(container, "A", "C", { drop: false });

    expect(order(container)).toEqual(["A", "B", "C"]);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("does not select a listing from the drag handle", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ListingMatrix
        objects={[buildObject("A"), buildObject("B")]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(listingButton(container, "A"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("A");
    onSelect.mockClear();

    const handle = screen.getByRole("button", {
      name: "Position von A per Drag-and-drop ändern",
    });
    const transfer = dataTransfer();
    fireEvent.click(handle);
    fireEvent.dragStart(handle, { dataTransfer: transfer });
    fireEvent.dragOver(cell(container, "B"), { dataTransfer: transfer });
    fireEvent.drop(cell(container, "B"), { dataTransfer: transfer });
    fireEvent.dragEnd(handle, { dataTransfer: transfer });

    expect(onSelect).not.toHaveBeenCalled();
    expect(listingButton(container, "A").getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("shows a short action title on the listing controls", () => {
    render(
      <ListingMatrix
        objects={[buildObject("A")]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("button", {
          name: "Position von A per Drag-and-drop ändern",
        })
        .getAttribute("title"),
    ).toBe("Reihenfolge ändern");
    expect(
      screen
        .getByRole("button", { name: "Position von A ändern" })
        .getAttribute("title"),
    ).toBe("Position ändern");
    expect(
      screen
        .getByRole("button", { name: "Vorschau zu A" })
        .getAttribute("title"),
    ).toBe("Vorschau");
  });

  it("does not request applicant names for a draft", () => {
    render(
      <ListingMatrix
        objects={[
          {
            ...buildObject("A"),
            status: "draft",
            activeApplicationsCount: 1,
          },
        ]}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.focus(
      screen.getByRole("button", { name: "Bewerbername anzeigen" }),
    );

    expect(getProviderActiveApplications).not.toHaveBeenCalled();
  });

  it("keeps keyboard focus while a position save is pending and restores it afterwards", async () => {
    let release: (() => void) | undefined;
    const onReorder = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    render(
      <ListingMatrix
        objects={[
          buildOrderedObject("A", 1),
          buildOrderedObject("B", 2),
          buildOrderedObject("C", 3),
        ]}
        selectedId="A"
        onSelect={vi.fn()}
        onReorder={onReorder}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Position von A ändern",
    });
    fireEvent.click(trigger);
    fireEvent.click(
      await screen.findByRole("button", { name: "Auf Position 3 verschieben" }),
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Vorschau zu A" }),
      );
    });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);

    release?.();

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
    expect((trigger as HTMLButtonElement).disabled).toBe(false);
  });
});
