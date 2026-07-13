export { formatEUR, formatArea } from "../../listings-overview/utils/format";

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return FULL_DATE_FORMATTER.format(date);
}

export function formatRooms(value: number): string {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

export function formatDepositMonths(value: number): string {
  return `${value} ${value === 1 ? "Monatsmiete" : "Monatsmieten"}`;
}
