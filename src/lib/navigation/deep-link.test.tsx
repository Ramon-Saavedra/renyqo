import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyApplicationAttentionSummary } from "@/lib/attention/fixtures";
import type { ApplicationAttentionListItem } from "@/lib/attention/types";
import type { NotificationItem } from "@/features/notifications/api/schema";
import { workflowTabForDeepLink } from "@/features/provider/dashboard/applicant-workflow/deep-link-tab";
import {
  activityFocusStep,
  attentionChipDeepLink,
  closeProviderDeepLink,
  dashboardReturnHref,
  deepLinkHref,
  linkedWorkflowApplicationId,
  listingSearchAfterClose,
  providerWorkspaceHrefFromDashboardSearch,
  messageDeepLink,
  notificationDeepLink,
  readDeepLink,
  type DeepLink,
} from "./deep-link";
import { useDeepLinkActivity } from "./deep-link-activity";
import { focusDeepLink } from "./deep-link-focus";
import { subscribeUrlSearch } from "./url-search";

function item(
  overrides: Partial<ApplicationAttentionListItem> = {},
): ApplicationAttentionListItem {
  return {
    ...emptyApplicationAttentionSummary(),
    applicationId: "app-1",
    listingId: "listing-1",
    listingTitle: "Haus",
    listingCity: "Bawinkel",
    ...overrides,
  };
}

function notificationTarget(
  overrides: Partial<NotificationItem["target"]> = {},
): NotificationItem["target"] {
  return {
    applicationId: "app-1",
    listingId: "listing-1",
    workflowId: "workflow-1",
    proposalId: null,
    appointmentId: null,
    section: "VIEWING",
    activityId: "activity-1",
    action: "OPEN_HISTORY",
    ...overrides,
  };
}

const emptyLink: DeepLink = {
  listingId: null,
  applicationId: null,
  section: null,
  requestId: null,
  documentId: null,
  viewingId: null,
  proposalId: null,
  appointmentId: null,
  activityId: null,
};

describe("deepLinkHref", () => {
  it("opens the applicant conversation without a message id", () => {
    expect(deepLinkHref("applicant", messageDeepLink(item()))).toBe(
      "/applicant/applications/app-1?section=messages",
    );
  });

  it("opens the provider conversation with the listing and application", () => {
    expect(deepLinkHref("provider", messageDeepLink(item()))).toBe(
      "/provider/applications/app-1?listingId=listing-1&section=messages",
    );
  });

  it("opens a provider application without a listing id", () => {
    expect(
      deepLinkHref("provider", {
        applicationId: "app-1",
        section: "documents",
        documentId: "document-1",
      }),
    ).toBe(
      "/provider/applications/app-1?section=documents&documentId=document-1",
    );
    expect(deepLinkHref("provider", { applicationId: "app-1" })).not.toContain(
      "applicationId=",
    );
  });

  it("uses a messages target when the aggregate includes one", () => {
    const href = deepLinkHref(
      "applicant",
      messageDeepLink(
        item({
          targets: [
            {
              applicationId: "app-1",
              listingId: "listing-1",
              section: "MESSAGES",
            },
          ],
        }),
      ),
    );
    expect(href).toBe("/applicant/applications/app-1?section=messages");
    expect(href).not.toContain("workflowId");
    expect(href).not.toContain("conversationId");
  });

  it("opens a viewing target and omits null proposal and appointment ids", () => {
    const href = deepLinkHref(
      "provider",
      attentionChipDeepLink(
        item({
          targets: [
            {
              applicationId: "app-1",
              listingId: "listing-1",
              section: "VIEWING",
              viewingId: "viewing-legacy",
              workflowTarget: {
                applicationId: "app-1",
                workflowId: "workflow-1",
                proposalId: null,
                appointmentId: null,
                section: "VIEWING",
                action: "RESPOND_TO_VIEWING",
              },
            },
          ],
        }),
        "viewing",
      ),
    );
    expect(href).toBe(
      "/provider/applications/app-1?listingId=listing-1&section=viewing&viewingId=viewing-legacy",
    );
    expect(href).not.toContain("proposalId");
    expect(href).not.toContain("appointmentId");
    expect(href).not.toContain("workflowId");
    expect(href).not.toContain("action=");
  });

  it("includes a current proposal id when the viewing target has one", () => {
    expect(
      deepLinkHref(
        "applicant",
        attentionChipDeepLink(
          item({
            targets: [
              {
                applicationId: "app-1",
                listingId: "listing-1",
                section: "VIEWING",
                workflowTarget: {
                  applicationId: "app-1",
                  workflowId: "workflow-1",
                  proposalId: "proposal-1",
                  appointmentId: "appointment-1",
                  section: "VIEWING",
                  action: "RESPOND_TO_VIEWING",
                },
              },
            ],
          }),
          "viewing",
        ),
      ),
    ).toBe(
      "/applicant/applications/app-1?section=viewing&proposalId=proposal-1&appointmentId=appointment-1",
    );
  });

  it("opens the matching document request and document", () => {
    expect(
      deepLinkHref(
        "applicant",
        attentionChipDeepLink(
          item({
            targets: [
              {
                applicationId: "app-1",
                listingId: "listing-1",
                section: "DOCUMENTS",
                requestId: "request-1",
                documentId: "document-1",
              },
            ],
          }),
          "documentReview",
          "request-1",
        ),
      ),
    ).toBe(
      "/applicant/applications/app-1?section=documents&requestId=request-1&documentId=document-1",
    );
  });

  it("opens history from a viewing notification and keeps null ids out of the URL", () => {
    const href = deepLinkHref(
      "applicant",
      notificationDeepLink(notificationTarget()),
    );
    expect(href).toBe(
      "/applicant/applications/app-1?section=viewing&activityId=activity-1",
    );
    expect(href).not.toContain("proposalId");
    expect(href).not.toContain("OPEN_HISTORY");
  });

  it("opens Verlauf from an application notification", () => {
    expect(
      deepLinkHref(
        "provider",
        notificationDeepLink(
          notificationTarget({
            section: "APPLICATION",
            proposalId: "proposal-old",
            appointmentId: "appointment-old",
          }),
        ),
      ),
    ).toBe(
      "/provider/applications/app-1?listingId=listing-1&section=activity&activityId=activity-1",
    );
  });

  it("encodes ids", () => {
    expect(
      deepLinkHref("applicant", {
        applicationId: "a/b",
        section: "messages",
      }),
    ).toBe("/applicant/applications/a%2Fb?section=messages");
  });
});

describe("readDeepLink", () => {
  it("ignores an unknown section and keeps the application", () => {
    expect(
      readDeepLink(
        new URLSearchParams(
          "applicationId=app-1&section=billing&activityId=activity-1",
        ),
      ),
    ).toEqual({
      ...emptyLink,
      applicationId: "app-1",
      activityId: "activity-1",
    });
  });

  it("reads a legacy viewing id", () => {
    expect(
      readDeepLink(new URLSearchParams("section=viewing&viewingId=legacy-1"))
        .viewingId,
    ).toBe("legacy-1");
  });
});

describe("provider deep link ownership", () => {
  it("opens the modal application only for the selected listing", () => {
    const link = readDeepLink(
      new URLSearchParams("listingId=listing-1&applicationId=app-9"),
    );
    expect(linkedWorkflowApplicationId("listing-1", link)).toBe("app-9");
    expect(linkedWorkflowApplicationId("other-listing", link)).toBeNull();
  });

  it("keeps listingId when the modal closes", () => {
    expect(
      listingSearchAfterClose(
        "?listingId=listing-1&applicationId=app-1&section=messages&activityId=a",
      ),
    ).toBe("?listingId=listing-1");
  });

  it("replaces the focus params and leaves listing selection", () => {
    window.history.replaceState(
      {},
      "",
      "/provider/dashboard?listingId=listing-1&applicationId=app-1&section=viewing",
    );
    closeProviderDeepLink();
    expect(window.location.pathname).toBe("/provider/dashboard");
    expect(window.location.search).toBe("?listingId=listing-1");
  });

  it("selects the compact tab for a live section and Verlauf for history", () => {
    expect(
      workflowTabForDeepLink({ section: "messages", activityId: null }),
    ).toBe("messages");
    expect(
      workflowTabForDeepLink({ section: "documents", activityId: null }),
    ).toBe("documents");
    expect(
      workflowTabForDeepLink({ section: "viewing", activityId: null }),
    ).toBe("viewing");
    expect(
      workflowTabForDeepLink({ section: "viewing", activityId: "activity-1" }),
    ).toBe("overview");
    expect(
      workflowTabForDeepLink({ section: "activity", activityId: "activity-1" }),
    ).toBe("overview");
  });
});

describe("activity focus", () => {
  it("loads another page until the activity is present", () => {
    expect(activityFocusStep("later", [{ id: "first" }], true)).toBe("load");
    expect(
      activityFocusStep("later", [{ id: "first" }, { id: "later" }], true),
    ).toBe("found");
  });

  it("stops when the cursor ends", () => {
    expect(activityFocusStep("missing", [{ id: "first" }], false)).toBe("stop");
  });

  it("expands Verlauf and pages until the row exists", () => {
    const expand = vi.fn();
    const loadMore = vi.fn();
    const history = {
      expanded: false,
      items: [] as { id: string }[],
      hasMore: true,
      load: "idle",
      expand,
      loadMore,
    };

    const { rerender } = renderHook(
      (props: typeof history) =>
        useDeepLinkActivity(props, "later", "activity"),
      { initialProps: history },
    );
    expect(expand).toHaveBeenCalled();

    rerender({
      ...history,
      expanded: true,
      load: "ready",
      items: [{ id: "first" }],
      hasMore: true,
    });
    const pagesRequested = loadMore.mock.calls.length;
    expect(pagesRequested).toBeGreaterThan(0);

    rerender({
      ...history,
      expanded: true,
      load: "ready",
      items: [{ id: "first" }, { id: "later" }],
      hasMore: false,
    });
    expect(loadMore.mock.calls.length).toBe(pagesRequested);

    rerender({
      ...history,
      expanded: false,
      load: "idle",
      items: [{ id: "first" }, { id: "later" }],
      hasMore: false,
    });
    expect(expand).toHaveBeenCalledTimes(1);
  });

  it("leaves Verlauf open when the activity is not in the loaded pages", () => {
    const loadMore = vi.fn();
    renderHook(() =>
      useDeepLinkActivity(
        {
          expanded: true,
          items: [{ id: "first" }],
          hasMore: false,
          load: "ready",
          expand: vi.fn(),
          loadMore,
        },
        "missing",
        "activity",
      ),
    );
    expect(loadMore).not.toHaveBeenCalled();
  });
});

describe("focusDeepLink", () => {
  it("scrolls a section and highlights the exact request", () => {
    render(
      <div>
        <section data-section="documents">Dokumente</section>
        <article data-request-id="request-1">SCHUFA</article>
        <article data-proposal-id="proposal-1">Vorschlag</article>
        <article data-viewing-id="legacy-1">Legacy</article>
      </div>,
    );
    const request = screen.getByText("SCHUFA");
    const scrolled = vi.fn();
    request.scrollIntoView = scrolled;

    expect(
      focusDeepLink({
        ...emptyLink,
        section: "documents",
        requestId: "request-1",
      }),
    ).toBe(true);
    expect(scrolled).toHaveBeenCalled();
    expect(request.classList.contains("ring-primary")).toBe(true);
  });

  it("highlights the rendered viewing block", () => {
    render(<article data-proposal-id="proposal-9">Termin</article>);
    const block = screen.getByText("Termin");
    block.scrollIntoView = vi.fn();
    expect(
      focusDeepLink({
        ...emptyLink,
        section: "viewing",
        proposalId: "proposal-9",
      }),
    ).toBe(true);
    expect(block.classList.contains("ring-2")).toBe(true);
  });

  it("scrolls the viewing section when the legacy id is absent", () => {
    render(<section data-section="viewing">Besichtigung</section>);
    const section = screen.getByText("Besichtigung");
    section.scrollIntoView = vi.fn();
    expect(
      focusDeepLink({
        ...emptyLink,
        section: "viewing",
        viewingId: "missing",
      }),
    ).toBe(true);
    expect(section.classList.contains("ring-primary")).toBe(true);
  });

  it("waits while the activity row is still missing", () => {
    render(<section data-section="activity">Verlauf</section>);
    expect(
      focusDeepLink({
        ...emptyLink,
        section: "activity",
        activityId: "later",
      }),
    ).toBe(false);
  });
});

describe("provider application route", () => {
  it("redirects a legacy dashboard application url and keeps focus", () => {
    expect(
      providerWorkspaceHrefFromDashboardSearch(
        "?listingId=listing-1&applicationId=app-1&section=viewing&proposalId=proposal-1&appointmentId=appointment-1",
      ),
    ).toBe(
      "/provider/applications/app-1?listingId=listing-1&section=viewing&proposalId=proposal-1&appointmentId=appointment-1",
    );
    expect(
      providerWorkspaceHrefFromDashboardSearch("?listingId=listing-1"),
    ).toBeNull();
  });

  it("returns to the dashboard listing when the listing is known", () => {
    expect(dashboardReturnHref("listing-1")).toBe(
      "/provider/dashboard?listingId=listing-1",
    );
    expect(dashboardReturnHref(null)).toBe("/provider/dashboard");
  });
});

describe("refresh and back", () => {
  it("notifies subscribers when a deep link is pushed or popped", async () => {
    window.history.replaceState({}, "", "/provider/dashboard?listingId=a");
    const searches: string[] = [];
    const stop = subscribeUrlSearch(() => {
      searches.push(window.location.search);
    });
    window.history.pushState(
      {},
      "",
      "/provider/dashboard?listingId=a&applicationId=app-1&section=messages",
    );
    await Promise.resolve();
    expect(searches.at(-1)).toContain("applicationId=app-1");
    expect(searches.at(-1)).toContain("section=messages");
    window.history.replaceState({}, "", "/provider/dashboard?listingId=a");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(searches.at(-1)).toBe("?listingId=a");
    expect(
      readDeepLink(new URLSearchParams(window.location.search)).section,
    ).toBeNull();
    stop();
  });

  it("keeps the application route address when it is opened and restored", async () => {
    window.history.replaceState(
      {},
      "",
      "/provider/dashboard?listingId=listing-1",
    );
    const paths: string[] = [];
    const stop = subscribeUrlSearch(() => {
      paths.push(`${window.location.pathname}${window.location.search}`);
    });
    window.history.pushState(
      {},
      "",
      "/provider/applications/app-1?listingId=listing-1&section=messages&requestId=request-1",
    );
    await Promise.resolve();
    expect(paths.at(-1)).toBe(
      "/provider/applications/app-1?listingId=listing-1&section=messages&requestId=request-1",
    );
    window.history.replaceState(
      {},
      "",
      "/provider/dashboard?listingId=listing-1",
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(paths.at(-1)).toBe("/provider/dashboard?listingId=listing-1");
    stop();
  });
});
