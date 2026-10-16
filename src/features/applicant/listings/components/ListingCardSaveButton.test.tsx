import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { saveListing } from "../api/listing-saved";
import { ListingCardSaveButton } from "./ListingCardSaveButton";

vi.mock("../api/listing-saved", () => ({
  saveListing: vi.fn().mockResolvedValue({ saved: true }),
  unsaveListing: vi.fn().mockResolvedValue({ saved: false }),
}));

describe("ListingCardSaveButton elevation", () => {
  it("shares hover-only elevation for the login link and preserves image contrast", () => {
    render(
      <ListingCardSaveButton
        listingId="listing-1"
        isSaved={false}
        session="anonymous"
      />,
    );
    const heart = screen.getByRole("link");
    expect(heart.classList.contains("hover:shadow-card")).toBe(true);
    expect(heart.classList.contains("shadow-card")).toBe(false);
    expect(heart.classList.contains("bg-background")).toBe(true);
    expect(heart.classList.contains("focus-visible:shadow-focus")).toBe(true);
  });

  it("keeps disabled controls inactive and saving functional", async () => {
    const user = userEvent.setup();
    const onSavedChange = vi.fn();
    const { rerender } = render(
      <ListingCardSaveButton
        listingId="listing-1"
        isSaved={false}
        session="loading"
        onSavedChange={onSavedChange}
      />,
    );
    const heart = screen.getByRole("button");
    expect(heart.classList.contains("hover:shadow-card")).toBe(true);
    expect(heart.classList.contains("disabled:shadow-none")).toBe(true);
    await user.click(heart);
    expect(saveListing).not.toHaveBeenCalled();
    rerender(
      <ListingCardSaveButton
        listingId="listing-1"
        isSaved={false}
        session="applicant"
        onSavedChange={onSavedChange}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(saveListing).toHaveBeenCalledWith("listing-1");
    expect(onSavedChange).toHaveBeenCalledWith(true);
  });
});
