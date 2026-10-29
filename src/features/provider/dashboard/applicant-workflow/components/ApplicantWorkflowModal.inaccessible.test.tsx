import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applicantWorkflowCopy } from "../copy";
import { ApplicantWorkspaceView } from "./ApplicantWorkspaceView";

vi.mock("../hooks/useApplicantWorkspace", () => ({
  useApplicantWorkspace: () => ({
    state: { status: "inaccessible" },
    reload: () => undefined,
  }),
}));

describe("ApplicantWorkspaceView inaccessible application", () => {
  it("reuses the existing unavailable state", () => {
    render(
      <ApplicantWorkspaceView
        applicationId="unauthorized-application"
        listing={{
          id: "listing-1",
          title: "Haus",
          city: "Bawinkel",
          coldRent: 900,
          status: "published",
          rooms: "9",
          livingArea: 180,
        }}
        onClose={() => undefined}
        onReject={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: applicantWorkflowCopy.unavailableApplication,
      }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("unauthorized-application")).toBeNull();
  });
});
