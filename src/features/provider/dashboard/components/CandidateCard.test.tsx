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
  badge: "askback",
  attrs: [
    { label: "Einkommen", value: "Offen", state: "open" },
    { label: "SCHUFA", value: "Vorhanden", state: "ok" },
    { label: "Haustiere", value: "Nein", state: "muted" },
  ],
};

describe("CandidateCard", () => {
  it("renders candidate identity, badge, attributes, and actions", () => {
    render(<CandidateCard candidate={candidate} />);

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getByText("2 Personen")).not.toBeNull();
    expect(screen.getByText("Rückfrage")).not.toBeNull();
    expect(screen.getByText("Einkommen")).not.toBeNull();
    expect(screen.getByText("Offen")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Profil" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Chat öffnen" })).not.toBeNull();
  });
});
