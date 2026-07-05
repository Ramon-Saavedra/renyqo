import { useMemo } from "react";
import {
  OBJECT_TYPE_LABELS,
  type ObjectType,
  type RoomOption,
} from "../copy/create-listing";

const POSTAL_PREFIX_RE = /^\d{4,5}\s*/;

function neighborhoodFrom(address: string): string {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts.at(-1);
  if (parts.length >= 2 && last !== undefined) {
    return last.replace(POSTAL_PREFIX_RE, "").trim();
  }
  return "";
}

interface UseAutoTitleArgs {
  readonly objectType: ObjectType;
  readonly rooms: RoomOption;
  readonly city: string;
}

interface UseAutoTitleResult {
  readonly typeLabel: string;
  readonly autoTitle: string;
  readonly isAutoPlaceholder: boolean;
}

export function useAutoTitle({
  objectType,
  rooms,
  city,
}: UseAutoTitleArgs): UseAutoTitleResult {
  const typeLabel = OBJECT_TYPE_LABELS[objectType];

  const autoTitle = useMemo(() => {
    const r = rooms ? `${rooms}-Zimmer-` : "";
    const where = city ? ` in ${city}` : "";
    return `${r}${typeLabel}${where}`.trim().replace(/^[- ]+/, "");
  }, [rooms, typeLabel, city]);

  const isAutoPlaceholder = !autoTitle || autoTitle.trim() === typeLabel;

  return { typeLabel, autoTitle, isAutoPlaceholder };
}

export { neighborhoodFrom };
