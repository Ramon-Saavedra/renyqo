import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { viewingScheduleErrorCopy } from "@/features/viewing-workflow/present/schedule-error";
import {
  publishViewingSnapshot,
  resetViewingSnapshotsForTests,
  type ViewingSnapshotState,
} from "@/features/viewing-workflow/snapshot/owner";
import { useViewingSnapshot } from "@/features/viewing-workflow/snapshot/use-viewing-snapshot";
import {
  confirmedAppointment,
  pendingReplacement,
  VIEWING_APPLICATION_ID,
  viewingProjection,
  viewingSnapshot,
} from "@/features/viewing-workflow/snapshot/test-projection";
import type { ViewingActions } from "../../hooks/useViewingActions";
import type { AuxiliaryLoad } from "../../hooks/useAuxiliaryLoad";
import { viewingSnapshot as legacyViewing } from "../../testing/fixtures";
import type { ViewingDetail } from "../../api/viewings";
import { ApplicantViewing } from "./ApplicantViewing";
import { CurrentViewingSection } from "./current-viewing/CurrentViewingSection";

const getApplicantViewingWorkflow = vi.hoisted(() => vi.fn());
const acceptApplicantProposal = vi.hoisted(() => vi.fn());
const rejectApplicantProposal = vi.hoisted(() => vi.fn());
const proposeApplicantAlternative = vi.hoisted(() => vi.fn());
const proposeApplicantAppointmentAlternative = vi.hoisted(() => vi.fn());
const withdrawApplicantAlternative = vi.hoisted(() => vi.fn());
const cancelApplicantAppointment = vi.hoisted(() => vi.fn());
const submitApplicantViewingInterest = vi.hoisted(() => vi.fn());

vi.mock("@/features/viewing-workflow/api/applicant-workflow", () => ({
  getApplicantViewingWorkflow,
  acceptApplicantProposal,
  rejectApplicantProposal,
  proposeApplicantAlternative,
  proposeApplicantAppointmentAlternative,
  withdrawApplicantAlternative,
  cancelApplicantAppointment,
  submitApplicantViewingInterest,
}));

const ID = VIEWING_APPLICATION_ID;
const RESULT: WorkflowCommandResult = {
  applicationId: ID,
  workflowId: "workflow-1",
  workflowRevision: 5,
  proposalId: "proposal-2",
  appointmentId: "appointment-1",
};

function interestObligation() {
  return {
    action: "APPLICANT_CONFIRM_POST_VIEWING_INTEREST" as const,
    responsibleSide: "APPLICANT" as const,
    deadlineAt: "2026-10-29T16:00:00.000Z",
    target: {
      applicationId: ID,
      workflowId: "workflow-1",
      proposalId: null,
      appointmentId: "appointment-1",
      section: "VIEWING" as const,
      action: "APPLICANT_CONFIRM_POST_VIEWING_INTEREST",
    },
  };
}

function capability(
  action: WorkflowCapability["action"],
  allowed: boolean,
  ids: {
    readonly proposalId?: string | null;
    readonly appointmentId?: string | null;
  } = {},
): WorkflowCapability {
  return {
    action,
    allowed,
    blockedReason: allowed ? null : "BLOCKED",
    target: {
      applicationId: ID,
      workflowId: "workflow-1",
      proposalId: ids.proposalId ?? null,
      appointmentId: ids.appointmentId ?? null,
      section: "VIEWING",
      action,
    },
  };
}

const actions: ViewingActions = {
  pending: null,
  failed: null,
  conflict: false,
  isBlocked: () => false,
  accept: async () => false,
  decline: async () => false,
  requestAnotherTime: async () => false,
  submitInterest: async () => false,
};

const detail: AuxiliaryLoad<ViewingDetail | null> = {
  state: { status: "ready", data: null },
  retry: () => undefined,
};

function legacyProps() {
  return {
    viewing: legacyViewing(),
    detail,
    status: "ACTIVE" as const,
    actions,
    highlighted: false,
    sectionRef: { current: null },
  };
}

function publishCurrent(overrides: object, revision = 4) {
  publishViewingSnapshot(
    viewingProjection({
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: revision,
      ...overrides,
    }),
    { side: "applicant", source: "workflow", listingId: null, snapshot: null },
  );
}

function Harness({
  onChanged = () => undefined,
}: {
  readonly onChanged?: () => void;
}) {
  const workflow = useViewingSnapshot(ID, "applicant");
  if (!workflow.projection) return null;
  return (
    <ApplicantViewing
      workflow={workflow}
      onChanged={onChanged}
      legacy={legacyProps()}
    />
  );
}

function renderCurrent(overrides: object) {
  const projection = viewingProjection({
    mode: "CURRENT",
    workflowId: "workflow-1",
    workflowRevision: 4,
    ...overrides,
  });
  render(
    <CurrentViewingSection
      applicationId={ID}
      projection={projection}
      refreshError={false}
      onChanged={() => undefined}
      highlighted={false}
      sectionRef={{ current: null }}
    />,
  );
  return projection;
}

describe("applicant current viewing", () => {
  afterEach(() => {
    resetViewingSnapshotsForTests();
    vi.clearAllMocks();
  });

  it("shows a CURRENT invitation and accepts it once", async () => {
    const user = userEvent.setup();
    publishCurrent({
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        proposerSide: "PROVIDER",
        responderSide: "APPLICANT",
        timing: "NORMAL",
        shortNotice: false,
      },
      capabilities: [
        capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
        capability("REJECT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    acceptApplicantProposal.mockResolvedValue(RESULT);
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 5,
        confirmedAppointment,
        pendingProposal: null,
      }),
    );
    render(<Harness />);

    expect(
      screen.getByRole("heading", { name: "Neuer Terminvorschlag" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.queryByRole("button", { name: "Andere Zeit anfragen" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Termin annehmen" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Bestätigter Termin" }),
      ).toBeInstanceOf(HTMLElement);
    });
    expect(acceptApplicantProposal).toHaveBeenCalledTimes(1);
    expect(acceptApplicantProposal.mock.calls[0]?.[2]).toMatchObject({
      expectedWorkflowRevision: 4,
    });
    expect(
      screen.queryByRole("heading", { name: "Neuer Terminvorschlag" }),
    ).toBeNull();
  });

  it("rejects a proposal without sending it again", async () => {
    const user = userEvent.setup();
    publishCurrent({
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        proposerSide: "PROVIDER",
      },
      capabilities: [
        capability("REJECT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    rejectApplicantProposal.mockResolvedValue(RESULT);
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({
        mode: "CURRENT",
        workflowRevision: 5,
        pendingProposal: null,
      }),
    );
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));
    await user.click(screen.getByRole("button", { name: "Termin ablehnen" }));
    await waitFor(() =>
      expect(rejectApplicantProposal).toHaveBeenCalledTimes(1),
    );
  });

  it("withdraws the applicant's own alternative only when that capability is allowed", async () => {
    const user = userEvent.setup();
    renderCurrent({
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("WITHDRAW_ALTERNATIVE", true, { proposalId: "proposal-2" }),
      ],
    });
    withdrawApplicantAlternative.mockResolvedValue(RESULT);
    expect(
      screen.queryByRole("button", { name: "Termin annehmen" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Vorschlag zurückziehen" }),
    );
    await waitFor(() =>
      expect(withdrawApplicantAlternative).toHaveBeenCalledTimes(1),
    );
    expect(withdrawApplicantAlternative.mock.calls[0]?.[1]).toBe("proposal-2");
    expect(withdrawApplicantAlternative.mock.calls[0]?.[2]).toMatchObject({
      expectedWorkflowRevision: 4,
    });
  });

  it("defaults a structured alternative to 30 minutes and keeps an edited end time", async () => {
    const user = userEvent.setup();
    renderCurrent({
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        proposerSide: "PROVIDER",
      },
      capabilities: [
        capability("COUNTERPROPOSE", true, { proposalId: "proposal-2" }),
      ],
    });
    proposeApplicantAlternative.mockResolvedValue(RESULT);
    await user.click(
      screen.getByRole("button", { name: "Andere Zeit vorschlagen" }),
    );
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-01-15" },
    });
    fireEvent.change(screen.getByLabelText("Beginn"), {
      target: { value: "16:00" },
    });
    expect((screen.getByLabelText("Ende") as HTMLInputElement).value).toBe(
      "16:30",
    );
    fireEvent.change(screen.getByLabelText("Ende"), {
      target: { value: "17:00" },
    });
    fireEvent.change(screen.getByLabelText("Beginn"), {
      target: { value: "15:00" },
    });
    expect((screen.getByLabelText("Ende") as HTMLInputElement).value).toBe(
      "17:00",
    );
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    await waitFor(() =>
      expect(proposeApplicantAlternative).toHaveBeenCalledTimes(1),
    );
    expect(proposeApplicantAlternative.mock.calls[0]?.[2]).toMatchObject({
      startsAt: "2026-01-15T14:00:00.000Z",
      endsAt: "2026-01-15T16:00:00.000Z",
      timeZone: "Europe/Berlin",
    });
  });

  it("keeps the entered time and resends once after a short-notice response", async () => {
    const user = userEvent.setup();
    renderCurrent({
      capabilities: [
        capability("PROPOSE_REPLACEMENT", true, {
          appointmentId: "appointment-1",
        }),
      ],
      confirmedAppointment,
    });
    proposeApplicantAppointmentAlternative
      .mockRejectedValueOnce(
        new ApiError(
          400,
          "short notice",
          "http",
          "VIEWING_SHORT_NOTICE_REQUIRED",
          {
            code: "VIEWING_SHORT_NOTICE_REQUIRED",
          },
        ),
      )
      .mockResolvedValueOnce(RESULT);
    await user.click(
      screen.getByRole("button", { name: "Andere Zeit vorschlagen" }),
    );
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-01-15" },
    });
    fireEvent.change(screen.getByLabelText("Beginn"), {
      target: { value: "16:00" },
    });
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect(await screen.findByText(/weniger als 18 Stunden/)).toBeInstanceOf(
      HTMLElement,
    );
    expect((screen.getByLabelText("Beginn") as HTMLInputElement).value).toBe(
      "16:00",
    );
    expect((screen.getByLabelText("Ende") as HTMLInputElement).value).toBe(
      "16:30",
    );
    await user.click(
      screen.getByRole("button", { name: "Trotzdem vorschlagen" }),
    );
    await waitFor(() =>
      expect(proposeApplicantAppointmentAlternative).toHaveBeenCalledTimes(2),
    );
    const first = proposeApplicantAppointmentAlternative.mock.calls[0]?.[2];
    const second = proposeApplicantAppointmentAlternative.mock.calls[1]?.[2];
    expect(first.shortNotice).toBeUndefined();
    expect(second.shortNotice).toBe(true);
    expect(first.requestKey).not.toBe(second.requestKey);
    expect(second.startsAt).toBe(first.startsAt);
  });

  it("shows the same schedule validation copy as the provider", async () => {
    const user = userEvent.setup();
    const message =
      "Viewing must start in the future and last 5 to 240 minutes";
    renderCurrent({
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        proposerSide: "PROVIDER",
      },
      capabilities: [
        capability("COUNTERPROPOSE", true, { proposalId: "proposal-2" }),
      ],
    });
    proposeApplicantAlternative.mockRejectedValueOnce(
      new ApiError(400, message, "http", null, { message }),
    );
    await user.click(
      screen.getByRole("button", { name: "Andere Zeit vorschlagen" }),
    );
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-01-15" },
    });
    fireEvent.change(screen.getByLabelText("Beginn"), {
      target: { value: "16:00" },
    });
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      viewingScheduleErrorCopy.futureAndDuration,
    );
  });

  it("shows a confirmed appointment on its own", () => {
    renderCurrent({ confirmedAppointment, capabilities: [] });
    expect(
      screen.getByRole("heading", { name: "Bestätigter Termin" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.queryByRole("heading", { name: "Ersatzvorschlag" }),
    ).toBeNull();
    expect(screen.queryByText(/bleibt gültig/)).toBeNull();
  });

  it("shows the confirmed appointment and a pending replacement together", () => {
    renderCurrent({
      confirmedAppointment,
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    expect(
      screen.getByRole("heading", { name: "Bestätigter Termin" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.getByRole("heading", { name: "Ersatzvorschlag" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText(/bleibt gültig/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText(/28\. Oktober 2026/)).toBeInstanceOf(HTMLElement);
    expect(screen.getByText(/29\. Oktober 2026/)).toBeInstanceOf(HTMLElement);
  });

  it("refetches after a replacement is accepted and does not drop the confirmed visit early", async () => {
    const user = userEvent.setup();
    publishCurrent({
      confirmedAppointment,
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    acceptApplicantProposal.mockResolvedValue(RESULT);
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({
        mode: "CURRENT",
        workflowId: "workflow-1",
        workflowRevision: 5,
        confirmedAppointment: {
          ...confirmedAppointment,
          startsAt: pendingReplacement.startsAt,
          endsAt: pendingReplacement.endsAt,
        },
        pendingProposal: null,
      }),
    );
    render(<Harness />);
    expect(
      screen.getByRole("heading", { name: "Bestätigter Termin" }),
    ).toBeInstanceOf(HTMLElement);
    await user.click(screen.getByRole("button", { name: "Termin annehmen" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Ersatzvorschlag" }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("heading", { name: "Bestätigter Termin" }),
    ).toBeInstanceOf(HTMLElement);
    expect(acceptApplicantProposal).toHaveBeenCalledTimes(1);
  });

  it("offers cancellation only while the backend capability allows it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CurrentViewingSection
        applicationId={ID}
        projection={viewingProjection({
          mode: "CURRENT",
          workflowId: "workflow-1",
          workflowRevision: 4,
          confirmedAppointment,
          nextRevalidateAt: "2020-01-01T00:00:00.000Z",
          capabilities: [
            capability("CANCEL_APPOINTMENT", false, {
              appointmentId: "appointment-1",
            }),
          ],
        })}
        refreshError={false}
        onChanged={() => undefined}
        highlighted={false}
        sectionRef={{ current: null }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Termin absagen" })).toBeNull();
    rerender(
      <CurrentViewingSection
        applicationId={ID}
        projection={viewingProjection({
          mode: "CURRENT",
          workflowId: "workflow-1",
          workflowRevision: 4,
          confirmedAppointment,
          capabilities: [
            capability("CANCEL_APPOINTMENT", true, {
              appointmentId: "appointment-1",
            }),
          ],
        })}
        refreshError={false}
        onChanged={() => undefined}
        highlighted={false}
        sectionRef={{ current: null }}
      />,
    );
    cancelApplicantAppointment.mockResolvedValue(RESULT);
    await user.click(screen.getByRole("button", { name: "Termin absagen" }));
    fireEvent.change(screen.getByLabelText("Nachricht (optional)"), {
      target: { value: "Ich schaffe es nicht." },
    });
    await user.click(screen.getByRole("button", { name: "Termin absagen" }));
    await waitFor(() =>
      expect(cancelApplicantAppointment).toHaveBeenCalledTimes(1),
    );
    expect(cancelApplicantAppointment.mock.calls[0]?.[2]).toMatchObject({
      message: "Ich schaffe es nicht.",
    });
  });

  it("sends a confirmed withdrawal only for not interested", async () => {
    const user = userEvent.setup();
    renderCurrent({
      outcome: {
        appointmentId: "appointment-1",
        startsAt: confirmedAppointment.startsAt,
        endsAt: confirmedAppointment.endsAt,
        timeZone: "Europe/Berlin",
        outcome: "COMPLETED",
        absenceSide: null,
        revision: 1,
        recordedAt: "2026-10-28T17:00:00.000Z",
        correctionCutoffAt: null,
      },
      applicantInterest: {
        appointmentId: "appointment-1",
        state: "PENDING",
        storedState: "PENDING",
        deadlineAt: "2026-10-30T17:00:00.000Z",
        respondedAt: null,
        lifecycleExpiryPending: false,
      },
      capabilities: [
        capability("SUBMIT_INTEREST", true, { appointmentId: "appointment-1" }),
      ],
    });
    submitApplicantViewingInterest.mockResolvedValue(RESULT);
    expect(screen.getByText(/Rückmeldung bis/)).toBeInstanceOf(HTMLElement);
    await user.click(
      screen.getByRole("button", { name: "Weiter interessiert" }),
    );
    await waitFor(() =>
      expect(submitApplicantViewingInterest).toHaveBeenCalledTimes(1),
    );
    expect(submitApplicantViewingInterest.mock.calls[0]?.[2]).toMatchObject({
      interest: "STILL_INTERESTED",
    });
    expect(
      submitApplicantViewingInterest.mock.calls[0]?.[2].confirmWithdrawal,
    ).toBeUndefined();

    await user.click(
      screen.getByRole("button", { name: "Nicht mehr interessiert" }),
    );
    expect(screen.getByText(/Bewerbung beendet/)).toBeInstanceOf(HTMLElement);
    await user.click(screen.getByRole("button", { name: "Bewerbung beenden" }));
    await waitFor(() =>
      expect(submitApplicantViewingInterest).toHaveBeenCalledTimes(2),
    );
    expect(submitApplicantViewingInterest.mock.calls[1]?.[2]).toMatchObject({
      interest: "NOT_INTERESTED",
      confirmWithdrawal: true,
    });
  });

  it("tells the applicant the latest state was loaded after a stale revision", async () => {
    const user = userEvent.setup();
    publishCurrent({
      pendingProposal: { ...pendingReplacement, baseAppointmentId: null },
      capabilities: [
        capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    acceptApplicantProposal.mockRejectedValue(
      new ApiError(409, "changed", "http", "VIEWING_STATE_CHANGED", {
        code: "VIEWING_STATE_CHANGED",
        applicationId: ID,
        reason: "STALE_REVISION",
        currentWorkflowRevision: 9,
      }),
    );
    getApplicantViewingWorkflow.mockResolvedValue(
      viewingSnapshot({
        mode: "CURRENT",
        workflowRevision: 9,
        pendingProposal: { ...pendingReplacement, baseAppointmentId: null },
        capabilities: [
          capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
        ],
      }),
    );
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Termin annehmen" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Der aktuelle Stand wurde geladen",
    );
    expect(acceptApplicantProposal).toHaveBeenCalledTimes(1);
  });

  it("shows a completed visit without action buttons", () => {
    renderCurrent({
      outcome: {
        appointmentId: "appointment-1",
        startsAt: confirmedAppointment.startsAt,
        endsAt: confirmedAppointment.endsAt,
        timeZone: "Europe/Berlin",
        outcome: "COMPLETED",
        absenceSide: null,
        revision: 1,
        recordedAt: "2026-10-28T17:00:00.000Z",
        correctionCutoffAt: null,
      },
      applicantInterest: {
        appointmentId: "appointment-1",
        state: "STILL_INTERESTED",
        storedState: "STILL_INTERESTED",
        deadlineAt: null,
        respondedAt: "2026-10-28T18:00:00.000Z",
        lifecycleExpiryPending: false,
      },
      capabilities: [
        capability("SUBMIT_INTEREST", false, {
          appointmentId: "appointment-1",
        }),
      ],
    });
    expect(
      screen.getByText("Die Besichtigung hat stattgefunden."),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Du bist weiterhin interessiert.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(
      screen.queryByRole("heading", {
        name: "Bist du weiterhin interessiert?",
      }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Weiter interessiert" }),
    ).toBeNull();
  });

  it("shows read-only interest when the current snapshot has no appointment or outcome", () => {
    renderCurrent({
      confirmedAppointment: null,
      pendingProposal: null,
      outcome: null,
      applicantInterest: {
        appointmentId: "appointment-1",
        state: "STILL_INTERESTED",
        storedState: "STILL_INTERESTED",
        deadlineAt: null,
        respondedAt: "2026-10-28T18:00:00.000Z",
        lifecycleExpiryPending: false,
      },
      obligations: [],
      nextObligation: null,
      capabilities: [
        capability("SUBMIT_INTEREST", false, {
          appointmentId: "appointment-1",
        }),
      ],
    });
    expect(screen.queryByText("Kein Termin")).toBeNull();
    expect(
      screen.queryByText("Der Anbieter hat noch keinen Termin vorgeschlagen."),
    ).toBeNull();
    expect(screen.getByText("Du bist weiterhin interessiert.")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows an outstanding interest obligation without an appointment or outcome", () => {
    renderCurrent({
      confirmedAppointment: null,
      pendingProposal: null,
      outcome: null,
      applicantInterest: null,
      obligations: [interestObligation()],
      nextObligation: null,
      capabilities: [capability("SUBMIT_INTEREST", false)],
    });
    expect(screen.queryByText("Kein Termin")).toBeNull();
    expect(
      screen.queryByText("Der Anbieter hat noch keinen Termin vorgeschlagen."),
    ).toBeNull();
    expect(
      screen.getByText(
        "Deine Rückmeldung nach der Besichtigung steht noch aus.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("shows the next interest obligation when the obligations list is empty", () => {
    renderCurrent({
      confirmedAppointment: null,
      pendingProposal: null,
      outcome: null,
      applicantInterest: null,
      obligations: [],
      nextObligation: interestObligation(),
      capabilities: [capability("SUBMIT_INTEREST", false)],
    });
    expect(screen.queryByText("Kein Termin")).toBeNull();
    expect(
      screen.getByText(
        "Deine Rückmeldung nach der Besichtigung steht noch aus.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("keeps the legacy viewing flow for LEGACY mode", () => {
    const state: ViewingSnapshotState = {
      status: "ready",
      projection: viewingProjection({
        mode: "LEGACY",
        reconciliationRequired: true,
      }),
      snapshot: null,
      error: null,
    };
    render(
      <ApplicantViewing
        workflow={state}
        onChanged={() => undefined}
        legacy={legacyProps()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Andere Zeit anfragen" }),
    ).toBeInstanceOf(HTMLElement);
    expect(
      screen.queryByRole("heading", { name: "Neuer Terminvorschlag" }),
    ).toBeNull();
  });

  it("does not call a missing appointment cancelled", () => {
    renderCurrent({
      confirmedAppointment: null,
      latestAppointment: null,
      pendingProposal: null,
      capabilities: [
        capability("COUNTERPROPOSE", true, { proposalId: "proposal-2" }),
      ],
    });
    expect(screen.queryByText("Der Termin wurde abgesagt.")).toBeNull();
  });

  it("shows a cancelled appointment when the appointment itself is cancelled", () => {
    renderCurrent({
      confirmedAppointment: null,
      latestAppointment: {
        appointmentId: "appointment-9",
        status: "CANCELLED",
        proposalId: "proposal-9",
        startsAt: "2026-10-28T16:00:00.000Z",
        endsAt: "2026-10-28T16:30:00.000Z",
        timeZone: "Europe/Berlin",
        cancellation: {
          cancelledAt: "2026-10-27T10:00:00.000Z",
          by: "APPLICANT",
          reason: "APPLICANT_CANCELLED",
          message: null,
          late: false,
        },
      },
      capabilities: [],
    });
    expect(screen.getByText("Der Termin wurde abgesagt.")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("shows a pending proposal without a cancelled message when no appointment exists", () => {
    renderCurrent({
      confirmedAppointment: null,
      latestAppointment: null,
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        proposerSide: "PROVIDER",
      },
      capabilities: [],
    });
    expect(
      screen.getByRole("heading", { name: "Neuer Terminvorschlag" }),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Der Termin wurde abgesagt.")).toBeNull();
  });

  it("does not hide an allowed action because a deadline has passed", () => {
    renderCurrent({
      pendingProposal: {
        ...pendingReplacement,
        baseAppointmentId: null,
        responseDeadlineAt: "2020-01-01T00:00:00.000Z",
      },
      nextRevalidateAt: "2020-01-01T00:00:00.000Z",
      capabilities: [
        capability("ACCEPT_PROPOSAL", true, { proposalId: "proposal-2" }),
      ],
    });
    expect(
      (
        screen.getByRole("button", {
          name: "Termin annehmen",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
