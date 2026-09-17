import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProviderLayout from "@/app/(app)/(standard)/provider/layout";
import { CreateListingForm } from "./CreateListingForm";

const mockPush = vi.hoisted(() => vi.fn());
const mockCreateListingDraft = vi.hoisted(() => vi.fn());
const mockPublishListing = vi.hoisted(() => vi.fn());
const mockGetProviderListings = vi.hoisted(() => vi.fn());

function renderCreateListingForm() {
  return render(
    <ProviderLayout>
      <CreateListingForm />
    </ProviderLayout>,
  );
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/provider/listings/new",
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
    renderCreateListingForm();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Erstes Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("renders the next-listing title when the provider already has listings", async () => {
    mockGetProviderListings.mockResolvedValue([{ id: "listing-1" }]);

    renderCreateListingForm();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Weiteres Mietobjekt anlegen",
      }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("supports undo and redo keyboard shortcuts for local draft changes", async () => {
    const user = userEvent.setup();

    renderCreateListingForm();

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

  it("shows unsaved changes after editing", async () => {
    renderCreateListingForm();

    fireEvent.change(screen.getByPlaceholderText("Berlin"), {
      target: { value: "Berlin" },
    });

    expect(screen.getByText("Ungespeicherte Änderungen")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("removes the unsaved state when edits return to the clean draft", async () => {
    const user = userEvent.setup();

    renderCreateListingForm();

    const cityInput = screen.getByPlaceholderText("Berlin");

    expect(cityInput).toBeInstanceOf(HTMLInputElement);

    await user.type(cityInput, "Berlin");

    expect(screen.getByText("Ungespeicherte Änderungen")).toBeInstanceOf(
      HTMLElement,
    );

    await user.clear(cityInput);

    expect(screen.queryByText("Ungespeicherte Änderungen")).toBeNull();
  });

  it("shows saved after a successful manual draft save", async () => {
    const user = userEvent.setup();
    mockCreateListingDraft.mockResolvedValue({ id: "draft-1" });

    renderCreateListingForm();

    await fillMinimumDraft(user);
    await user.click(
      screen.getByRole("button", { name: "Als Entwurf speichern" }),
    );

    expect(await screen.findByText("Gespeichert")).toBeInstanceOf(HTMLElement);
    expect(mockCreateListingDraft).toHaveBeenCalledTimes(1);
  });

  it("shows an empty draft message without calling the backend", async () => {
    const user = userEvent.setup();

    renderCreateListingForm();

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

    renderCreateListingForm();

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

    renderCreateListingForm();

    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");
    await user.click(screen.getByRole("link", { name: "Zurück" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Änderungen verwerfen?" }),
    ).toBeInstanceOf(HTMLElement);
    expect(mockPush).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("scrolls to the first missing field when publishing with an empty form", () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      renderCreateListingForm();

      fireEvent.click(screen.getByRole("button", { name: "Veröffentlichen" }));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
      expect(mockPublishListing).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        value: originalScrollIntoView,
      });
    }
  });

  it("opens the unsaved-changes modal before provider logo navigation", async () => {
    const user = userEvent.setup();

    render(
      <ProviderLayout>
        <CreateListingForm />
      </ProviderLayout>,
    );

    const topbarElement = screen
      .getAllByRole("banner")
      .find((element) => element.querySelector("#provider-topbar-actions"));
    if (!topbarElement) throw new Error("Provider topbar was not rendered");
    const topbar = within(topbarElement);
    expect(topbar.getByText("Entwurf · Nicht öffentlich")).toBeInstanceOf(
      HTMLElement,
    );
    expect(topbar.getByRole("button", { name: "Rückgängig" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(topbar.getByRole("button", { name: "Wiederholen" })).toBeInstanceOf(
      HTMLElement,
    );
    expect(topbar.getByRole("link", { name: "Zurück" })).toBeInstanceOf(
      HTMLElement,
    );

    await user.type(screen.getByPlaceholderText("Berlin"), "Berlin");
    await user.click(topbar.getByRole("button", { name: "Rückgängig" }));
    expect(
      (screen.getByPlaceholderText("Berlin") as HTMLInputElement).value,
    ).toBe("Berl");
    await user.click(topbar.getByRole("button", { name: "Wiederholen" }));
    expect(
      (screen.getByPlaceholderText("Berlin") as HTMLInputElement).value,
    ).toBe("Berlin");
    await user.click(screen.getByRole("link", { name: "Renyqo" }));
    await user.click(
      screen.getByRole("button", { name: "Ohne Speichern verlassen" }),
    );

    expect(mockPush).toHaveBeenCalledWith("/provider/dashboard");
  });
});
