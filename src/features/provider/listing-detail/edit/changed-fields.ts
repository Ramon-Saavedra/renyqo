import type { ListingEditForm } from "./types";

export type ListingEditFieldKey = keyof ListingEditForm;

export type ChangedFields = ReadonlySet<ListingEditFieldKey>;

export const NO_CHANGED_FIELDS: ChangedFields = new Set<ListingEditFieldKey>();

export function getChangedFields(
  form: ListingEditForm,
  initial: ListingEditForm,
): ChangedFields {
  const keys = Object.keys(form) as ListingEditFieldKey[];
  const changed = keys.filter((key) => form[key] !== initial[key]);
  return changed.length > 0 ? new Set(changed) : NO_CHANGED_FIELDS;
}
