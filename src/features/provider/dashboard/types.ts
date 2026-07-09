export type DashboardObjectStatus = "published" | "draft";

export interface DashboardObject {
  readonly id: string;
  readonly title: string;
  readonly fullTitle: string;
  readonly district: string;
  readonly address: string;
  readonly coldRent: number;
  readonly livingArea: number;
  readonly rooms: string;
  readonly availableFrom: string | null;
  readonly status: DashboardObjectStatus;
  readonly activeApplications: number;
}

export type CandidateBadge = "match" | "askback";

export type CandidateAttrState = "ok" | "open" | "muted";

export interface CandidateAttr {
  readonly label: string;
  readonly value: string;
  readonly state: CandidateAttrState;
}

export interface Candidate {
  readonly id: string;
  readonly objectId: string;
  readonly initials: string;
  readonly name: string;
  readonly household: string;
  readonly badge: CandidateBadge;
  readonly attrs: readonly CandidateAttr[];
}

export const MAX_ACTIVE_APPLICATIONS = 5;
