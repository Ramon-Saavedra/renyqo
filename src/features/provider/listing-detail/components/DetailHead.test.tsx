import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingDetail } from "../types";
import { DetailHead } from "./DetailHead";

const BASE: ListingDetail = {
  id: "listing-1",
  title: "Wohnung in Berlin",
  status: "draft",
  objectType: "APARTMENT",
  street: "Musterstraße 1",
  zip: "10115",
  city: "Berlin",
  showExactAddress: false,
  headerAddress: "Musterstraße 1, 10115 Berlin",
  coldRent: 1200,
  additionalCosts: 180,
  deposit: 2400,
  depositMonths: 2,
  livingArea: 70,
  rooms: 2.5,
  bedrooms: 1,
  availableFrom: "2026-08-01",
  shortDescription: "Helle Wohnung",
  schufaRequired: true,
  incomeProofRequired: false,
  minimumHouseholdNetIncome: 3000,
  suitableForPeopleCount: 2,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "PREFER_NOT",
  images: [],
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z",
  publishedAt: null,
};

describe("DetailHead", () => {
  it("shows publish and archive actions for draft listings", () => {
    render(
      <DetailHead listing={BASE} pendingAction={null} onAction={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Veröffentlichen" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      screen.queryByRole("button", { name: "Als Entwurf setzen" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Archivieren" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("shows draft and archive actions for published listings", () => {
    render(
      <DetailHead
        listing={{ ...BASE, status: "published" }}
        pendingAction={null}
        onAction={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Veröffentlichen" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Als Entwurf setzen" }),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(screen.getByRole("button", { name: "Archivieren" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("does not show archive action for archived listings", () => {
    render(
      <DetailHead
        listing={{ ...BASE, status: "archived" }}
        pendingAction={null}
        onAction={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Archivieren" })).toBeNull();
  });

  it("calls onAction with the selected status action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <DetailHead listing={BASE} pendingAction={null} onAction={onAction} />,
    );

    await user.click(screen.getByRole("button", { name: "Veröffentlichen" }));

    expect(onAction).toHaveBeenCalledWith("publish");
  });
});
