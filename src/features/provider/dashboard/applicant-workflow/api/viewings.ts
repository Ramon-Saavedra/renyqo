import { apiPatchVoid, apiPostJsonVoid } from "@/lib/api/client";

const VIEWING_TIME_ZONE = "Europe/Berlin";
const VIEWING_DURATION_MS = 30 * 60 * 1000;

export interface ViewingProposal {
  readonly date: string;
  readonly time: string;
}

function timeZoneOffsetMs(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const zoned = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
  return zoned - utcMs;
}

function berlinWallClock(utcMs: number): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIEWING_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const hour = read("hour");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: hour === 24 ? 0 : hour,
    minute: read("minute"),
  };
}

function berlinLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date | null {
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = desiredAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const next = desiredAsUtc - timeZoneOffsetMs(VIEWING_TIME_ZONE, utc);
    if (next === utc) break;
    utc = next;
  }
  const wall = berlinWallClock(utc);
  if (
    wall.year !== year ||
    wall.month !== month ||
    wall.day !== day ||
    wall.hour !== hour ||
    wall.minute !== minute
  ) {
    return null;
  }
  return new Date(utc);
}

export function viewingInterval(
  proposal: ViewingProposal,
): { startsAt: string; endsAt: string; timeZone: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.date)) return null;
  if (!/^\d{2}:\d{2}$/.test(proposal.time)) return null;
  const [year, month, day] = proposal.date.split("-").map(Number);
  const [hour, minute] = proposal.time.split(":").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return null;
  }
  const start = berlinLocalToUtc(year, month, day, hour, minute);
  if (!start) return null;
  return {
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + VIEWING_DURATION_MS).toISOString(),
    timeZone: VIEWING_TIME_ZONE,
  };
}

function viewingCollectionPath(applicationId: string, viewingId?: string) {
  const base = `/api/v1/provider/applications/${encodeURIComponent(applicationId)}/viewings`;
  return viewingId ? `${base}/${encodeURIComponent(viewingId)}` : base;
}

export async function proposeViewing(
  applicationId: string,
  proposal: ViewingProposal,
  requestKey: string,
): Promise<void> {
  const interval = viewingInterval(proposal);
  if (!interval) throw new Error("Invalid viewing proposal");
  await apiPostJsonVoid(viewingCollectionPath(applicationId), {
    requestKey,
    ...interval,
  });
}

export async function rescheduleViewing(
  applicationId: string,
  viewingId: string,
  proposal: ViewingProposal,
  requestKey: string,
): Promise<void> {
  const interval = viewingInterval(proposal);
  if (!interval) throw new Error("Invalid viewing proposal");
  await apiPostJsonVoid(
    `${viewingCollectionPath(applicationId, viewingId)}/reschedule`,
    { requestKey, ...interval },
  );
}

export async function cancelViewing(
  applicationId: string,
  viewingId: string,
): Promise<void> {
  await apiPatchVoid(
    `${viewingCollectionPath(applicationId, viewingId)}/cancel`,
  );
}

export async function completeViewing(
  applicationId: string,
  viewingId: string,
): Promise<void> {
  await apiPatchVoid(
    `${viewingCollectionPath(applicationId, viewingId)}/complete`,
  );
}

export async function markViewingNoShow(
  applicationId: string,
  viewingId: string,
): Promise<void> {
  await apiPatchVoid(
    `${viewingCollectionPath(applicationId, viewingId)}/no-show`,
  );
}
