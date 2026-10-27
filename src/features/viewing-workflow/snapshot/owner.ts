import { ApiError } from "@/lib/api/client";
import { scheduleRevalidate } from "@/lib/attention/schedule-revalidate";
import type {
  ViewingWorkflowProjection,
  ViewingWorkflowSnapshot,
} from "@/lib/viewing-workflow/snapshot-schema";
import { getApplicantViewingWorkflow } from "../api/applicant-workflow";
import { getProviderViewingWorkflow } from "../api/provider-workflow";
import { ViewingWorkflowContractError } from "../api/transport";

export type ViewingSide = "applicant" | "provider";
export type ViewingSnapshotSource = "workspace" | "workflow";

export type ViewingSnapshotStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "not-found";

export interface ViewingSnapshotState {
  readonly status: ViewingSnapshotStatus;
  readonly projection: ViewingWorkflowProjection | null;
  readonly snapshot: ViewingWorkflowSnapshot | null;
  readonly error: "contract" | "request" | null;
}

export interface PublishViewingSnapshotInput {
  readonly side: ViewingSide;
  readonly source: ViewingSnapshotSource;
  readonly listingId: string | null;
  readonly snapshot: ViewingWorkflowSnapshot | null;
}

interface Entry {
  side: ViewingSide | null;
  listingId: string | null;
  status: Exclude<ViewingSnapshotStatus, "idle">;
  projection: ViewingWorkflowProjection | null;
  snapshot: ViewingWorkflowSnapshot | null;
  source: ViewingSnapshotSource | null;
  error: "contract" | "request" | null;
  armedFor: string | null | undefined;
  cancelTimer: (() => void) | null;
}

const IDLE: ViewingSnapshotState = {
  status: "idle",
  projection: null,
  snapshot: null,
  error: null,
};

const entries = new Map<string, Entry>();
const views = new Map<string, ViewingSnapshotState>();
const subscribers = new Map<string, Set<() => void>>();
const listings = new Map<string, Set<string>>();
const inflight = new Map<string, Promise<void>>();
const stale = new Set<string>();
let epoch = 0;
let resetHook: (() => void) | null = null;

function createEntry(): Entry {
  return {
    side: null,
    listingId: null,
    status: "loading",
    projection: null,
    snapshot: null,
    source: null,
    error: null,
    armedFor: undefined,
    cancelTimer: null,
  };
}

function notify(applicationId: string): void {
  const listeners = subscribers.get(applicationId);
  if (!listeners) return;
  for (const listener of [...listeners]) listener();
}

function remember(applicationId: string): void {
  const entry = entries.get(applicationId);
  if (!entry) {
    views.delete(applicationId);
  } else {
    views.set(applicationId, {
      status: entry.status,
      projection: entry.projection,
      snapshot: entry.snapshot,
      error: entry.error,
    });
  }
  notify(applicationId);
}

function shouldApply(
  entry: Entry | undefined,
  asOf: string,
  source: ViewingSnapshotSource,
): boolean {
  if (!entry?.projection) return true;
  const current = Date.parse(entry.projection.asOf);
  const candidate = Date.parse(asOf);
  if (Number.isNaN(candidate)) return false;
  if (Number.isNaN(current) || candidate > current) return true;
  if (candidate < current) return false;
  // Equal instant: a workflow GET wins over an embedded workspace copy.
  return !(source === "workspace" && entry.source === "workflow");
}

function rememberListing(applicationId: string, listingId: string): void {
  const entry = entries.get(applicationId);
  if (!entry || entry.listingId === listingId) return;
  if (entry.listingId) listings.get(entry.listingId)?.delete(applicationId);
  const ids = listings.get(listingId) ?? new Set<string>();
  ids.add(applicationId);
  listings.set(listingId, ids);
  entry.listingId = listingId;
}

function syncTimer(applicationId: string): void {
  const entry = entries.get(applicationId);
  if (!entry) return;
  const subscribed = (subscribers.get(applicationId)?.size ?? 0) > 0;
  const next = subscribed ? (entry.projection?.nextRevalidateAt ?? null) : null;
  if (entry.armedFor === next) return;
  entry.cancelTimer?.();
  entry.cancelTimer = null;
  entry.armedFor = next;
  entry.cancelTimer = scheduleRevalidate(next, () => {
    void refetchViewingSnapshot(applicationId);
  });
}

function fail(applicationId: string, error: "contract" | "request"): void {
  const entry = entries.get(applicationId) ?? createEntry();
  entries.set(applicationId, entry);
  entry.error = error;
  if (!entry.projection) entry.status = "error";
  remember(applicationId);
}

function markNotFound(applicationId: string): void {
  const entry = entries.get(applicationId) ?? createEntry();
  entries.set(applicationId, entry);
  entry.status = "not-found";
  entry.projection = null;
  entry.snapshot = null;
  entry.source = null;
  entry.error = null;
  entry.armedFor = undefined;
  syncTimer(applicationId);
  remember(applicationId);
}

export function registerViewingSnapshotResetHook(hook: () => void): void {
  resetHook = hook;
}

export function resetViewingSnapshotsForTests(): void {
  epoch += 1;
  resetHook?.();
  for (const entry of entries.values()) entry.cancelTimer?.();
  entries.clear();
  views.clear();
  subscribers.clear();
  listings.clear();
  inflight.clear();
  stale.clear();
}

export function getViewingSnapshotState(
  applicationId: string,
): ViewingSnapshotState {
  return views.get(applicationId) ?? IDLE;
}

export function subscribedApplicationIds(): readonly string[] {
  return [...subscribers.keys()];
}

export function cachedViewingListingId(applicationId: string): string | null {
  return entries.get(applicationId)?.listingId ?? null;
}

export function publishViewingSnapshot(
  projection: ViewingWorkflowProjection,
  input: PublishViewingSnapshotInput,
): void {
  const current = entries.get(projection.applicationId);
  if (!shouldApply(current, projection.asOf, input.source)) return;
  const entry = current ?? createEntry();
  entries.set(projection.applicationId, entry);
  entry.side = input.side;
  entry.projection = projection;
  entry.snapshot = input.snapshot;
  entry.source = input.source;
  entry.status = "ready";
  entry.error = null;
  if (input.listingId)
    rememberListing(projection.applicationId, input.listingId);
  if (input.source === "workflow") stale.delete(projection.applicationId);
  syncTimer(projection.applicationId);
  remember(projection.applicationId);
}

export function subscribeViewingSnapshot(
  applicationId: string,
  listener: () => void,
): () => void {
  const listeners = subscribers.get(applicationId) ?? new Set<() => void>();
  listeners.add(listener);
  subscribers.set(applicationId, listeners);
  syncTimer(applicationId);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) subscribers.delete(applicationId);
    syncTimer(applicationId);
  };
}

export function refetchViewingSnapshot(
  applicationId: string,
  side?: ViewingSide,
): Promise<void> {
  const current = inflight.get(applicationId);
  if (current) return current;
  const resolvedSide = side ?? entries.get(applicationId)?.side ?? null;
  if (!resolvedSide) return Promise.resolve();
  const entry = entries.get(applicationId) ?? createEntry();
  entries.set(applicationId, entry);
  entry.side = resolvedSide;
  if (!entry.projection) {
    entry.status = "loading";
    entry.error = null;
    remember(applicationId);
  }
  const started = epoch;
  const promise = load(applicationId, resolvedSide, started).finally(() => {
    if (inflight.get(applicationId) === promise) inflight.delete(applicationId);
  });
  inflight.set(applicationId, promise);
  return promise;
}

async function load(
  applicationId: string,
  side: ViewingSide,
  started: number,
): Promise<void> {
  try {
    const snapshot =
      side === "applicant"
        ? await getApplicantViewingWorkflow(applicationId)
        : await getProviderViewingWorkflow(applicationId);
    if (started !== epoch) return;
    if (snapshot.applicationId !== applicationId) {
      fail(applicationId, "contract");
      return;
    }
    publishViewingSnapshot(snapshot, {
      side,
      source: "workflow",
      listingId: null,
      snapshot,
    });
  } catch (error) {
    if (started !== epoch) return;
    if (error instanceof ApiError && error.kind === "cancelled") return;
    if (error instanceof ApiError && error.status === 404) {
      markNotFound(applicationId);
      return;
    }
    fail(
      applicationId,
      error instanceof ViewingWorkflowContractError ? "contract" : "request",
    );
  }
}

export function ensureViewingSnapshot(
  applicationId: string,
  side: ViewingSide,
): Promise<void> {
  const entry = entries.get(applicationId);
  if (
    entry?.status === "ready" &&
    entry.projection &&
    entry.side === side &&
    !stale.has(applicationId)
  ) {
    return Promise.resolve();
  }
  return refetchViewingSnapshot(applicationId, side);
}

export function invalidateViewingSnapshot(
  applicationId: string,
): Promise<void> {
  stale.add(applicationId);
  return refetchViewingSnapshot(applicationId);
}

export function invalidateViewingSnapshotsForListing(listingId: string): void {
  const ids = listings.get(listingId);
  if (!ids) return;
  for (const applicationId of ids) {
    stale.add(applicationId);
    void refetchViewingSnapshot(applicationId);
  }
}
