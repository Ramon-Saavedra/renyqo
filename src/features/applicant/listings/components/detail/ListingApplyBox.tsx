import { Button } from "@/components/ui/button/Button";
import { listingDetailCopy } from "../../copy/listing-detail";
import type { ProfileMatchResult } from "../../types";
import { MatchBadge, type MatchBadgeTone } from "../MatchBadge";

interface ListingApplyBoxProps {
  matchesProfile: ProfileMatchResult;
}

const BOX_CLASS =
  "flex w-fit flex-col gap-2.5 rounded-lg border border-border p-4 max-sm:w-full";

const ACTION_ROW_CLASS = "flex items-center gap-3";

const { apply, match } = listingDetailCopy;

function matchTone(value: ProfileMatchResult): MatchBadgeTone {
  if (value === "match") return "match";
  if (value === "no-match") return "no-match";
  return "incomplete";
}

function matchLabel(value: ProfileMatchResult): string {
  if (value === "match") return match.matches;
  if (value === "no-match") return match.doesNotMatch;
  if (value === "incomplete") return match.incomplete;
  return match.unknown;
}

export function ListingApplyBox({ matchesProfile }: ListingApplyBoxProps) {
  return (
    <div className={BOX_CLASS}>
      <div className={ACTION_ROW_CLASS}>
        <MatchBadge
          tone={matchTone(matchesProfile)}
          size="md"
          className="min-w-0"
        >
          <span className="truncate">{matchLabel(matchesProfile)}</span>
        </MatchBadge>

        <Button variant="primary" disabled>
          {apply.label}
        </Button>
      </div>
    </div>
  );
}
