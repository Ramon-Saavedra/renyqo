import { Home, MapPin } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { dashboardCopy } from "../copy/dashboard";

const CARD_CLASS =
  "mb-7 overflow-hidden rounded-md border border-border bg-background";
const HEAD_CLASS =
  "flex flex-col gap-4 border-b border-border px-6 py-5 xl:flex-row xl:items-start xl:justify-between";
const HEAD_LEFT_CLASS = "flex min-w-0 gap-5";
const THUMB_CLASS =
  "hidden h-23 w-23 shrink-0 items-center justify-center rounded-md bg-background-muted text-foreground-tertiary sm:flex";
const KICKER_CLASS =
  "inline-flex items-center gap-2 font-mono text-meta uppercase text-primary";
const KICKER_PIP_CLASS = "h-1.5 w-1.5 rounded-full bg-primary";
const OBJ_TITLE_CLASS =
  "pt-2 mb-1 font-display text-heading-md font-medium text-foreground xl:text-title";
const ADDR_CLASS =
  "flex items-center gap-1.5 text-body text-foreground-secondary";
const GRID_CLASS =
  "grid grid-cols-2 gap-x-4 gap-y-3 px-6 py-4 sm:grid-cols-3 xl:grid-cols-6";
const CELL_CLASS =
  "flex flex-col gap-1 xl:border-r xl:border-border xl:pr-4 xl:last:border-r-0 xl:last:pr-0";
const DT_CLASS = "font-mono text-meta uppercase text-foreground-tertiary";
const DD_CLASS = "font-display text-brand font-medium text-foreground";

export function SelectedObjectEmptyCard() {
  const { object: copy } = dashboardCopy;
  const stats = [
    { id: "area", dt: copy.livingArea },
    { id: "rooms", dt: copy.rooms },
    { id: "rent", dt: copy.coldRent },
    { id: "free", dt: copy.availableFrom },
    { id: "apps", dt: copy.applications },
    { id: "status", dt: copy.status },
  ];

  return (
    <section className={CARD_CLASS}>
      <div className={HEAD_CLASS}>
        <div className={HEAD_LEFT_CLASS}>
          <div aria-hidden="true" className={THUMB_CLASS}>
            <AppIcon icon={Home} size={28} strokeWidth={1.4} decorative />
          </div>
          <div className="min-w-0">
            <span className={KICKER_CLASS}>
              <span aria-hidden="true" className={KICKER_PIP_CLASS} />
              {copy.kicker}
            </span>
            <h2 className={OBJ_TITLE_CLASS}>{copy.emptyTitle}</h2>
            <span className={ADDR_CLASS}>
              <AppIcon
                icon={MapPin}
                size={13}
                strokeWidth={1.6}
                decorative
                className="text-foreground-tertiary"
              />
              {copy.emptyAddress}
            </span>
          </div>
        </div>
      </div>

      <dl className={GRID_CLASS}>
        {stats.map((stat) => (
          <div key={stat.id} className={CELL_CLASS}>
            <dt className={DT_CLASS}>{stat.dt}</dt>
            <dd className={DD_CLASS}>-</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
