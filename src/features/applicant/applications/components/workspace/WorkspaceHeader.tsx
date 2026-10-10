import { MapPin } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { formatEUR } from "@/features/applicant/listings/utils/format";
import type { ApplicantWorkspace } from "../../api/workspace";
import { applicationsCopy } from "../../copy";
import { formatDate } from "../../model/format-date";
import { STATUS_PRESENTATION } from "../../model/status";
import { ListingThumbnail } from "../ListingThumbnail";
import { ToneBadge } from "../ToneBadge";

const copy = applicationsCopy.workspace;

interface DateFact {
  readonly label: string;
  readonly value: string;
}

function dateFacts(application: ApplicantWorkspace["application"]): DateFact[] {
  const facts: DateFact[] = [
    { label: copy.submittedAt, value: formatDate(application.submittedAt) },
  ];
  if (application.activeAt) {
    facts.push({
      label:
        application.status === "ACTIVE" ? copy.activeSince : copy.activeFrom,
      value: formatDate(application.activeAt),
    });
  }
  if (application.rejectedAt) {
    facts.push({
      label: copy.rejectedAt,
      value: formatDate(application.rejectedAt),
    });
  }
  if (application.withdrawnAt) {
    facts.push({
      label: copy.withdrawnAt,
      value: formatDate(application.withdrawnAt),
    });
  }
  return facts;
}

export function WorkspaceHeader({
  workspace,
  titleId,
}: {
  readonly workspace: ApplicantWorkspace;
  readonly titleId: string;
}) {
  const { listing, application } = workspace;
  const status = STATUS_PRESENTATION[application.status];
  const title =
    listing.title?.trim() || applicationsCopy.overview.untitledListing;

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col items-start gap-3.5 px-3.5 py-4 sm:flex-row sm:gap-5 sm:p-5"
    >
      <ListingThumbnail
        imageUrl={listing.imageUrl}
        sizes="(min-width: 1024px) 176px, (min-width: 640px) 144px, 84px"
        fallbackLabel={applicationsCopy.overview.noImage}
        className="w-21 sm:w-36 lg:w-44"
      />
      <div className="flex w-full min-w-0 flex-1 flex-col gap-3.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5">
          <div className="flex min-w-0 flex-1 basis-60 flex-col">
            <p className="mb-1 text-caption text-foreground-tertiary">
              {copy.eyebrow}
            </p>
            <h1
              id={titleId}
              className="font-display text-heading-md font-semibold text-pretty wrap-anywhere text-foreground sm:text-title"
            >
              {title}
            </h1>
            <p className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-0.5 text-body text-foreground-secondary">
              {listing.city ? (
                <span className="inline-flex items-center gap-1">
                  <AppIcon icon={MapPin} size={14} decorative />
                  {listing.city}
                </span>
              ) : null}
              {listing.coldRent === null ? null : (
                <span>
                  {applicationsCopy.overview.coldRent(
                    formatEUR(listing.coldRent),
                  )}
                </span>
              )}
            </p>
          </div>
          <ToneBadge
            tone={status.tone}
            icon={status.icon}
            label={status.label}
            srPrefix={copy.statusLabel}
          />
        </div>
        <dl className="flex flex-wrap gap-x-7 gap-y-2">
          {dateFacts(application).map((fact) => (
            <div key={fact.label} className="flex flex-col gap-px">
              <dt className="text-caption text-foreground-tertiary">
                {fact.label}
              </dt>
              <dd className="text-body font-medium text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
