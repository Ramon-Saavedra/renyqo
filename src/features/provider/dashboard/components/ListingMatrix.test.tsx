import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DashboardObject } from "../types";
import { ListingMatrix } from "./ListingMatrix";

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
  const button = cell(container, id).querySelector("button");
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
});
