import type { ObjectTypeBackend } from "@/lib/api/listings";
import type {
  AttentionReason,
  ListingStatus,
} from "@/features/provider/listings-overview/types";

export type DashboardObjectStatus = ListingStatus;

export interface DashboardObject {
  readonly id: string;
  readonly title: string;
  readonly fullTitle: string;
  readonly objectType: ObjectTypeBackend | null;
  readonly district: string;
  readonly address: string;
  readonly coldRent: number;
  readonly livingArea: number;
  readonly rooms: string;
  readonly availableFrom: string | null;
  readonly publishedAt: string | null;
  readonly updatedAt: string | null;
  readonly status: DashboardObjectStatus;
  readonly activeApplicationsCount: number;
  readonly coverImageUrl?: string | null;
  readonly needsAttention: boolean;
  readonly attentionReason: AttentionReason;
  readonly openQuestionsCount: number;
}

export type CandidateWarning = "pets_by_arrangement" | "smoking_by_arrangement";

export interface Candidate {
  readonly id: string;
  readonly objectId: string;
  readonly initials: string;
  readonly name: string;
  readonly household: string;
  readonly warnings: readonly CandidateWarning[];
  readonly introduction: string | null;
  readonly activeAtLabel: string | null;
}

export const MAX_ACTIVE_APPLICATIONS = 5;
export const APPLICANT_INTRODUCTION_MAX_LENGTH = 250;

export type WaitingCountState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly count: number }
  | { readonly status: "error" };

export type ExitedApplicantVisualState =
  | "withdrawn"
  | "provider_discarded"
  | "system_removed";

export interface ExitedApplicant {
  readonly id: string;
  readonly listingId: string;
  readonly applicantName: string;
  readonly initials: string;
  readonly household: string;
  readonly introduction: string | null;
  readonly visualState: ExitedApplicantVisualState;
  readonly activeAtLabel: string | null;
  readonly exitedAtDateLabel: string;
}

export interface ApplicantPreview {
  readonly id: string;
  readonly initials: string;
  readonly name: string;
  readonly household: string;
  readonly introduction: string | null;
}
