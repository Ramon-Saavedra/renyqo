import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ListingApplicantPreviewProvider,
  ListingApplicantSlots,
} from "./ListingApplicantSlots";

const preview = {
  initials: "AL",
  name: "Anna Lehmann",
  household: "2 Personen",
  warnings: ["pets_by_arrangement", "smoking_by_arrangement"],
  introduction: "Wir suchen eine ruhige Wohnung in der Nähe der Arbeit.",
  activeAtLabel: "01.08.2026",
} as const;

const secondPreview = {
  initials: "BM",
  name: "Ben Meier",
  household: "1 Person",
  warnings: [],
  introduction: null,
  activeAtLabel: null,
} as const;

function renderSharedPreviews() {
  const onInteraction = vi.fn();
  render(
    <ListingApplicantPreviewProvider>
      <ListingApplicantSlots
        listingId="listing-1"
        activeApplicationsCount={2}
        applicantsState={{
          status: "loaded",
          previews: [preview, secondPreview],
        }}
        onInteraction={onInteraction}
      />
    </ListingApplicantPreviewProvider>,
  );
  return {
    onInteraction,
    firstSlot: screen.getByRole("button", { name: "Anna Lehmann" }),
    secondSlot: screen.getByRole("button", { name: "Ben Meier" }),
  };
}

describe("ListingApplicantSlots", () => {
  it("renders five compact slots and a preview card on focus", async () => {
    const onInteraction = vi.fn();
    render(
      <div>
        <ListingApplicantSlots
          listingId="listing-1"
          activeApplicationsCount={7}
          applicantsState={{ status: "loaded", previews: [preview] }}
          onInteraction={onInteraction}
        />
      </div>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByLabelText("5 aktive Bewerbungen")).not.toBeNull();
    const firstSlot = screen.getByRole("button", { name: "Anna Lehmann" });
    expect(firstSlot.className).toContain("h-4");
    expect(firstSlot.className).toContain("w-4");
    fireEvent.focus(firstSlot);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toContain("Anna Lehmann");
    expect(tooltip.textContent).toContain("2 Personen");
    expect(tooltip.textContent).toContain("Rauchen klären");
    expect(tooltip.textContent).toContain("Haustiere klären");
    expect(tooltip.textContent).toContain("Aktiv seit 01.08.2026");
    expect(tooltip.querySelector(".line-clamp-2")?.textContent).toContain(
      "ruhige Wohnung",
    );
    expect(onInteraction).toHaveBeenCalledWith("listing-1");
    expect(tooltip.getAttribute("role")).toBe("tooltip");
  });

  it("opens one compact preview on hover and replaces it when another slot is hovered", async () => {
    const { firstSlot, secondSlot } = renderSharedPreviews();

    fireEvent.pointerEnter(firstSlot, { pointerType: "mouse" });
    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Anna Lehmann",
    );

    fireEvent.pointerLeave(firstSlot, { pointerType: "mouse" });
    fireEvent.pointerEnter(secondSlot, { pointerType: "mouse" });

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Ben Meier");
      expect(tooltip.textContent).not.toContain("Anna Lehmann");
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip").textContent).toContain("Ben Meier");
  });

  it("opens one compact preview on focus and replaces it when another slot is focused", async () => {
    const { firstSlot, secondSlot } = renderSharedPreviews();

    fireEvent.focus(firstSlot);
    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Anna Lehmann",
    );

    fireEvent.focus(secondSlot);

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Ben Meier");
      expect(tooltip.textContent).not.toContain("Anna Lehmann");
    });
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  });

  it("closes the compact preview when focus leaves", async () => {
    const { firstSlot } = renderSharedPreviews();

    fireEvent.focus(firstSlot);
    expect(await screen.findByRole("tooltip")).not.toBeNull();

    fireEvent.blur(firstSlot);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("closes the visible compact preview on Escape", async () => {
    const { firstSlot } = renderSharedPreviews();

    fireEvent.focus(firstSlot);
    expect(await screen.findByRole("tooltip")).not.toBeNull();

    fireEvent.keyDown(firstSlot, { key: "Escape" });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("opens the compact preview on tap and replaces it when another slot is tapped", async () => {
    const user = userEvent.setup();
    const { firstSlot, secondSlot } = renderSharedPreviews();

    await user.click(firstSlot);

    expect((await screen.findByRole("tooltip")).textContent).toContain(
      "Anna Lehmann",
    );
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);

    await user.click(secondSlot);

    await waitFor(() => {
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Ben Meier");
      expect(tooltip.textContent).not.toContain("Anna Lehmann");
    });
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
  });
});
