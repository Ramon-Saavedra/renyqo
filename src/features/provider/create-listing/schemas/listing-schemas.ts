import { z } from "zod";
import { createListingCopy } from "../copy/create-listing";

const v = createListingCopy.validation;

export const draftSaveSchema = z.object({
  address: z.string().min(1, v.address),
});

export const publishSchema = z.object({
  address: z.string().min(1, v.address),
  area: z.string().min(1, v.area),
  rooms: z.string().min(1, v.rooms),
  price: z.string().min(1, v.price),
  availableFrom: z.string().min(1, v.availableFrom),
  photos: z
    .array(z.object({ id: z.string(), src: z.string() }))
    .min(1, v.photos),
  legalAccepted: z.literal(true, v.legalAccepted),
});

export type DraftSaveInput = z.input<typeof draftSaveSchema>;
export type PublishInput = z.input<typeof publishSchema>;
