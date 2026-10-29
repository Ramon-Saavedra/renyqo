import { z } from "zod";

const instantSchema = z.iso.datetime();

export const applicantNoShowMarkerSchema = z.object({
  code: z.literal("APPLICANT_NO_SHOW"),
  appointmentId: z.string().min(1),
  recordedAt: instantSchema,
  startsAt: instantSchema.nullable(),
  endsAt: instantSchema.nullable(),
  timeZone: z.string().min(1).nullable(),
});

/** Card/workspace summary. `position` stays a string so a bigint is not coerced. */
export const considerationSummarySchema = z.object({
  position: z.string().regex(/^\d+$/).nullable(),
  revision: z.number().int().nonnegative(),
  applicantNoShow: applicantNoShowMarkerSchema.nullable(),
});

export type ConsiderationSummary = z.infer<typeof considerationSummarySchema>;
export type ApplicantNoShowMarker = z.infer<typeof applicantNoShowMarkerSchema>;
