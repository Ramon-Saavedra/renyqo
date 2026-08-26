import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CandidateCard } from "./CandidateCard";
import type { Candidate } from "../types";

const candidate: Candidate = {
  id: "candidate-1",
  objectId: "object-1",
  initials: "AL",
  name: "Anna Lehmann",
  household: "2 Personen",
  warnings: [],
};

function candidateWithWarnings(
  warnings: Candidate["warnings"],
): Candidate {
  return { ...candidate, warnings };
}

describe("CandidateCard", () => {
  it("renders only the applicant identity and household size when there are no warnings", () => {
    render(<CandidateCard candidate={candidate} />);

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getByText("2 Personen")).not.toBeNull();
    expect(screen.queryByText("anna@example.com")).toBeNull();
    expect(screen.queryByText("3.200 €")).toBeNull();
    expect(screen.queryByText("SCHUFA")).toBeNull();
    expect(screen.queryByText("Passend")).toBeNull();
    expect(screen.queryByText("Rückfrage: Haustiere")).toBeNull();
    expect(screen.queryByText("Rückfrage: Rauchen")).toBeNull();
  });

  it("is not interactive", () => {
    const { container } = render(<CandidateCard candidate={candidate} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.firstElementChild?.className).not.toContain(
      "cursor-pointer",
    );
  });

  it("renders the pets warning with an icon", () => {
    const { container } = render(
      <CandidateCard candidate={candidateWithWarnings(["pets_by_arrangement"])} />,
    );

    expect(screen.getByText("Rückfrage: Haustiere")).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("pets_by_arrangement")).toBeNull();
  });

  it("renders the smoking warning with an icon", () => {
    const { container } = render(
      <CandidateCard
        candidate={candidateWithWarnings(["smoking_by_arrangement"])}
      />,
    );

    expect(screen.getByText("Rückfrage: Rauchen")).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText("smoking_by_arrangement")).toBeNull();
  });

  it("renders both warnings when present", () => {
    const { container } = render(
      <CandidateCard
        candidate={candidateWithWarnings([
          "pets_by_arrangement",
          "smoking_by_arrangement",
        ])}
      />,
    );

    expect(screen.getByText("Rückfrage: Haustiere")).not.toBeNull();
    expect(screen.getByText("Rückfrage: Rauchen")).not.toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});
