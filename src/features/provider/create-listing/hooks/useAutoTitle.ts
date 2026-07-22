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

function roomsLabel(rooms: RoomOption): string {
  return rooms.replace(".", ",");
}

function buildAutoTitle(
  objectType: ObjectType,
  typeLabel: string,
  rooms: RoomOption,
): string {
  // A single room is one unit: the room count adds nothing and would read
  // as "2-Zimmer-Zimmer".
  if (objectType === "zimmer" || !rooms) return typeLabel;
  if (rooms.endsWith("+")) return `${typeLabel} mit ${rooms} Zimmern`;
  return `${roomsLabel(rooms)}-Zimmer-${typeLabel}`;
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
    const base = buildAutoTitle(objectType, typeLabel, rooms);
    const where = city ? ` in ${city}` : "";
    return `${base}${where}`.trim();
  }, [objectType, rooms, typeLabel, city]);

  const isAutoPlaceholder = !autoTitle || autoTitle.trim() === typeLabel;

  return { typeLabel, autoTitle, isAutoPlaceholder };
}

export { neighborhoodFrom };
