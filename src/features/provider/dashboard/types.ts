import type { ObjectTypeBackend } from "@/lib/api/listings";

export type DashboardObjectStatus = "published" | "draft";

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
}

export type CandidateWarning = "pets_by_arrangement" | "smoking_by_arrangement";

export interface Candidate {
  readonly id: string;
  readonly objectId: string;
  readonly initials: string;
  readonly name: string;
  readonly household: string;
  readonly warnings: readonly CandidateWarning[];
}

export const MAX_ACTIVE_APPLICATIONS = 5;

export type WaitingCountState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly count: number }
  | { readonly status: "error" };
