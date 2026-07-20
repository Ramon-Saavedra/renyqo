import { z } from "zod";
import { createListingCopy } from "../copy/create-listing";
import {
  isNonNegativeListingNumber,
  isPositiveListingNumber,
  isValidListingDate,
} from "../utils/listing-validation";

const v = createListingCopy.validation;

export const publishSchema = z.object({
  city: z.string().min(1, v.city),
  zip: z.string().min(1, v.zip),
  street: z.string().min(1, v.street),
  area: z.string().refine(isPositiveListingNumber, v.area),
  rooms: z
    .string()
    .refine(
      (value) => value === "6+" || isPositiveListingNumber(value),
      v.rooms,
    ),
  bedrooms: z
    .number()
    .nullable()
    .refine(
      (value): value is number =>
        value !== null && Number.isInteger(value) && value >= 0,
      { message: v.bedrooms },
    ),
  price: z.string().refine(isPositiveListingNumber, v.price),
  additionalCosts: z
    .string()
    .refine(
      (value) => value.trim() === "" || isNonNegativeListingNumber(value),
      { message: v.additionalCosts },
    ),
  depositMonths: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    message: v.depositMonths,
  }),
  availableFrom: z.string().refine(isValidListingDate, v.availableFrom),
  legalAccepted: z.literal(true, v.legalAccepted),
});

export type PublishInput = z.input<typeof publishSchema>;
