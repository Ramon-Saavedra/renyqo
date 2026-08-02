import { applicantProfileCopy } from "../copy/applicant-profile";

const KICKER_CLASS =
  "mb-3.5 flex items-center gap-2.5 font-mono text-meta uppercase text-foreground-tertiary";
const SEP_CLASS = "h-px w-4.5 bg-border-strong";
const TITLE_CLASS =
  "mb-3 font-display text-heading-xl font-medium text-foreground";
const LEAD_CLASS =
  "max-w-lg text-lead font-normal leading-normal text-foreground-secondary";

export function ApplicantProfileHero() {
  const copy = applicantProfileCopy.hero;

  return (
    <div className="mb-8">
      <div className={KICKER_CLASS}>
        <span>{copy.kicker}</span>
        <span aria-hidden="true" className={SEP_CLASS} />
        <span>{copy.kickerAside}</span>
      </div>
      <h1 className={TITLE_CLASS}>{copy.title}</h1>
      <p className={LEAD_CLASS}>{copy.lead}</p>
    </div>
  );
}
