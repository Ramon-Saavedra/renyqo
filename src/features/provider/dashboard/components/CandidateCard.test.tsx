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
};

describe("CandidateCard", () => {
  it("renders only the applicant identity and household size", () => {
    render(<CandidateCard candidate={candidate} />);

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getByText("2 Personen")).not.toBeNull();
    expect(screen.queryByText("anna@example.com")).toBeNull();
    expect(screen.queryByText("3.200 €")).toBeNull();
    expect(screen.queryByText("SCHUFA")).toBeNull();
    expect(screen.queryByText("Haustiere")).toBeNull();
    expect(screen.queryByText("Nichtraucher")).toBeNull();
    expect(screen.queryByText("Passend")).toBeNull();
    expect(screen.queryByText("Rückfrage")).toBeNull();
  });

  it("is not interactive", () => {
    const { container } = render(<CandidateCard candidate={candidate} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.firstElementChild?.className).not.toContain(
      "cursor-pointer",
    );
  });
});
