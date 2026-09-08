import { formatArea, formatEUR } from "./format";

export function parseFilterInteger(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

export function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function isCustomFilterValue(
  options: readonly { readonly value: number | null }[],
  value: number | null,
): boolean {
  return value !== null && !options.some((option) => option.value === value);
}

export function formatMaxRentChoice(value: number): string {
  return `bis ${formatEUR(value)}`;
}

export function formatMinAreaChoice(value: number): string {
  return `ab ${formatArea(value)}`;
}
