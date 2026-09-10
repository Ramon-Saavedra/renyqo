import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { saveListing, unsaveListing } from "../../api/listing-saved";
import { ListingSaveAction } from "./ListingSaveAction";

vi.mock("../../api/listing-saved", () => ({
  saveListing: vi.fn(),
  unsaveListing: vi.fn(),
}));

const saved = {
  saved: true as const,
  savedAt: "2026-09-05T12:00:00.000Z",
};

const unsaved = {
  saved: false as const,
  savedAt: null,
};

describe("ListingSaveAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guides anonymous users to login without saving", async () => {
    const user = userEvent.setup();
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="anonymous"
      />,
    );

    const link = screen.getByRole("link", { name: "Merken" });
    expect(link.getAttribute("href")).toBe("/login");
    await user.click(link);

    expect(saveListing).not.toHaveBeenCalled();
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides save for a non-applicant session", () => {
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="other"
      />,
    );

    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Merken" })).toBeNull();
  });

  it("hides save while the viewer session is in error", () => {
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="error"
      />,
    );

    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Merken" })).toBeNull();
  });

  it("renders Merken when the listing is not saved", () => {
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="applicant"
      />,
    );

    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Gemerkt" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Merken" }).querySelector("svg"),
    ).toBeInstanceOf(SVGElement);
  });

  it("renders Gemerkt when the listing is saved", () => {
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={true}
        session="applicant"
      />,
    );

    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.queryByRole("button", { name: "Merken" })).toBeNull();
  });

  it("saves with PUT from Merken", async () => {
    const user = userEvent.setup();
    vi.mocked(saveListing).mockResolvedValue(saved);
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="applicant"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Merken" }));

    expect(saveListing).toHaveBeenCalledWith("listing-1");
    expect(unsaveListing).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("unsaves with DELETE from Gemerkt", async () => {
    const user = userEvent.setup();
    vi.mocked(unsaveListing).mockResolvedValue(unsaved);
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={true}
        session="applicant"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gemerkt" }));

    expect(unsaveListing).toHaveBeenCalledWith("listing-1");
    expect(saveListing).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("blocks a duplicate action while the request is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest: (() => void) | undefined;
    vi.mocked(saveListing).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve(saved);
      }),
    );
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="applicant"
      />,
    );

    const button = screen.getByRole("button", { name: "Merken" });
    await user.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await user.click(button);
    expect(saveListing).toHaveBeenCalledTimes(1);

    resolveRequest?.();
    expect(
      await screen.findByRole("button", { name: "Gemerkt" }),
    ).toBeInstanceOf(HTMLButtonElement);
  });

  it("keeps Merken and shows an error when save fails", async () => {
    const user = userEvent.setup();
    vi.mocked(saveListing).mockRejectedValue(new ApiError(500, "fail"));
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="applicant"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Merken" }));

    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Das Objekt konnte nicht gemerkt werden.",
    );
  });

  it("keeps Gemerkt and shows an unsave error when remove fails", async () => {
    const user = userEvent.setup();
    vi.mocked(unsaveListing).mockRejectedValue(new ApiError(500, "fail"));
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={true}
        session="applicant"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gemerkt" }));

    expect(screen.getByRole("button", { name: "Gemerkt" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Das Objekt konnte nicht von den Gemerkten entfernt werden.",
    );
  });

  it("shows save auth copy on 401", async () => {
    const user = userEvent.setup();
    vi.mocked(saveListing).mockRejectedValue(new ApiError(401, "auth"));
    render(
      <ListingSaveAction
        listingId="listing-1"
        isSaved={false}
        session="applicant"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Merken" }));

    expect(screen.getByRole("button", { name: "Merken" })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Bitte melde dich an, um dieses Objekt zu merken.",
    );
  });
});
