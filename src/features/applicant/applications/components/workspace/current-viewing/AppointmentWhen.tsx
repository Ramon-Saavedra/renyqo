import {
  formatLongDate,
  formatTime,
  formatTimeZoneName,
} from "../../../model/format-date";
import { applicationsCopy } from "../../../copy";

export function AppointmentWhen({
  startsAt,
  endsAt,
  timeZone,
}: {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly timeZone: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-lead font-medium text-foreground">
        {formatLongDate(startsAt, timeZone)}
      </p>
      <p className="mt-0.5 text-body text-foreground-secondary">
        {applicationsCopy.viewing.timeRange(
          formatTime(startsAt, timeZone),
          formatTime(endsAt, timeZone),
          formatTimeZoneName(startsAt, timeZone),
        )}
      </p>
    </div>
  );
}
