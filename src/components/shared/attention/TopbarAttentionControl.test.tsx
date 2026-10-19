import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attentionCopy } from "@/lib/attention/copy";
import { TopbarAttentionControl } from "./TopbarAttentionControl";

const useGlobalAttention = vi.hoisted(() => vi.fn());

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  useGlobalAttention,
}));

vi.mock("@/features/provider/dashboard/selected-object-storage", () => ({
  setStoredSelectedObjectId: vi.fn(),
}));

describe("TopbarAttentionControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when attention is empty", () => {
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      count: 0,
      groups: [],
    });

    render(<TopbarAttentionControl role="applicant" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the applicant grouped attention count and menu", async () => {
    const ariaTrigger = `${attentionCopy.globalMenuTitle}: ${attentionCopy.globalMenuAriaLabel(2)}`;
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      count: 2,
      groups: [
        {
          applicationId: "app-1",
          listingId: "listing-1",
          href: "/applicant/applications/app-1",
          listingTitle: "3-Zimmer-Wohnung",
          listingCity: "Freiburg",
          chips: [
            {
              id: "row-1",
              chip: {
                kind: "messages",
                label: attentionCopy.unreadMessages(1),
                icon: () => null,
                count: 1,
                emphasis: false,
              },
            },
          ],
        },
      ],
    });

    render(<TopbarAttentionControl role="applicant" />);

    expect(screen.getByRole("button", { name: ariaTrigger })).toBeInstanceOf(
      HTMLButtonElement,
    );
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.queryByText(/Bewerbungen mit offenen Punkten/i)).toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: ariaTrigger }));

    expect(screen.getByText("3-Zimmer-Wohnung")).toBeTruthy();
    expect(screen.getByText("Freiburg")).toBeTruthy();
    expect(screen.queryByText(/listing-1/i)).toBeNull();

    const link = screen.getByRole("link", {
      name: new RegExp(attentionCopy.unreadMessages(1)),
    });
    expect(link.getAttribute("href")).toBe("/applicant/applications/app-1");
    expect(screen.queryByText(attentionCopy.globalMenuEmpty)).toBeNull();
  });

  it("shows provider menu with dashboard href", async () => {
    const ariaTrigger = `${attentionCopy.globalMenuTitle}: ${attentionCopy.globalMenuAriaLabel(1)}`;
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      count: 1,
      groups: [
        {
          applicationId: "app-p",
          listingId: "obj-1",
          href: "/provider/dashboard?listingId=obj-1",
          listingTitle: "Objekt Süd",
          listingCity: null,
          chips: [
            {
              id: "row-p",
              chip: {
                kind: "viewing",
                label: attentionCopy.viewingAction(1),
                icon: () => null,
                count: 1,
                emphasis: true,
              },
            },
          ],
        },
      ],
    });

    render(<TopbarAttentionControl role="provider" />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: ariaTrigger }));

    expect(screen.getByText("Objekt Süd")).toBeTruthy();
    expect(
      screen
        .getByRole("link", {
          name: new RegExp(attentionCopy.viewingAction(1)),
        })
        .getAttribute("href"),
    ).toBe("/provider/dashboard?listingId=obj-1");
    expect(screen.queryByText(/obj-1/i)).toBeNull();
    await user.click(
      screen.getByRole("link", {
        name: new RegExp(attentionCopy.viewingAction(1)),
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: attentionCopy.globalMenuTitle }),
    ).toBeNull();
    expect(
      screen
        .getByRole("button", { name: ariaTrigger })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("shows error copy when aggregate fetch failed", async () => {
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: true,
      count: 0,
      groups: [],
    });

    render(<TopbarAttentionControl role="applicant" />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: attentionCopy.globalMenuTitle }),
    );

    expect(screen.getByText(attentionCopy.globalMenuError)).toBeTruthy();
  });

  it("hides numeric badge when count is zero but loading", () => {
    useGlobalAttention.mockReturnValue({
      loading: true,
      error: false,
      count: 0,
      groups: [],
    });

    render(<TopbarAttentionControl role="applicant" />);
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("keeps applicant and provider hooks role-scoped via prop", () => {
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      count: 1,
      groups: [],
    });

    render(<TopbarAttentionControl role="applicant" />);
    expect(useGlobalAttention).toHaveBeenCalledWith("applicant");

    render(<TopbarAttentionControl role="provider" />);
    expect(useGlobalAttention).toHaveBeenCalledWith("provider");
  });
});
