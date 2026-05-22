export const LISTING_STATUS = [
  "published",
  "draft",
  "paused",
  "rented",
  "archived",
] as const;

export type ListingStatus = (typeof LISTING_STATUS)[number];

export type AttentionReason =
  | "open_questions"
  | "manual_review"
  | "missing_data"
  | null;

export interface ListingOverviewItem {
  readonly id: string;
  readonly title: string;
  readonly displayAddress: string;

  readonly coldRent: number;
  readonly livingArea: number;
  readonly rooms: number;

  readonly status: ListingStatus;

  readonly applicationsCount: number;
  readonly activeApplicationsCount: number;
  readonly newApplicationsCount: number;
  readonly activeApplicationsLimit: number;

  readonly needsAttention: boolean;
  readonly attentionReason: AttentionReason;
  readonly openQuestionsCount: number;

  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
}

export const SORT_KEYS = [
  "updated",
  "created",
  "applications",
  "status",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const STATUS_FILTER_KEYS = [
  "alle",
  "published",
  "draft",
  "paused",
  "rented",
  "archived",
  "attention",
] as const;

export type StatusFilterKey = (typeof STATUS_FILTER_KEYS)[number];

export type StatusCounts = Record<StatusFilterKey, number>;

export const ROW_ACTIONS = [
  "preview",
  "edit",
  "pause",
  "rented",
  "archive",
] as const;

export type RowAction = (typeof ROW_ACTIONS)[number];
