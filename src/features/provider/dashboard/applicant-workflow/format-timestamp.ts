const WORKFLOW_TIMESTAMP = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function part(
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function formatWorkflowTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = WORKFLOW_TIMESTAMP.formatToParts(date);
  return `${part(parts, "day")}.${part(parts, "month")}.${part(parts, "year")} · ${part(parts, "hour")}:${part(parts, "minute")}`;
}
