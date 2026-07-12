import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateListingForm } from "./CreateListingForm";

const mockPush = vi.hoisted(() => vi.fn());
const mockCreateListingDraft = vi.hoisted(() => vi.fn());
const mockPublishListing = vi.hoisted(() => vi.fn());
const mockGetProviderListings = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/api/listings", () => ({
  createListingDraft: mockCreateListingDraft,
  publishListing: mockPublishListing,
}));

vi.mock("@/features/provider/listings-overview/api/provider-listings", () => ({
  getProviderListings: mockGetProviderListings,
}));

async function fillMinimumDraft(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");
  await user.type(screen.getByPlaceholderText("10115"), "10115");
}

describe("CreateListingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProviderListings.mockResolvedValue([]);
  });

  it("renders the first-listing title when the provider has no listings", async () => {
    render(<CreateListingForm />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Erstes Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the next-listing title when the provider already has listings", async () => {
    mockGetProviderListings.mockResolvedValue([{ id: "listing-1" }]);

    render(<CreateListingForm />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Weiteres Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("supports undo and redo keyboard shortcuts for local draft changes", async () => {
    const user = userEvent.setup();

    render(<CreateListingForm />);

    const cityInput = screen.getByPlaceholderText("Berlin");

    expect(cityInput).toBeInstanceOf(HTMLInputElement);

    await user.type(cityInput, "Berlin");

    expect((cityInput as HTMLInputElement).value).toBe("Berlin");

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });

    expect((cityInput as HTMLInputElement).value).toBe("Berl");

    fireEvent.keyDown(window, { key: "y", ctrlKey: true });

    expect((cityInput as HTMLInputElement).value).toBe("Berlin");

    fireEvent.keyDown(window, { key: "z", metaKey: true });

    expect((cityInput as HTMLInputElement).value).toBe("Berl");

    fireEvent.keyDown(window, { key: "z", metaKey: true, shiftKey: true });

    expect((cityInput as HTMLInputElement).value).toBe("Berlin");
  });

  it("shows unsaved changes after editing without autosave copy", async () => {
    const user = userEvent.setup();

    render(<CreateListingForm />);

    const topbar = document.querySelector("header");

    expect(topbar).toBeInstanceOf(HTMLElement);
    expect(
      within(topbar as HTMLElement).queryByText("Automatisch gespeichert"),
    ).toBeNull();
    expect(
      within(topbar as HTMLElement).queryByText("Wird gespeichert"),
    ).toBeNull();

    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");

    expect(screen.getByText("Ungespeicherte Änderungen")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      within(topbar as HTMLElement).queryByText("Automatisch gespeichert"),
    ).toBeNull();
  });

  it("removes the unsaved state when edits return to the clean draft", async () => {
    const user = userEvent.setup();

    render(<CreateListingForm />);

    const topbar = document.querySelector("header");
    const cityInput = screen.getByPlaceholderText("Berlin");

    expect(topbar).toBeInstanceOf(HTMLElement);
    expect(cityInput).toBeInstanceOf(HTMLInputElement);

    await user.type(cityInput, "Berlin");

    expect(
      within(topbar as HTMLElement).getByText("Ungespeicherte Änderungen"),
    ).toBeInstanceOf(HTMLElement);

    await user.clear(cityInput);

    expect(
      within(topbar as HTMLElement).queryByText("Ungespeicherte Änderungen"),
    ).toBeNull();
  });

  it("keeps the topbar sticky for lower form inputs", () => {
    render(<CreateListingForm />);

    const topbar = document.querySelector("header");

    expect(topbar).toBeInstanceOf(HTMLElement);
    expect(topbar?.className).toContain("sticky");
    expect(topbar?.className).toContain("top-0");
    expect(topbar?.className).toContain("z-30");
  });

  it("shows saved after a successful manual draft save", async () => {
    const user = userEvent.setup();
    mockCreateListingDraft.mockResolvedValue({ id: "draft-1" });

    render(<CreateListingForm />);

    await fillMinimumDraft(user);
    await user.click(
      screen.getByRole("button", { name: "Als Entwurf speichern" }),
    );

    expect(await screen.findByText("Gespeichert")).toBeInstanceOf(HTMLElement);
    expect(mockCreateListingDraft).toHaveBeenCalledTimes(1);
  });

  it("shows an empty draft message without calling the backend", async () => {
    const user = userEvent.setup();

    render(<CreateListingForm />);

    await user.click(
      screen.getByRole("button", { name: "Als Entwurf speichern" }),
    );

    expect(
      await screen.findByText("Es gibt noch nichts zu speichern."),
    ).toBeInstanceOf(HTMLElement);
    expect(mockCreateListingDraft).not.toHaveBeenCalled();
    expect(screen.queryByText("Speichern fehlgeschlagen")).toBeNull();
  });

  it("shows an error state after a failed manual draft save", async () => {
    const user = userEvent.setup();
    mockCreateListingDraft.mockRejectedValue(new Error("server down"));

    render(<CreateListingForm />);

    await fillMinimumDraft(user);
    await user.click(
      screen.getByRole("button", { name: "Als Entwurf speichern" }),
    );

    expect(await screen.findByText("Speichern fehlgeschlagen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("opens the unsaved-changes modal when Zurück is clicked with local changes", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm");

    render(<CreateListingForm />);

    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");
    await user.click(screen.getByRole("link", { name: "Zurück" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Änderungen verwerfen?" }),
    ).toBeInstanceOf(HTMLElement);
    expect(mockPush).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("opens the unsaved-changes modal before provider logo navigation", async () => {
    const user = userEvent.setup();

    render(<CreateListingForm />);

    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");
    await user.click(screen.getByRole("link", { name: "Renyqo" }));
    await user.click(
      screen.getByRole("button", { name: "Ohne Speichern verlassen" }),
    );

    expect(mockPush).toHaveBeenCalledWith("/provider/dashboard");
  });
});
