import { z } from "zod";
import { ApiError } from "@/lib/api/client";

export const viewingScheduleErrorCopy = {
  future: "Der Termin muss in der Zukunft liegen.",
  duration: "Die Termindauer muss zwischen 5 und 240 Minuten liegen.",
  futureAndDuration:
    "Der Termin muss in der Zukunft liegen und zwischen 5 und 240 Minuten dauern.",
  unknown:
    "Der Termin konnte nicht vorgeschlagen werden. Bitte versuche es erneut.",
} as const;

const detailsSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  code: z.string().optional(),
});

const FUTURE_MESSAGE = /start in the future/i;
const DURATION_MESSAGE = /5 to 240 minutes/i;

function responseText(error: ApiError): string {
  const parsed = detailsSchema.safeParse(error.details);
  const detailMessage = parsed.success ? parsed.data.message : undefined;
  const parts = [
    error.message,
    error.code ?? "",
    parsed.success ? (parsed.data.code ?? "") : "",
    ...(typeof detailMessage === "string"
      ? [detailMessage]
      : (detailMessage ?? [])),
  ];
  return parts.filter((part) => part.length > 0).join("\n");
}

/** Maps a schedule-command failure from the backend response. */
export function viewingScheduleErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError) || error.kind !== "http") {
    return viewingScheduleErrorCopy.unknown;
  }
  const text = responseText(error);
  const future = FUTURE_MESSAGE.test(text);
  const duration = DURATION_MESSAGE.test(text);
  if (future && duration) return viewingScheduleErrorCopy.futureAndDuration;
  if (future) return viewingScheduleErrorCopy.future;
  if (duration) return viewingScheduleErrorCopy.duration;
  return viewingScheduleErrorCopy.unknown;
}
