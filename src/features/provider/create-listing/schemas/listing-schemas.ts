import { z } from "zod";
import { createListingCopy, OBJECT_TYPES } from "../copy/create-listing";

const v = createListingCopy.validation;

export const draftSaveSchema = z.object({
  objectType: z.enum(OBJECT_TYPES),
  city: z.string().min(1, v.city),
  zip: z.string().min(1, v.zip),
});

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
  availableFrom: z.string().min(1, v.availableFrom),
  photos: z
    .array(z.object({ id: z.string(), src: z.string() }))
    .min(1, v.photos),
  legalAccepted: z.literal(true, v.legalAccepted),
});

export type DraftSaveInput = z.input<typeof draftSaveSchema>;
export type PublishInput = z.input<typeof publishSchema>;
