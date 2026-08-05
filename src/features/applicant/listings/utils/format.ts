const EUR_FORMATTER = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(value);
}

export function formatArea(value: number): string {
  return `${value} m²`;
}

export function formatRooms(value: number): string {
  return value === 1 ? "1 Zimmer" : `${value} Zimmer`;
}

export function formatAvailability(iso: string | null): string {
  if (!iso) return "sofort";
  return DATE_FORMATTER.format(new Date(iso));
}
