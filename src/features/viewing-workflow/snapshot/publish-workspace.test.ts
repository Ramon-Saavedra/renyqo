import { afterEach, describe, expect, it, vi } from "vitest";
import { getApplicantWorkspace } from "@/features/applicant/applications/api/workspace";
import {
  APPLICATION_ID,
  createWorkspace,
} from "@/features/applicant/applications/testing/fixtures";
import { getApplicantWorkspace as getProviderWorkspace } from "@/features/provider/dashboard/applicant-workflow/api/workspace";
import type * as ApiClient from "@/lib/api/client";
import { createApplicantWorkspace } from "@/features/provider/dashboard/applicant-workflow/testing/workspace-fixture";
import {
  getViewingSnapshotState,
  invalidateViewingSnapshotsForListing,
  resetViewingSnapshotsForTests,
} from "./owner";
import {
  confirmedAppointment,
  pendingReplacement,
  viewingProjection,
  viewingSnapshot,
} from "./test-projection";

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return { ...actual, apiGet: apiGetMock };
});

describe("embedded viewing snapshot publication", () => {
  afterEach(() => {
    resetViewingSnapshotsForTests();
    apiGetMock.mockReset();
  });

  it("ignores a legacy workspace summary", async () => {
    apiGetMock.mockResolvedValue(createWorkspace());

    await getApplicantWorkspace(APPLICATION_ID);

    expect(getViewingSnapshotState(APPLICATION_ID).status).toBe("idle");
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });

  it("publishes the applicant projection and refetches that listing from the workflow GET", async () => {
    const projection = viewingProjection({
      applicationId: APPLICATION_ID,
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: 4,
      confirmedAppointment,
      pendingProposal: pendingReplacement,
    });
    apiGetMock.mockImplementation((path: string) => {
      if (path.includes("/viewing-workflow")) {
        return Promise.resolve(
          viewingSnapshot({
            ...projection,
            workflowRevision: 7,
            asOf: "2026-10-26T10:00:00.000Z",
          }),
        );
      }
      return Promise.resolve({
        ...createWorkspace(),
        viewingSummary: {
          ...createWorkspace().viewingSummary,
          ...projection,
        },
      });
    });

    await getApplicantWorkspace(APPLICATION_ID);
    const published = getViewingSnapshotState(APPLICATION_ID);
    expect(published.projection?.mode).toBe("CURRENT");
    expect(published.projection?.confirmedAppointment?.appointmentId).toBe(
      "appointment-1",
    );
    expect(published.projection?.pendingProposal?.proposalId).toBe(
      "proposal-2",
    );
    expect(published.snapshot).toBeNull();

    invalidateViewingSnapshotsForListing("listing-1");
    await vi.waitFor(() => {
      expect(
        getViewingSnapshotState(APPLICATION_ID).snapshot?.workflowRevision,
      ).toBe(7);
    });
    expect(apiGetMock).toHaveBeenCalledWith(
      `/api/v1/applicant/applications/${encodeURIComponent(APPLICATION_ID)}/viewing-workflow`,
      undefined,
    );
  });

  it("publishes a provider projection without a listing id", async () => {
    const projection = viewingProjection({
      mode: "LEGACY",
      reconciliationRequired: true,
      asOf: "2026-10-26T09:00:00.000Z",
    });
    apiGetMock.mockResolvedValue({
      ...createApplicantWorkspace(),
      viewingSummary: {
        ...createApplicantWorkspace().viewingSummary,
        ...projection,
      },
    });

    await getProviderWorkspace("application-1");

    expect(getViewingSnapshotState("application-1").projection?.mode).toBe(
      "LEGACY",
    );
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    invalidateViewingSnapshotsForListing("listing-1");
    await Promise.resolve();
    expect(apiGetMock).toHaveBeenCalledTimes(1);
  });
});
