import { z } from "zod";
import { buildApplicationAttentionChips } from "@/lib/attention/chips";
import type { AttentionChipModel } from "@/lib/attention/chips";
import type { ApplicationAttentionSummary } from "@/lib/attention/types";
import { formatCardSchedule } from "@/features/applicant/applications/model/format-date";
import { viewingSummarySchema } from "@/features/applicant/applications/api/shared-schemas";
import {
  OBLIGATION_ACTIONS,
  WORKFLOW_MODES,
  WORKFLOW_SIDES,
} from "@/lib/viewing-workflow/enums";

const instantSchema = z.iso.datetime();

const cardAppointmentSchema = z.object({
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
});

const cardProposalSchema = z.object({
  startsAt: instantSchema,
  endsAt: instantSchema,
  timeZone: z.string().min(1),
  baseAppointmentId: z.string().min(1).nullable(),
  responderSide: z.enum(WORKFLOW_SIDES),
  responseDeadlineAt: instantSchema.nullable(),
});

const cardObligationSchema = z.object({
  action: z.enum(OBLIGATION_ACTIONS),
  responsibleSide: z.enum(WORKFLOW_SIDES),
  deadlineAt: instantSchema.nullable(),
});

const currentCardViewingFields = {
  mode: z.enum(WORKFLOW_MODES),
  confirmedAppointment: cardAppointmentSchema.nullable(),
  pendingProposal: cardProposalSchema.nullable(),
  nextObligation: cardObligationSchema.nullable(),
};

/** Applicant overview keeps the legacy aliases and adds the CURRENT fields. */
export const cardViewingSchema = viewingSummarySchema.extend({
  mode: currentCardViewingFields.mode.optional(),
  confirmedAppointment:
    currentCardViewingFields.confirmedAppointment.optional(),
  pendingProposal: currentCardViewingFields.pendingProposal.optional(),
  nextObligation: currentCardViewingFields.nextObligation.optional(),
});

/** Provider ACTIVE cards send the projection without the legacy aliases. */
export const providerCardViewingSchema = z.object(currentCardViewingFields);

export type CardViewing = z.infer<typeof cardViewingSchema>;
export type ProviderCardViewing = z.infer<typeof providerCardViewingSchema>;

export interface CurrentCardViewingSource {
  readonly mode?: CardViewing["mode"] | undefined;
  readonly confirmedAppointment?:
    | {
        readonly startsAt: string;
        readonly timeZone: string;
      }
    | null
    | undefined;
  readonly pendingProposal?:
    | {
        readonly startsAt: string;
        readonly timeZone: string;
      }
    | null
    | undefined;
  readonly nextObligation?:
    | {
        readonly action: string;
        readonly responsibleSide: string;
        readonly deadlineAt: string | null;
      }
    | null
    | undefined;
}

export interface CardViewingSummary {
  readonly primary: string;
  readonly secondary: string | null;
}

export const cardViewingCopy = {
  confirmed: (when: string) => `Termin ${when}`,
  pending: (when: string) => `Terminvorschlag ${when}`,
  replacementOpen: "Ersatzvorschlag offen",
  answerPending: "Terminvorschlag beantworten",
  answerBy: (when: string) => `Antwort bis ${when}`,
  noShow: "Nicht zum Termin erschienen",
} as const;

function applicantOwesResponse(viewing: CurrentCardViewingSource): boolean {
  return (
    viewing.nextObligation?.responsibleSide === "APPLICANT" &&
    viewing.nextObligation.action === "APPLICANT_RESPOND_TO_VIEWING"
  );
}

function responseNote(
  viewing: CurrentCardViewingSource,
  timeZone: string,
): string | null {
  if (!applicantOwesResponse(viewing)) return null;
  const deadline = viewing.nextObligation?.deadlineAt;
  if (!deadline) return cardViewingCopy.answerPending;
  const when = formatCardSchedule(deadline, timeZone);
  return when ? cardViewingCopy.answerBy(when) : cardViewingCopy.answerPending;
}

/** CURRENT card lines. LEGACY and EMPTY stay on their existing surfaces. */
export function presentCurrentCardViewing(
  viewing: CurrentCardViewingSource | null | undefined,
): CardViewingSummary | null {
  if (!viewing || viewing.mode !== "CURRENT") return null;
  const confirmed = viewing.confirmedAppointment;
  if (confirmed) {
    const when = formatCardSchedule(confirmed.startsAt, confirmed.timeZone);
    if (!when) return null;
    return {
      primary: cardViewingCopy.confirmed(when),
      secondary: viewing.pendingProposal
        ? cardViewingCopy.replacementOpen
        : null,
    };
  }
  const pending = viewing.pendingProposal;
  if (!pending) return null;
  const when = formatCardSchedule(pending.startsAt, pending.timeZone);
  if (!when) return null;
  return {
    primary: cardViewingCopy.pending(when),
    secondary: responseNote(viewing, pending.timeZone),
  };
}

function viewingIsTheOnlyPendingAction(
  attention: ApplicationAttentionSummary,
): boolean {
  return (
    attention.categories.viewingActionCount > 0 &&
    attention.pendingActionCount === attention.categories.viewingActionCount &&
    attention.categories.documentUploadCount === 0 &&
    attention.categories.documentReviewCount === 0
  );
}

/** Drops the generic viewing chips once the card already states that viewing. */
export function attentionChipsForViewingCard(
  attention: ApplicationAttentionSummary,
  summary: CardViewingSummary | null | undefined,
): readonly AttentionChipModel[] {
  const chips = buildApplicationAttentionChips(attention);
  if (!summary) return chips;
  const hidePending = viewingIsTheOnlyPendingAction(attention);
  return chips.filter((chip) => {
    if (chip.kind === "viewing") return false;
    if (chip.kind === "pending" && hidePending) return false;
    return true;
  });
}
