import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompletionChecklist } from "./CompletionChecklist";

const ITEMS = [
  { label: "Stadt", targetId: "city" },
  { label: "PLZ", targetId: "zip" },
  { label: "Straße", targetId: "street" },
];

function renderChecklist(missing: ReadonlyArray<string>, complete = false) {
  return render(
    <CompletionChecklist
      items={ITEMS}
      missing={missing}
      complete={complete}
      variant="rail"
      missingLabel="Noch fehlt"
      okLabel="Alles vollständig"
    />,
  );
}

describe("CompletionChecklist", () => {
  it("renders every item regardless of how many are still missing", () => {
    renderChecklist(["PLZ"]);

    expect(screen.getByRole("button", { name: "Stadt" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("button", { name: "PLZ" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByRole("button", { name: "Straße" })).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows the number of outstanding items", () => {
    renderChecklist(["PLZ", "Straße"]);

    expect(screen.getByText("Noch fehlt")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("2")).toBeInstanceOf(HTMLElement);
  });

  it("swaps to the completion badge when nothing is missing", () => {
    renderChecklist([], true);

    expect(screen.getByText("Alles vollständig")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Noch fehlt")).toBeNull();
  });

  it("scrolls to and focuses the field an item points at", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();

    const field = document.createElement("input");
    field.id = "zip";
    field.scrollIntoView = scrollIntoView;
    document.body.appendChild(field);

    renderChecklist(["PLZ"]);
    await user.click(screen.getByRole("button", { name: "PLZ" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(document.activeElement).toBe(field);

    field.remove();
  });

  it("focuses the first control inside a non-interactive target", async () => {
    const user = userEvent.setup();

    const group = document.createElement("div");
    group.id = "city";
    group.scrollIntoView = vi.fn();
    const radio = document.createElement("button");
    group.appendChild(radio);
    document.body.appendChild(group);

    renderChecklist(["Stadt"]);
    await user.click(screen.getByRole("button", { name: "Stadt" }));

    expect(document.activeElement).toBe(radio);

    group.remove();
  });
});
