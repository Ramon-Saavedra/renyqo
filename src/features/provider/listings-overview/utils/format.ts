const EUR_FORMATTER = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(value);
}

export function formatArea(value: number): string {
  return `${value} m²`;
}

export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso));
}

export function formatRelative(iso: string, now: Date | null = null): string {
  const target = new Date(iso);
  if (!now) {
    return DATE_FORMATTER.format(target);
  }
  const diffSeconds = Math.max(0, (now.getTime() - target.getTime()) / 1000);

  if (diffSeconds < 60) {
    return "gerade eben";
  }
  if (diffSeconds < 3600) {
    return `vor ${Math.floor(diffSeconds / 60)} Min.`;
  }
  if (diffSeconds < 86400) {
    return `vor ${Math.floor(diffSeconds / 3600)} Std.`;
  }
  if (diffSeconds < 86400 * 7) {
    return `vor ${Math.floor(diffSeconds / 86400)} Tagen`;
  }
  return DATE_FORMATTER.format(target);
}
