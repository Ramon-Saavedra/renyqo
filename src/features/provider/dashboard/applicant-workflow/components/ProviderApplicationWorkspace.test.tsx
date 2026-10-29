import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProviderListing } from "@/features/provider/listing-detail/api/provider-listing-detail";
import type { ListingDetail } from "@/features/provider/listing-detail/types";
import { SELECTED_OBJECT_STORAGE_KEY } from "../../copy/dashboard";
import { rejectProviderApplication } from "../../api/provider-application-rejection";
import type * as conversationApi from "../api/conversation";
import { selectApplicationForRental } from "../api/select-tenant";
import { createApplicantWorkspace } from "../testing/workspace-fixture";
import { useApplicantWorkspace } from "../hooks/useApplicantWorkspace";
import { ProviderApplicationWorkspace } from "./ProviderApplicationWorkspace";

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../hooks/useApplicantWorkspace", () => ({
  useApplicantWorkspace: vi.fn(),
}));

vi.mock("../api/conversation", async (importOriginal) => {
  const actual = await importOriginal<typeof conversationApi>();
  return {
    ...actual,
    getConversationHistory: vi.fn().mockResolvedValue({
      applicationId: "application-1",
      conversationId: null,
      openedAt: null,
      hasMessages: false,
      canCurrentUserSend: false,
      applicantRepliesEnabled: false,
      canCurrentUserManageApplicantReplies: false,
      sendBlockReason: null,
      unreadCount: 0,
      lastMessage: null,
      messages: [],
      hasMore: false,
      nextAfterSequence: null,
    }),
    markConversationRead: vi.fn(),
    sendConversationMessage: vi.fn(),
  };
});

vi.mock("../api/select-tenant", () => ({
  selectApplicationForRental: vi.fn(),
}));

vi.mock("../../api/provider-application-rejection", () => ({
  rejectProviderApplication: vi.fn(),
}));

vi.mock(
  "@/features/provider/listing-detail/api/provider-listing-detail",
  () => ({
    getProviderListing: vi.fn(),
  }),
);

vi.mock("@/features/viewing-workflow/snapshot/use-viewing-snapshot", () => ({
  useViewingSnapshot: () => ({
    status: "idle",
    projection: null,
    snapshot: null,
    error: null,
  }),
}));

function mockViewport(compact: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: compact,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function readyWorkspace(applicationId = "application-1") {
  const workspace = createApplicantWorkspace(applicationId, "Maria Schneider");
  vi.mocked(useApplicantWorkspace).mockReturnValue({
    state: {
      status: "ready",
      workspace: {
        ...workspace,
        capabilities: {
          ...workspace.capabilities,
          canReject: true,
          canSelectForRental: true,
        },
      },
    },
    reload: vi.fn(),
  });
}

describe("ProviderApplicationWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockViewport(false);
    readyWorkspace();
    vi.mocked(getProviderListing).mockResolvedValue({
      id: "listing-9",
      title: "Haus in Bawinkel",
      status: "published",
      city: "Bawinkel",
      coldRent: 900,
      rooms: 4,
      livingArea: 90,
    } as ListingDetail);
    vi.mocked(selectApplicationForRental).mockResolvedValue(undefined);
    vi.mocked(rejectProviderApplication).mockResolvedValue(undefined);
  });

  it("loads the workspace from the application id without a listing", async () => {
    window.history.replaceState({}, "", "/provider/applications/application-9");
    readyWorkspace("application-9");
    render(<ProviderApplicationWorkspace applicationId="application-9" />);

    expect(
      await screen.findByRole("heading", { name: "Maria Schneider" }),
    ).toBeInstanceOf(HTMLElement);
    expect(useApplicantWorkspace).toHaveBeenCalledWith("application-9");
    expect(
      screen
        .getByRole("link", { name: "Zurück zum Dashboard" })
        .getAttribute("href"),
    ).toBe("/provider/dashboard");
    expect(getProviderListing).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "Als Mieter auswählen",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(window.localStorage.getItem(SELECTED_OBJECT_STORAGE_KEY)).toBeNull();
  });

  it("keeps a known listing as return context and rental id", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      "/provider/applications/application-1?listingId=listing-9&section=viewing&viewingId=viewing-1",
    );
    render(<ProviderApplicationWorkspace applicationId="application-1" />);

    expect(await screen.findByText("Haus in Bawinkel")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText("4 Zimmer · 90 m²")).toBeInstanceOf(HTMLElement);
    expect(
      screen
        .getByRole("link", { name: "Zurück zum Dashboard" })
        .getAttribute("href"),
    ).toBe("/provider/dashboard?listingId=listing-9");
    expect(window.localStorage.getItem(SELECTED_OBJECT_STORAGE_KEY)).toBe(
      "listing-9",
    );
    expect(useApplicantWorkspace).toHaveBeenCalledWith("application-1");

    await user.click(
      screen.getByRole("button", { name: "Als Mieter auswählen" }),
    );
    await user.click(screen.getByRole("button", { name: "Auswählen" }));

    await waitFor(() => {
      expect(selectApplicationForRental).toHaveBeenCalledWith(
        "listing-9",
        "application-1",
      );
      expect(routerPush).toHaveBeenCalledWith(
        "/provider/dashboard?listingId=listing-9",
      );
    });
  });

  it("opens the dedicated mobile chat from the section query and restores it after refresh", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    window.history.replaceState(
      {},
      "",
      "/provider/applications/application-1?listingId=listing-9&section=messages",
    );
    const view = render(
      <ProviderApplicationWorkspace applicationId="application-1" />,
    );

    expect(
      await screen.findByRole("button", { name: "Chat schließen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByRole("tab", { name: "Chat" })).toBeNull();
    expect(
      screen.getByRole("region", { name: "Nachrichten" }).className,
    ).toContain("100dvh");

    await user.click(screen.getByRole("button", { name: "Chat schließen" }));

    expect(screen.queryByRole("button", { name: "Chat schließen" })).toBeNull();
    expect(
      screen
        .getByRole("tab", { name: "Übersicht" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(window.location.search).toContain("section=messages");
    expect(routerPush).not.toHaveBeenCalled();

    view.unmount();
    render(<ProviderApplicationWorkspace applicationId="application-1" />);
    expect(
      await screen.findByRole("button", { name: "Chat schließen" }),
    ).toBeInstanceOf(HTMLElement);
  });

  it("keeps the wide messages section for a messages deep link", async () => {
    window.history.replaceState(
      {},
      "",
      "/provider/applications/application-1?listingId=listing-9&section=messages",
    );
    render(<ProviderApplicationWorkspace applicationId="application-1" />);

    const messages = await screen.findByRole("region", { name: "Nachrichten" });
    expect(messages.className).not.toContain("100dvh");
    expect(screen.queryByRole("button", { name: "Chat schließen" })).toBeNull();
  });

  it("returns to the listing after a successful rejection", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      "/provider/applications/application-1?listingId=listing-9",
    );
    render(<ProviderApplicationWorkspace applicationId="application-1" />);
    await screen.findByRole("heading", { name: "Maria Schneider" });

    await user.click(
      screen.getByRole("button", { name: "Bewerbung ablehnen" }),
    );
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    await waitFor(() => {
      expect(rejectProviderApplication).toHaveBeenCalledWith("application-1");
      expect(routerPush).toHaveBeenCalledWith(
        "/provider/dashboard?listingId=listing-9",
      );
    });
  });

  it("shows the unavailable state without the application id", () => {
    window.history.replaceState(
      {},
      "",
      "/provider/applications/unauthorized-application?listingId=listing-9",
    );
    vi.mocked(useApplicantWorkspace).mockReturnValue({
      state: { status: "inaccessible" },
      reload: vi.fn(),
    });
    render(
      <ProviderApplicationWorkspace applicationId="unauthorized-application" />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Diese Bewerbung ist nicht mehr verfügbar.",
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("unauthorized-application")).toBeNull();
    expect(screen.queryByText("Maria Schneider")).toBeNull();
    expect(screen.queryByText("Haus in Bawinkel")).toBeNull();
  });
});
