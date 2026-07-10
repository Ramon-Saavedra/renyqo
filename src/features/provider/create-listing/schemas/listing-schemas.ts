import { z } from "zod";
import { createListingCopy } from "../copy/create-listing";

const v = createListingCopy.validation;

export const publishSchema = z.object({
  city: z.string().min(1, v.city),
  zip: z.string().min(1, v.zip),
  street: z.string().min(1, v.street),
  area: z.string().min(1, v.area),
  rooms: z.string().min(1, v.rooms),
  bedrooms: z
    .number()
    .nullable()
    .refine((val): val is number => val !== null, { message: v.bedrooms }),
  price: z.string().min(1, v.price),
  additionalCosts: z
    .string()
    .refine(
      (val) => val === "" || (Number.isFinite(Number(val)) && Number(val) >= 0),
      { message: v.additionalCosts },
    ),
  deposit: z
    .string()
    .refine(
      (val) => val === "" || (Number.isFinite(Number(val)) && Number(val) >= 0),
      { message: v.deposit },
    ),
  availableFrom: z.string().min(1, v.availableFrom),
  legalAccepted: z.literal(true, v.legalAccepted),
});

export type PublishInput = z.input<typeof publishSchema>;
