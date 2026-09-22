import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Candidate } from "../types";
import { CandidateLane } from "./CandidateLane";

const candidate: Candidate = {
  id: "candidate-1",
  objectId: "object-1",
  initials: "AL",
  name: "Anna Lehmann",
  household: "2 Personen",
  warnings: [],
  introduction: null,
  activeAtLabel: null,
};

const fullCandidateSet = Array.from({ length: 5 }, (_, index) => ({
  ...candidate,
  id: `candidate-${index + 1}`,
}));

describe("CandidateLane", () => {
  it("announces waiting count changes", () => {
    const { rerender } = render(
      <CandidateLane
        actives={fullCandidateSet}
        waitingCount={1}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole("status", { name: "+1 wartet" })
        .getAttribute("aria-live"),
    ).toBe("polite");
    rerender(
      <CandidateLane
        actives={fullCandidateSet}
        waitingCount={2}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByRole("status", { name: "+2 warten" })).not.toBeNull();
  });

  it("does not announce a waiting status when disabled", () => {
    render(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        announceWaitingStatus={false}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the candidate card target used by flag positioning", () => {
    const { container } = render(
      <CandidateLane
        actives={[{ ...candidate, warnings: ["smoking_by_arrangement"] }]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(container.querySelector("[data-rq-candidate-card]")).not.toBeNull();
  });

  it("opens the candidate preview from the profile action", () => {
    const onOpenPreview = vi.fn();
    render(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        onOpenPreview={onOpenPreview}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Anna Lehmann/ }));
    expect(onOpenPreview).toHaveBeenCalledWith(candidate);
  });

  it("exposes candidate rejection through an accessible action", () => {
    const onRejectCandidate = vi.fn();
    const { rerender } = render(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
        onRejectCandidate={onRejectCandidate}
        rejectingApplicationId={candidate.id}
      />,
    );
    const rejectButton = screen.getByRole("button", {
      name: "Anna Lehmann ablehnen",
    });
    expect((rejectButton as HTMLButtonElement).disabled).toBe(true);
    expect(rejectButton.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(rejectButton);
    expect(onRejectCandidate).not.toHaveBeenCalled();
    rerender(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
        onRejectCandidate={onRejectCandidate}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );
    expect(onRejectCandidate).toHaveBeenCalledWith(candidate);
  });
});
