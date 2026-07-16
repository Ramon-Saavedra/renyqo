import { z } from "zod";
import { listingEditCopy } from "./copy";
import type { ListingEditErrors, ListingEditForm } from "./types";

const v = listingEditCopy.validation;

function isNonNegativeAmount(value: string): boolean {
  if (value.trim().length === 0) return true;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0;
}

function isPositiveAmount(value: string): boolean {
  if (value.trim().length === 0) return true;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0;
}

export const editListingSchema = z.object({
  title: z.string().trim().min(1, v.title),
  coldRent: z.string().refine(isNonNegativeAmount, { message: v.amount }),
  additionalCosts: z
    .string()
    .refine(isNonNegativeAmount, { message: v.amount }),
  deposit: z.string().refine(isNonNegativeAmount, { message: v.amount }),
  livingArea: z.string().refine(isPositiveAmount, { message: v.area }),
  rooms: z.string().refine(isPositiveAmount, { message: v.rooms }),
  minimumHouseholdNetIncome: z
    .string()
    .refine(isNonNegativeAmount, { message: v.amount }),
});

/**
 * Validates the editable subset of the form. Returns a keyed error map (empty
 * when the form is valid) so fields can render inline messages.
 */
export function validateEditForm(form: ListingEditForm): ListingEditErrors {
  const result = editListingSchema.safeParse(form);
  if (result.success) return {};

  const errors: ListingEditErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      (errors as Record<string, string>)[key] = issue.message;
    }
  }
  return errors;
}
