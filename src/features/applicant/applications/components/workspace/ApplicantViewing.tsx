import type { ViewingSnapshotState } from "@/features/viewing-workflow/snapshot/owner";
import { ViewingSection, type ViewingSectionProps } from "./ViewingSection";
import { CurrentViewingSection } from "./current-viewing/CurrentViewingSection";

export function ApplicantViewing({
  workflow,
  onChanged,
  legacy,
}: {
  readonly workflow: ViewingSnapshotState;
  readonly onChanged: () => void;
  readonly legacy: ViewingSectionProps;
}) {
  const projection = workflow.projection;
  if (
    projection &&
    (projection.mode === "CURRENT" || projection.mode === "EMPTY")
  ) {
    return (
      <CurrentViewingSection
        applicationId={projection.applicationId}
        projection={projection}
        refreshError={workflow.error !== null}
        onChanged={onChanged}
        highlighted={legacy.highlighted}
        sectionRef={legacy.sectionRef}
        className={legacy.className}
      />
    );
  }
  return <ViewingSection {...legacy} />;
}
