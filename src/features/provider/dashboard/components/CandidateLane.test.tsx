import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyApplicationAttentionSummary } from "@/lib/attention/fixtures";
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
  attention: emptyApplicationAttentionSummary(),
};

const fullCandidateSet = Array.from({ length: 5 }, (_, index) => ({
  ...candidate,
  id: `candidate-${index + 1}`,
}));

describe("CandidateLane", () => {
  it("renders application attention above the candidate card, outside the bordered card", () => {
    const { container } = render(
      <CandidateLane
        actives={[
          {
            ...candidate,
            attention: {
              ...emptyApplicationAttentionSummary(),
              actionableUnreadMessageCount: 1,
            },
          },
        ]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
      />,
    );

    const card = container.querySelector("[data-rq-candidate-card]");
    expect(card).not.toBeNull();
    const strip = screen.getByText("1 ungelesene Nachricht");
    const profileButton = screen.getByRole("button", { name: /Anna Lehmann/ });
    expect(card?.contains(strip)).toBe(false);
    expect(strip.compareDocumentPosition(card as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(strip.compareDocumentPosition(profileButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(profileButton.textContent?.includes("1 ungelesene Nachricht")).toBe(
      false,
    );
  });

  it("reserves attention slot height on every card so card tops stay aligned", () => {
    const { container } = render(
      <CandidateLane
        actives={[
          candidate,
          {
            ...candidate,
            id: "candidate-2",
            name: "Benno",
            initials: "BE",
            attention: {
              ...emptyApplicationAttentionSummary(),
              actionableUnreadMessageCount: 1,
            },
          },
        ]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
      />,
    );

    const attentionSlots = container.querySelectorAll(
      "[data-rq-candidate-attention-slot]",
    );
    expect(attentionSlots).toHaveLength(2);
    for (const slot of attentionSlots) {
      expect(slot.parentElement?.className).toContain("grid-rows-subgrid");
      expect((slot as HTMLElement).style.height).toBe("");
    }
    expect(screen.queryByText("1 ungelesene Nachricht")).not.toBeNull();
  });

  it("elevates actionable applicant cards on hover while keeping button focus", () => {
    const { container } = render(
      <CandidateLane
        actives={[candidate]}
        waitingCount={0}
        onOpenPreview={vi.fn()}
      />,
    );
    const card = container.querySelector("[data-rq-candidate-card]");
    expect(card?.classList.contains("hover:shadow-card")).toBe(true);
    expect(card?.classList.contains("shadow-card")).toBe(false);
    expect(
      screen
        .getByRole("button", { name: /Anna Lehmann/ })
        .classList.contains("focus-visible:shadow-focus"),
    ).toBe(true);
  });

  it("aligns the waiting queue cell with the same attention slot and card shell", () => {
    const { container } = render(
      <CandidateLane
        actives={fullCandidateSet}
        waitingCount={2}
        onOpenPreview={vi.fn()}
      />,
    );

    const queue = container.querySelector("[data-rq-queue-indicator]");
    expect(queue).not.toBeNull();
    expect(
      queue?.previousElementSibling?.hasAttribute(
        "data-rq-candidate-attention-slot",
      ),
    ).toBe(true);
    expect(queue?.className).toContain("border-border/50");
    expect(
      container.querySelectorAll("[data-rq-candidate-attention-slot]"),
    ).toHaveLength(6);
  });

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
