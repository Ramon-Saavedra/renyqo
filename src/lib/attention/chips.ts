import type { LucideIcon } from "lucide-react";
import { CalendarClock, FileSearch, FileUp, MessageSquare } from "lucide-react";
import { attentionCopy } from "./copy";
import { documentAttentionTypeLabel } from "./document-labels";
import type { ApplicationAttentionSummary, AttentionTotals } from "./types";

export type AttentionChipKind =
  | "pending"
  | "messages"
  | "documentUpload"
  | "documentReview"
  | "viewing";

export interface AttentionChipModel {
  readonly kind: AttentionChipKind;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly count: number;
  readonly emphasis: boolean;
}

function pushChip(chips: AttentionChipModel[], chip: AttentionChipModel): void {
  chips.push(chip);
}

export function buildApplicationAttentionChips(
  attention: ApplicationAttentionSummary,
): readonly AttentionChipModel[] {
  const chips: AttentionChipModel[] = [];

  if (attention.pendingActionCount > 0) {
    pushChip(chips, {
      kind: "pending",
      label: attentionCopy.pendingActions(attention.pendingActionCount),
      icon: FileUp,
      count: attention.pendingActionCount,
      emphasis: true,
    });
  }

  if (attention.actionableUnreadMessageCount > 0) {
    pushChip(chips, {
      kind: "messages",
      label: attentionCopy.unreadMessages(
        attention.actionableUnreadMessageCount,
      ),
      icon: MessageSquare,
      count: attention.actionableUnreadMessageCount,
      emphasis: false,
    });
  }

  const { categories } = attention;

  const uploadIndicators = attention.documentIndicators.filter(
    (indicator) => indicator.status === "UPLOAD_REQUIRED",
  );
  if (uploadIndicators.length > 0) {
    for (const indicator of uploadIndicators) {
      pushChip(chips, {
        kind: "documentUpload",
        label: attentionCopy.documentUploadRequired(
          documentAttentionTypeLabel(indicator.type, indicator.customLabel),
        ),
        icon: FileUp,
        count: 1,
        emphasis: true,
      });
    }
  } else if (categories.documentUploadCount > 0) {
    pushChip(chips, {
      kind: "documentUpload",
      label: attentionCopy.documentUpload(categories.documentUploadCount),
      icon: FileUp,
      count: categories.documentUploadCount,
      emphasis: true,
    });
  }

  if (categories.documentReviewCount > 0) {
    pushChip(chips, {
      kind: "documentReview",
      label: attentionCopy.documentReview(categories.documentReviewCount),
      icon: FileSearch,
      count: categories.documentReviewCount,
      emphasis: true,
    });
  }

  if (categories.viewingActionCount > 0) {
    pushChip(chips, {
      kind: "viewing",
      label: attentionCopy.viewingAction(categories.viewingActionCount),
      icon: CalendarClock,
      count: categories.viewingActionCount,
      emphasis: true,
    });
  }

  return chips;
}

const GLOBAL_MENU_CONCRETE_CHIP_KINDS = new Set<AttentionChipKind>([
  "messages",
  "documentUpload",
  "documentReview",
  "viewing",
]);

/** Hides generic pending rows when concrete category chips already explain the surface. */
export function filterGlobalMenuAttentionChips(
  chips: readonly AttentionChipModel[],
): readonly AttentionChipModel[] {
  const hasConcrete = chips.some((chip) =>
    GLOBAL_MENU_CONCRETE_CHIP_KINDS.has(chip.kind),
  );
  if (!hasConcrete) return chips;
  return chips.filter((chip) => chip.kind !== "pending");
}

export function buildListingAttentionChips(
  attention: AttentionTotals,
): readonly AttentionChipModel[] {
  const chips: AttentionChipModel[] = [];

  if (attention.totalPendingActions > 0) {
    pushChip(chips, {
      kind: "pending",
      label: attentionCopy.pendingActions(attention.totalPendingActions),
      icon: FileUp,
      count: attention.totalPendingActions,
      emphasis: true,
    });
  }

  if (attention.actionableUnreadMessageCount > 0) {
    pushChip(chips, {
      kind: "messages",
      label: attentionCopy.unreadMessages(
        attention.actionableUnreadMessageCount,
      ),
      icon: MessageSquare,
      count: attention.actionableUnreadMessageCount,
      emphasis: false,
    });
  }

  const { categories } = attention;

  if (categories.documentUploadCount > 0) {
    pushChip(chips, {
      kind: "documentUpload",
      label: attentionCopy.documentUpload(categories.documentUploadCount),
      icon: FileUp,
      count: categories.documentUploadCount,
      emphasis: true,
    });
  }

  if (categories.documentReviewCount > 0) {
    pushChip(chips, {
      kind: "documentReview",
      label: attentionCopy.documentReview(categories.documentReviewCount),
      icon: FileSearch,
      count: categories.documentReviewCount,
      emphasis: true,
    });
  }

  if (categories.viewingActionCount > 0) {
    pushChip(chips, {
      kind: "viewing",
      label: attentionCopy.viewingAction(categories.viewingActionCount),
      icon: CalendarClock,
      count: categories.viewingActionCount,
      emphasis: true,
    });
  }

  return chips;
}

export type AttentionIconGroupId = AttentionChipKind | "file-upload";

export interface AttentionIconGroup {
  readonly id: AttentionIconGroupId;
  readonly kind: AttentionChipKind;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly count: number;
}

function attentionIconGroupId(kind: AttentionChipKind): AttentionIconGroupId {
  if (kind === "pending" || kind === "documentUpload") return "file-upload";
  return kind;
}

/** One icon per visual group for compact listing-card UI (tooltips keep full labels). */
export function groupAttentionChipsForIcons(
  chips: readonly AttentionChipModel[],
): readonly AttentionIconGroup[] {
  const groups = new Map<
    AttentionIconGroupId,
    [AttentionChipModel, ...AttentionChipModel[]]
  >();

  for (const chip of chips) {
    const id = attentionIconGroupId(chip.kind);
    const group = groups.get(id);
    if (group) group.push(chip);
    else groups.set(id, [chip]);
  }

  return Array.from(groups, ([id, items]) => {
    const first = items[0];
    const representative =
      items.find((item) => item.kind === "documentUpload") ??
      items.find((item) => item.kind === "pending") ??
      first;
    const uploadItems = items.filter((item) => item.kind === "documentUpload");
    const count =
      id === "file-upload" && uploadItems.length > 0
        ? uploadItems.reduce((sum, item) => sum + item.count, 0)
        : items.reduce((sum, item) => sum + item.count, 0);
    return {
      id,
      kind: representative.kind,
      icon: representative.icon,
      label: items.map((item) => item.label).join(", "),
      count,
    };
  });
}
