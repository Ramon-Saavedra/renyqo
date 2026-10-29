import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyApplicationAttentionSummary } from "@/lib/attention/fixtures";
import { ApplicationCard } from "@/features/applicant/applications/components/overview/ApplicationCard";
import { toOverviewCardModel } from "@/features/applicant/applications/model/overview-card";
import { overviewCard } from "@/features/applicant/applications/testing/fixtures";
import type { ApplicantApplicationCard } from "@/features/applicant/applications/api/overview";
import {
  attentionChipsForViewingCard,
  presentCurrentCardViewing,
  type CardViewing,
} from "./card-viewing";

const aliases = {
  current: null,
  latest: null,
  latestCompleted: null,
  pendingInterest: null,
  changeRequested: null,
  canPropose: false,
  nextAction: "NONE",
} as const;

function viewing(
  overrides: Partial<CardViewing>,
): ApplicantApplicationCard["viewing"] {
  return { ...aliases, ...overrides };
}

function card(viewingOverrides: Partial<CardViewing>, pending = 0) {
  return toOverviewCardModel(
    overviewCard({
      applicationId: "application-1",
      attention: {
        ...emptyApplicationAttentionSummary(),
        pendingActionCount: pending,
        hasPendingAction: pending > 0,
        categories: {
          documentUploadCount: 0,
          documentReviewCount: 0,
          viewingActionCount: pending,
        },
      },
      viewing: viewing(viewingOverrides),
    }),
  );
}

describe("presentCurrentCardViewing", () => {
  it("shows a confirmed appointment", () => {
    expect(
      presentCurrentCardViewing(
        viewing({
          mode: "CURRENT",
          confirmedAppointment: {
            startsAt: "2026-11-12T13:00:00.000Z",
            endsAt: "2026-11-12T13:30:00.000Z",
            timeZone: "Europe/Berlin",
          },
        }),
      ),
    ).toEqual({ primary: "Termin 12. Nov., 14:00", secondary: null });
  });

  it("keeps the confirmed appointment and marks an open replacement", () => {
    expect(
      presentCurrentCardViewing(
        viewing({
          mode: "CURRENT",
          confirmedAppointment: {
            startsAt: "2026-11-12T13:00:00.000Z",
            endsAt: "2026-11-12T13:30:00.000Z",
            timeZone: "Europe/Berlin",
          },
          pendingProposal: {
            startsAt: "2026-11-20T15:00:00.000Z",
            endsAt: "2026-11-20T15:30:00.000Z",
            timeZone: "Europe/Berlin",
            baseAppointmentId: "appointment-1",
            responderSide: "APPLICANT",
            responseDeadlineAt: null,
          },
        }),
      ),
    ).toEqual({
      primary: "Termin 12. Nov., 14:00",
      secondary: "Ersatzvorschlag offen",
    });
  });

  it("shows a pending invitation and the supplied response deadline", () => {
    expect(
      presentCurrentCardViewing(
        viewing({
          mode: "CURRENT",
          pendingProposal: {
            startsAt: "2026-11-05T21:16:00.000Z",
            endsAt: "2026-11-05T21:46:00.000Z",
            timeZone: "Europe/Berlin",
            baseAppointmentId: null,
            responderSide: "APPLICANT",
            responseDeadlineAt: null,
          },
          nextObligation: {
            action: "APPLICANT_RESPOND_TO_VIEWING",
            responsibleSide: "APPLICANT",
            deadlineAt: "2026-11-05T09:16:00.000Z",
          },
        }),
      ),
    ).toEqual({
      primary: "Terminvorschlag 5. Nov., 22:16",
      secondary: "Antwort bis 5. Nov., 10:16",
    });
  });

  it("leaves a legacy summary on the existing attention chips", () => {
    const model = card({ mode: "LEGACY" }, 1);
    expect(model.viewingSummary).toBeNull();
    expect(model.attentionChips.map((chip) => chip.label)).toEqual([
      "1 offener Schritt",
      "1 Besichtigung offen",
    ]);
  });

  it("does not invent a schedule for an empty workflow", () => {
    const model = card({
      mode: "EMPTY",
      current: {
        viewingId: "old",
        status: "CANCELLED",
        startsAt: "2026-11-12T13:00:00.000Z",
        endsAt: "2026-11-12T13:30:00.000Z",
        timeZone: "Europe/Berlin",
        effectiveOutcome: null,
        postViewingInterest: null,
        nextAction: "NONE",
        capabilities: {
          canAccept: false,
          canDecline: false,
          canRequestAnotherTime: false,
          canSubmitInterest: false,
        },
      },
    });
    expect(model.viewingSummary).toBeNull();
    expect(model.attentionChips).toEqual([]);
  });

  it("hides the generic viewing chips when the card already states the appointment", () => {
    const model = card(
      {
        mode: "CURRENT",
        confirmedAppointment: {
          startsAt: "2026-11-12T13:00:00.000Z",
          endsAt: "2026-11-12T13:30:00.000Z",
          timeZone: "Europe/Berlin",
        },
      },
      1,
    );
    expect(model.viewingSummary?.primary).toBe("Termin 12. Nov., 14:00");
    expect(model.attentionChips).toEqual([]);
    expect(
      attentionChipsForViewingCard(
        {
          ...emptyApplicationAttentionSummary(),
          pendingActionCount: 2,
          hasPendingAction: true,
          categories: {
            documentUploadCount: 1,
            documentReviewCount: 0,
            viewingActionCount: 1,
          },
        },
        model.viewingSummary,
      ).map((chip) => chip.label),
    ).toEqual(["2 offene Schritte", "1 Dokument offen"]);
  });

  it("renders the same summary the provider card uses and no actions", () => {
    const summary = presentCurrentCardViewing(
      viewing({
        mode: "CURRENT",
        confirmedAppointment: {
          startsAt: "2026-11-12T13:00:00.000Z",
          endsAt: "2026-11-12T13:30:00.000Z",
          timeZone: "Europe/Berlin",
        },
      }),
    );
    if (!summary) throw new Error("Missing summary");
    render(
      <ApplicationCard
        card={{
          ...card({ mode: "CURRENT" }),
          viewingSummary: summary,
          attentionChips: [],
        }}
      />,
    );

    expect(screen.getByText("Termin 12. Nov., 14:00")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
