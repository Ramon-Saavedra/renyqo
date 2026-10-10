const DEFAULT_TIME_ZONE = "Europe/Berlin";

const LOCALE = "de-DE";
const DAY_MS = 24 * 60 * 60 * 1000;

function calendarDayNumber(iso: string, timeZone: string): number | null {
  const date = toDate(iso);
  if (!date) return null;
  const parts = formatter(timeZone, "calendar-day", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return null;
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / DAY_MS;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(
  timeZone: string,
  key: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const cacheKey = `${timeZone}|${key}`;
  const cached = formatters.get(cacheKey);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(LOCALE, { timeZone, ...options });
  formatters.set(cacheKey, created);
  return created;
}

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function format(
  iso: string,
  timeZone: string,
  key: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return formatter(timeZone, key, options).format(date);
}

export function formatDate(iso: string, timeZone = DEFAULT_TIME_ZONE): string {
  return format(iso, timeZone, "date", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(iso: string, timeZone = DEFAULT_TIME_ZONE): string {
  return format(iso, timeZone, "time", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatDateTime(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const date = formatDate(iso, timeZone);
  const time = formatTime(iso, timeZone);
  return date && time ? `${date} · ${time}` : "";
}

export function formatLongDate(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return format(iso, timeZone, "long", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekdayDate(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return format(iso, timeZone, "weekday", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatMonthShort(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return format(iso, timeZone, "month", { month: "short" })
    .replace(".", "")
    .toLocaleUpperCase(LOCALE);
}

export function formatDayOfMonth(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return format(iso, timeZone, "day", { day: "numeric" });
}

export function formatTimeZoneName(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return (
    formatter(timeZone, "zone", { timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  );
}

export function calendarDayKey(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return formatDate(iso, timeZone);
}

export function relativeDayLabel(
  iso: string,
  now: Date,
  labels: { readonly today: string; readonly yesterday: string },
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const day = calendarDayKey(iso, timeZone);
  if (day === formatDate(now.toISOString(), timeZone)) return labels.today;
  const messageDay = calendarDayNumber(iso, timeZone);
  const currentDay = calendarDayNumber(now.toISOString(), timeZone);
  if (
    messageDay !== null &&
    currentDay !== null &&
    currentDay - messageDay === 1
  )
    return labels.yesterday;
  return formatLongDate(iso, timeZone);
}
