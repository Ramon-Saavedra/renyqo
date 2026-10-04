import { describe, expect, it } from "vitest";
import type { ListingStatus } from "@/features/provider/listings-overview/types";
import { createApplicantWorkspace } from "./testing/workspace-fixture";
import {
  buildApplicantWorkflowModel,
  type WorkflowListingContext,
} from "./workflow-model";

const listing: WorkflowListingContext = {
  id: "object-1",
  title: "Wohnung Mitte",
  city: "Berlin-Mitte",
  coldRent: 900,
  status: "published" satisfies ListingStatus,
  rooms: "2",
  livingArea: 60,
};

describe("buildApplicantWorkflowModel", () => {
  it("maps the workspace applicant and the parent listing context", () => {
    const model = buildApplicantWorkflowModel(
      createApplicantWorkspace(),
      listing,
    );

    expect(model.applicationId).toBe("application-1");
    expect(model.applicant.name).toBe("Maria Schneider");
    expect(model.applicant.initials).toBe("MS");
    expect(model.applicant.household).toBe("2 Personen");
    expect(model.applicant.introduction).toBe(
      "Wir suchen langfristig eine ruhige Wohnung.",
    );
    expect(model.applicant.activeSinceLabel).toBe("27.09.2026");
    expect(model.listing).toEqual({
      id: "object-1",
      title: "Wohnung Mitte",
      meta: "2 Zimmer · 60 m²",
    });
    expect(model.canReject).toBe(true);
    expect(model.canSelectForRental).toBe(false);
    expect(model.canSend).toBe(false);
  });

  it("formats activity with the event, du, and a local timestamp", () => {
    const workspace = createApplicantWorkspace();
    const model = buildApplicantWorkflowModel(
      {
        ...workspace,
        activityPreview: {
          hasMore: false,
          items: [
            {
              id: "activity-1",
              type: "DOCUMENT_REQUESTED",
              actorType: "PROVIDER",
              occurredAt: "2026-10-04T11:58:44.072Z",
              payload: { documentType: "SCHUFA", requestId: "request-1" },
            },
          ],
        },
      },
      listing,
    );

    expect(model.activity[0]).toMatchObject({
      text: "Du · SCHUFA-Auskunft angefordert",
      dateLabel: "04.10.2026 · 13:58",
    });
  });

  it("summarizes document counts without hiding a review", () => {
    const base = createApplicantWorkspace();
    function summarized(
      counts: Partial<typeof base.documentsSummary.counts>,
      canRequestDocuments = true,
    ) {
      return buildApplicantWorkflowModel(
        {
          ...base,
          documentsSummary: {
            ...base.documentsSummary,
            canRequestDocuments,
            counts: { ...base.documentsSummary.counts, ...counts },
          },
        },
        listing,
      ).summaries.documents;
    }

    expect(summarized({ uploadRequiredCount: 2 })).toMatchObject({
      value: "2 ausstehend",
      state: "",
    });
    expect(
      summarized({ uploadRequiredCount: 1, reviewRequiredCount: 1 }),
    ).toMatchObject({
      value: "1 zu prüfen · 1 ausstehend",
      state: "",
      tone: "primary",
    });
    expect(
      summarized({
        uploadRequiredCount: 2,
        reviewRequiredCount: 1,
        processingCount: 2,
        reviewedCount: 3,
      }).value,
    ).toBe("1 zu prüfen · 2 ausstehend");
    expect(summarized({}, true)).toMatchObject({
      value: "Keine Unterlagen",
      state: "Anforderung möglich",
    });
    expect(summarized({}, false)).toMatchObject({
      value: "Keine Unterlagen",
      state: "Keine neue Anforderung",
    });
  });

  it("does not invent activity when the workspace preview is empty", () => {
    const model = buildApplicantWorkflowModel(
      createApplicantWorkspace("application-1", "Maria Schneider", null, null),
      listing,
    );

    expect(model.activity).toEqual([]);
    expect(model.applicant.activeSinceLabel).toBeNull();
    expect(model.nextStep.kind).toBe("clear");
  });

  it("maps the viewing summary from the current viewing before canPropose", () => {
    const base = createApplicantWorkspace();
    const viewing = {
      viewingId: "viewing-1",
      startsAt: "2026-10-28T17:00:00.000Z",
      endsAt: "2026-10-28T17:30:00.000Z",
      timeZone: "Europe/Berlin",
      effectiveOutcome: null,
      postViewingInterest: null,
      nextAction: "APPLICANT_RESPOND_TO_VIEWING",
      capabilities: {
        canReschedule: true,
        canCancel: true,
        canMarkCompleted: false,
        canMarkNoShow: false,
        canCorrectOutcome: false,
      },
    };

    function modelFor(status: string | null, canPropose: boolean) {
      return buildApplicantWorkflowModel(
        {
          ...base,
          viewingSummary: {
            ...base.viewingSummary,
            canPropose,
            current: status ? { ...viewing, status } : null,
          },
        },
        listing,
      );
    }

    const proposed = modelFor("PROPOSED", false);
    expect(proposed.summaries.viewing.value).toBe("Vorgeschlagen");
    expect(proposed.summaries.viewing.state).toBe("28.10.2026 · 18:00–18:30");
    expect(proposed.summaries.viewing.state).not.toBe("Kein Vorschlag möglich");

    const accepted = modelFor("ACCEPTED", false);
    expect(accepted.summaries.viewing.value).toBe("Angenommen");
    expect(accepted.summaries.viewing.state).not.toBe("Kein Vorschlag möglich");

    expect(modelFor("CHANGE_REQUESTED", false).summaries.viewing.value).toBe(
      "Änderung angefragt",
    );
    expect(modelFor(null, true).summaries.viewing.state).toBe(
      "Vorschlag möglich",
    );
    expect(modelFor(null, false).summaries.viewing).toMatchObject({
      value: "Kein Termin",
      state: "Kein Vorschlag möglich",
    });

    const summer = buildApplicantWorkflowModel(
      {
        ...base,
        viewingSummary: {
          ...base.viewingSummary,
          canPropose: false,
          current: {
            ...viewing,
            status: "PROPOSED",
            startsAt: "2026-07-15T16:00:00.000Z",
            endsAt: "2026-07-15T16:30:00.000Z",
          },
        },
      },
      listing,
    );
    expect(summer.summaries.viewing.state).toBe("15.07.2026 · 18:00–18:30");
  });
});
