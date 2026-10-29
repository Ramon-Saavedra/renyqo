import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";
import type { WorkflowCapability } from "@/lib/viewing-workflow/snapshot-schema";
import { viewingScheduleErrorCopy } from "@/features/viewing-workflow/present/schedule-error";
import { resetViewingSnapshotsForTests } from "@/features/viewing-workflow/snapshot/owner";
import {
  confirmedAppointment,
  pendingReplacement,
  VIEWING_APPLICATION_ID,
  viewingProjection,
  viewingSnapshot,
} from "@/features/viewing-workflow/snapshot/test-projection";
import type { ListingStatus } from "@/features/provider/listings-overview/types";
import { createApplicantWorkspace } from "../testing/workspace-fixture";
import {
  buildApplicantWorkflowModel,
  type WorkflowListingContext,
} from "../workflow-model";
import { ViewingSection } from "./ViewingSection";
import { ProviderCurrentViewing } from "./current-viewing/ProviderCurrentViewing";

const getProviderViewingWorkflow = vi.hoisted(() => vi.fn());
const inviteToProviderViewing = vi.hoisted(() => vi.fn());
const acceptProviderProposal = vi.hoisted(() => vi.fn());
const rejectProviderProposal = vi.hoisted(() => vi.fn());
const counterproposeProviderViewing = vi.hoisted(() => vi.fn());
const proposeProviderReplacement = vi.hoisted(() => vi.fn());
const closeProviderViewingWorkflow = vi.hoisted(() => vi.fn());
const recordProviderViewingOutcome = vi.hoisted(() => vi.fn());
const setProviderViewingConsideration = vi.hoisted(() => vi.fn());

vi.mock("@/features/viewing-workflow/api/provider-workflow", () => ({
  getProviderViewingWorkflow,
  inviteToProviderViewing,
  acceptProviderProposal,
  rejectProviderProposal,
  counterproposeProviderViewing,
  proposeProviderReplacement,
  closeProviderViewingWorkflow,
  recordProviderViewingOutcome,
  setProviderViewingConsideration,
}));

const RESULT: WorkflowCommandResult = {
  applicationId: VIEWING_APPLICATION_ID,
  workflowId: "workflow-1",
  workflowRevision: 6,
  proposalId: "proposal-2",
  appointmentId: "appointment-1",
};

const listing: WorkflowListingContext = {
  id: "object-1",
  title: "Wohnung Mitte",
  city: "Berlin-Mitte",
  coldRent: 900,
  status: "published" satisfies ListingStatus,
  rooms: "2",
  livingArea: 60,
};

function capability(
  action: WorkflowCapability["action"],
  ids: {
    readonly proposalId?: string | null;
    readonly appointmentId?: string | null;
  } = {},
): WorkflowCapability {
  return {
    action,
    allowed: true,
    blockedReason: null,
    target: {
      applicationId: VIEWING_APPLICATION_ID,
      workflowId: "workflow-1",
      proposalId: ids.proposalId ?? null,
      appointmentId: ids.appointmentId ?? null,
      section: "VIEWING",
      action,
    },
  };
}

function renderCurrent(overrides: object = {}) {
  return render(
    <ProviderCurrentViewing
      applicationId={VIEWING_APPLICATION_ID}
      projection={viewingProjection(overrides)}
      refreshError={false}
      onChanged={() => undefined}
    />,
  );
}

function fillSchedule(start = "16:00", end?: string) {
  fireEvent.change(screen.getByLabelText("Datum"), {
    target: { value: "2026-01-15" },
  });
  fireEvent.change(screen.getByLabelText("Beginn"), {
    target: { value: start },
  });
  if (end) {
    fireEvent.change(screen.getByLabelText("Ende"), {
      target: { value: end },
    });
  }
}

const recordedOutcome = {
  appointmentId: "appointment-1",
  startsAt: "2026-10-28T16:00:00.000Z",
  endsAt: "2026-10-28T16:30:00.000Z",
  timeZone: "Europe/Berlin",
  outcome: "COMPLETED" as const,
  absenceSide: null,
  revision: 1,
  recordedAt: "2026-10-28T17:00:00.000Z",
  correctionCutoffAt: null,
};

const interest = {
  appointmentId: "appointment-1",
  storedState: null,
  deadlineAt: null,
  respondedAt: null,
  lifecycleExpiryPending: false,
};

beforeEach(() => {
  resetViewingSnapshotsForTests();
  getProviderViewingWorkflow.mockResolvedValue(viewingSnapshot());
  inviteToProviderViewing.mockResolvedValue(RESULT);
  acceptProviderProposal.mockResolvedValue(RESULT);
  rejectProviderProposal.mockResolvedValue(RESULT);
  counterproposeProviderViewing.mockResolvedValue(RESULT);
  proposeProviderReplacement.mockResolvedValue(RESULT);
  closeProviderViewingWorkflow.mockResolvedValue(RESULT);
  recordProviderViewingOutcome.mockResolvedValue(RESULT);
  setProviderViewingConsideration.mockResolvedValue(RESULT);
});

afterEach(() => {
  resetViewingSnapshotsForTests();
  vi.clearAllMocks();
});

describe("provider current viewing", () => {
  it("shows the invite form for an empty workflow", () => {
    renderCurrent();
    expect(screen.getByLabelText("Datum")).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText("Beginn")).toBeInstanceOf(HTMLElement);
    expect(screen.getByLabelText("Ende")).toBeInstanceOf(HTMLElement);
    expect(screen.queryByText("Kein Termin")).toBeNull();
  });

  it("defaults the end to 30 minutes and keeps an edited end", async () => {
    const user = userEvent.setup();
    renderCurrent({ workflowRevision: 4 });
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
    fillSchedule("15:00");
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    await waitFor(() =>
      expect(inviteToProviderViewing).toHaveBeenCalledTimes(1),
    );
    expect(inviteToProviderViewing.mock.calls[0]?.[1]).toMatchObject({
      startsAt: "2026-01-15T14:00:00.000Z",
      endsAt: "2026-01-15T16:00:00.000Z",
      timeZone: "Europe/Berlin",
      expectedWorkflowRevision: 4,
    });
    expect(
      inviteToProviderViewing.mock.calls[0]?.[1].shortNotice,
    ).toBeUndefined();
  });

  it("keeps the form and asks before sending a short-notice invitation", async () => {
    const user = userEvent.setup();
    inviteToProviderViewing
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
    renderCurrent();
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect(await screen.findByText(/weniger als 18 Stunden/)).toBeInstanceOf(
      HTMLElement,
    );
    expect((screen.getByLabelText("Datum") as HTMLInputElement).value).toBe(
      "2026-01-15",
    );
    expect((screen.getByLabelText("Beginn") as HTMLInputElement).value).toBe(
      "16:00",
    );
    expect(
      inviteToProviderViewing.mock.calls[0]?.[1].shortNotice,
    ).toBeUndefined();
    await user.click(
      screen.getByRole("button", { name: "Trotzdem vorschlagen" }),
    );
    await waitFor(() =>
      expect(inviteToProviderViewing).toHaveBeenCalledTimes(2),
    );
    expect(inviteToProviderViewing.mock.calls[1]?.[1].shortNotice).toBe(true);
    expect(inviteToProviderViewing.mock.calls[0]?.[1].requestKey).not.toBe(
      inviteToProviderViewing.mock.calls[1]?.[1].requestKey,
    );
  });

  it("shows the backend future and duration validation in German", async () => {
    const user = userEvent.setup();
    const message =
      "Viewing must start in the future and last 5 to 240 minutes";
    inviteToProviderViewing.mockRejectedValueOnce(
      new ApiError(400, message, "http", null, { message }),
    );
    renderCurrent();
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      viewingScheduleErrorCopy.futureAndDuration,
    );
    expect(
      screen.queryByText(
        "Das hat nicht geklappt. Bitte prüfe deine Eingabe und versuche es erneut.",
      ),
    ).toBeNull();
    expect((screen.getByLabelText("Datum") as HTMLInputElement).value).toBe(
      "2026-01-15",
    );
  });

  it("sends the date shown in the field when the draft still has an older date", async () => {
    const user = userEvent.setup();
    renderCurrent();
    fireEvent.change(screen.getByLabelText("Datum"), {
      target: { value: "2026-10-13" },
    });
    fireEvent.change(screen.getByLabelText("Beginn"), {
      target: { value: "16:51" },
    });
    const date = screen.getByLabelText("Datum") as HTMLInputElement;
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(date),
      "value",
    )?.set?.call(date, "2026-11-21");
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    await waitFor(() =>
      expect(inviteToProviderViewing).toHaveBeenCalledTimes(1),
    );
    expect(inviteToProviderViewing.mock.calls[0]?.[1]).toMatchObject({
      startsAt: "2026-11-21T15:51:00.000Z",
      endsAt: "2026-11-21T16:21:00.000Z",
      timeZone: "Europe/Berlin",
    });
  });

  it("uses the proposal fallback for an unknown schedule error", async () => {
    const user = userEvent.setup();
    inviteToProviderViewing.mockRejectedValueOnce(
      new ApiError(500, "failed", "http"),
    );
    renderCurrent();
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      viewingScheduleErrorCopy.unknown,
    );
  });

  it("shows an applicant alternative beside a confirmed appointment", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: 3,
      confirmedAppointment,
      pendingProposal: {
        ...pendingReplacement,
        message: "Nachmittag passt besser.",
      },
      capabilities: [
        capability("ACCEPT_PROPOSAL", { proposalId: "proposal-2" }),
        capability("REJECT_PROPOSAL", { proposalId: "proposal-2" }),
        capability("COUNTERPROPOSE", { proposalId: "proposal-2" }),
      ],
    });
    expect(screen.getByText("Bestätigter Termin")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Ersatzvorschlag")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Vom Bewerber")).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Nachmittag passt besser.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.getByText(/Antwort bis/)).toBeInstanceOf(HTMLElement);
    await user.click(screen.getByRole("button", { name: "Termin annehmen" }));
    await waitFor(() =>
      expect(acceptProviderProposal).toHaveBeenCalledTimes(1),
    );
    expect(acceptProviderProposal.mock.calls[0]?.[1]).toBe("proposal-2");
  });

  it("keeps the confirmed appointment visible when an alternative is rejected", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      confirmedAppointment,
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("REJECT_PROPOSAL", { proposalId: "proposal-2" }),
      ],
    });
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));
    expect(
      screen.getByText("Der bestätigte Termin bleibt gültig."),
    ).toBeInstanceOf(HTMLElement);
    expect(screen.getByText("Bestätigter Termin")).toBeInstanceOf(HTMLElement);
    expect(rejectProviderProposal).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Vorschlag ablehnen" }),
    );
    await waitFor(() =>
      expect(rejectProviderProposal).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByText("Bestätigter Termin")).toBeInstanceOf(HTMLElement);
  });

  it("sends a counterproposal with the counter command", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      workflowRevision: 3,
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("COUNTERPROPOSE", { proposalId: "proposal-2" }),
      ],
    });
    await user.click(screen.getByRole("button", { name: "Gegenvorschlag" }));
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    await waitFor(() =>
      expect(counterproposeProviderViewing).toHaveBeenCalledTimes(1),
    );
    expect(counterproposeProviderViewing.mock.calls[0]?.[1]).toBe("proposal-2");
    expect(inviteToProviderViewing).not.toHaveBeenCalled();
    expect(proposeProviderReplacement).not.toHaveBeenCalled();
  });

  it("shows a replacement beside the confirmed appointment", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      workflowRevision: 3,
      confirmedAppointment,
      pendingProposal: pendingReplacement,
      capabilities: [
        capability("PROPOSE_REPLACEMENT", { appointmentId: "appointment-1" }),
      ],
    });
    expect(screen.getAllByText("Bestätigter Termin")).toHaveLength(1);
    expect(
      screen.getByText(
        "Dieser Termin bleibt gültig, bis der neue Vorschlag angenommen wird.",
      ),
    ).toBeInstanceOf(HTMLElement);
    await user.click(
      screen.getByRole("button", { name: "Ersatztermin vorschlagen" }),
    );
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    await waitFor(() =>
      expect(proposeProviderReplacement).toHaveBeenCalledTimes(1),
    );
    expect(proposeProviderReplacement.mock.calls[0]?.[1]).toBe("appointment-1");
    expect(screen.getAllByText("Bestätigter Termin")).toHaveLength(1);
  });

  it("requires a close reason and sends the backend target ids", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      workflowId: "workflow-1",
      workflowRevision: 2,
      capabilities: [
        capability("CLOSE_FLOW", {
          proposalId: "proposal-2",
          appointmentId: null,
        }),
      ],
    });
    await user.click(
      screen.getByRole("button", { name: "Besichtigung beenden" }),
    );
    const confirm = screen.getByRole("button", {
      name: "Besichtigung beenden",
    });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByRole("button", {
        name: "Ich bin verhindert",
        pressed: false,
      }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Ich bin verhindert" }),
    );
    expect(
      screen.getByRole("button", { name: "Ich bin verhindert", pressed: true }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Besichtigung beenden" }),
    );
    await waitFor(() =>
      expect(closeProviderViewingWorkflow).toHaveBeenCalledTimes(1),
    );
    expect(closeProviderViewingWorkflow.mock.calls[0]?.[1]).toBe("workflow-1");
    expect(closeProviderViewingWorkflow.mock.calls[0]?.[2]).toMatchObject({
      reason: "PROVIDER_ILLNESS",
      proposalId: "proposal-2",
      appointmentId: null,
    });
  });

  it("records each attendance without a local penalty", async () => {
    const user = userEvent.setup();
    const cases = [
      ["Hat stattgefunden", { outcome: "COMPLETED" }],
      ["Bewerber nicht da", { outcome: "NO_SHOW", absenceSide: "APPLICANT" }],
      ["Ich war nicht da", { outcome: "NO_SHOW", absenceSide: "PROVIDER" }],
      ["Beide nicht da", { outcome: "NO_SHOW", absenceSide: "BOTH" }],
    ] as const;
    for (const [label, body] of cases) {
      recordProviderViewingOutcome.mockClear();
      const view = renderCurrent({
        mode: "CURRENT",
        capabilities: [
          capability("RECORD_OUTCOME", { appointmentId: "appointment-1" }),
        ],
      });
      await user.click(screen.getByRole("button", { name: label }));
      expect(
        screen.getByRole("button", { name: label, pressed: true }),
      ).not.toBeNull();
      expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
      const otherLabel =
        label === "Hat stattgefunden"
          ? "Ich war nicht da"
          : "Hat stattgefunden";
      await user.click(screen.getByRole("button", { name: otherLabel }));
      expect(
        screen.getByRole("button", { name: label, pressed: false }),
      ).not.toBeNull();
      expect(
        screen.getByRole("button", { name: otherLabel, pressed: true }),
      ).not.toBeNull();
      await user.click(screen.getByRole("button", { name: label }));
      await user.click(
        screen.getByRole("button", { name: "Ergebnis speichern" }),
      );
      await waitFor(() =>
        expect(recordProviderViewingOutcome).toHaveBeenCalledTimes(1),
      );
      expect(recordProviderViewingOutcome.mock.calls[0]?.[1]).toBe(
        "appointment-1",
      );
      expect(recordProviderViewingOutcome.mock.calls[0]?.[2]).toMatchObject(
        body,
      );
      view.unmount();
    }
  });

  it("keeps applicant absence discreet and the other absences neutral", () => {
    const { unmount } = renderCurrent({
      mode: "CURRENT",
      outcome: {
        ...recordedOutcome,
        outcome: "NO_SHOW",
        absenceSide: "APPLICANT",
      },
    });
    const applicant = screen.getByText("Der Bewerber war nicht anwesend.");
    expect(applicant.className).toContain("text-warning");
    expect(applicant.className).not.toContain("text-danger");
    unmount();
    renderCurrent({
      mode: "CURRENT",
      outcome: {
        ...recordedOutcome,
        outcome: "NO_SHOW",
        absenceSide: "PROVIDER",
      },
    });
    const provider = screen.getByText("Du warst nicht anwesend.");
    expect(provider.className).toContain("text-foreground-secondary");
    expect(provider.className).not.toContain("text-warning");
    const bothView = renderCurrent({
      mode: "CURRENT",
      outcome: { ...recordedOutcome, outcome: "NO_SHOW", absenceSide: "BOTH" },
    });
    const both = screen.getByText("Beide Seiten waren nicht anwesend.");
    expect(both.className).not.toContain("text-warning");
    bothView.unmount();
  });

  it("requires a correction reason and sends the current appointment", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      workflowRevision: 8,
      outcome: recordedOutcome,
      capabilities: [
        capability("CORRECT_OUTCOME", { appointmentId: "appointment-1" }),
      ],
    });
    expect(
      screen.getByText("Die Besichtigung hat stattgefunden."),
    ).toBeInstanceOf(HTMLElement);
    await user.click(screen.getByRole("button", { name: "Bewerber nicht da" }));
    const save = screen.getByRole("button", { name: "Korrektur speichern" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Grund der Korrektur"), {
      target: { value: "Anwesenheit war falsch erfasst." },
    });
    await user.click(
      screen.getByRole("button", { name: "Korrektur speichern" }),
    );
    await waitFor(() =>
      expect(recordProviderViewingOutcome).toHaveBeenCalledTimes(1),
    );
    expect(recordProviderViewingOutcome.mock.calls[0]?.[2]).toMatchObject({
      outcome: "NO_SHOW",
      absenceSide: "APPLICANT",
      correctionReason: "Anwesenheit war falsch erfasst.",
      expectedWorkflowRevision: 8,
    });
  });

  it("shows the applicant interest states from the snapshot", () => {
    const pending = renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "PENDING" },
    });
    expect(
      screen.getByText("Die Rückmeldung des Bewerbers steht noch aus."),
    ).toBeInstanceOf(HTMLElement);
    pending.unmount();
    const still = renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "STILL_INTERESTED" },
    });
    expect(
      screen.getByText("Der Bewerber ist weiterhin interessiert."),
    ).toBeInstanceOf(HTMLElement);
    still.unmount();
    const notInterested = renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "NOT_INTERESTED" },
    });
    expect(
      screen.getByText("Der Bewerber ist nicht mehr interessiert."),
    ).toBeInstanceOf(HTMLElement);
    notInterested.unmount();
    const expired = renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "EXPIRED" },
    });
    expect(
      screen.getByText("Die Frist für die Rückmeldung ist abgelaufen."),
    ).toBeInstanceOf(HTMLElement);
    expired.unmount();
    const closed = renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "CLOSED" },
    });
    expect(
      screen.getByText(
        "Für diese Besichtigung ist keine Rückmeldung mehr offen.",
      ),
    ).toBeInstanceOf(HTMLElement);
    closed.unmount();
    renderCurrent({
      mode: "CURRENT",
      applicantInterest: { ...interest, state: "LEGACY_UNANSWERED" },
    });
    expect(
      screen.getByText(
        "Für diese Besichtigung ist keine Rückmeldung mehr offen.",
      ),
    ).toBeInstanceOf(HTMLElement);
  });

  it("sends continue and keeps an undecided line neutral", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      providerConsideration: {
        state: "UNDECIDED",
        decidedAt: "2026-10-28T17:00:00.000Z",
        appointmentId: "appointment-1",
        decisionRequired: true,
      },
      capabilities: [
        capability("SET_CONSIDERATION", { appointmentId: "appointment-1" }),
      ],
    });
    const line = screen.getByText("Noch keine Entscheidung.");
    expect(line.className).toContain("text-foreground-secondary");
    expect(line.className).not.toContain("text-warning");
    expect(line.getAttribute("role")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Weiter berücksichtigen" }),
    );
    await waitFor(() =>
      expect(setProviderViewingConsideration).toHaveBeenCalledTimes(1),
    );
    expect(setProviderViewingConsideration.mock.calls[0]?.[2]).toMatchObject({
      consideration: "CONTINUE_CONSIDERING",
    });
  });

  it("confirms before rejecting through do-not-continue", async () => {
    const user = userEvent.setup();
    renderCurrent({
      mode: "CURRENT",
      capabilities: [
        capability("SET_CONSIDERATION", { appointmentId: "appointment-1" }),
      ],
    });
    await user.click(
      screen.getByRole("button", { name: "Nicht weitermachen" }),
    );
    expect(setProviderViewingConsideration).not.toHaveBeenCalled();
    expect(screen.getByText("Bewerbung ablehnen?")).toBeInstanceOf(HTMLElement);
    await user.click(
      screen.getByRole("button", { name: "Bewerbung ablehnen" }),
    );
    await waitFor(() =>
      expect(setProviderViewingConsideration).toHaveBeenCalledTimes(1),
    );
    expect(setProviderViewingConsideration.mock.calls[0]?.[2]).toMatchObject({
      consideration: "DO_NOT_CONTINUE",
    });
  });

  it("reloads after a stale revision and does not retry the command", async () => {
    const user = userEvent.setup();
    inviteToProviderViewing.mockRejectedValueOnce(
      new ApiError(409, "changed", "http", "VIEWING_STATE_CHANGED", {
        code: "VIEWING_STATE_CHANGED",
        applicationId: VIEWING_APPLICATION_ID,
        reason: "STALE_REVISION",
        currentWorkflowRevision: 9,
      }),
    );
    renderCurrent({ workflowRevision: 4 });
    fillSchedule();
    await user.click(screen.getByRole("button", { name: "Vorschlag senden" }));
    expect(
      await screen.findByText(
        "Der Termin hat sich geändert. Der aktuelle Stand wurde geladen.",
      ),
    ).toBeInstanceOf(HTMLElement);
    expect(inviteToProviderViewing).toHaveBeenCalledTimes(1);
    expect(getProviderViewingWorkflow).toHaveBeenCalled();
  });

  it("does not treat an open workflow as closed or undecided", () => {
    renderCurrent({
      mode: "CURRENT",
      workflowId: "workflow-1",
      pendingProposal: pendingReplacement,
      closure: { state: "OPEN", reason: null, closedAt: null },
      providerConsideration: {
        state: "UNDECIDED",
        decidedAt: null,
        appointmentId: null,
        decisionRequired: false,
      },
      capabilities: [
        capability("COUNTERPROPOSE", { proposalId: "proposal-2" }),
      ],
    });
    expect(
      screen.queryByText("Der Besichtigungsablauf ist beendet."),
    ).toBeNull();
    expect(screen.queryByText("Noch keine Entscheidung.")).toBeNull();
    expect(screen.getByText("Ersatzvorschlag")).toBeInstanceOf(HTMLElement);
  });

  it("keeps the legacy viewing section when no current snapshot is loaded", () => {
    getProviderViewingWorkflow.mockImplementation(
      () => new Promise(() => undefined),
    );
    resetViewingSnapshotsForTests();
    render(
      <ViewingSection
        model={buildApplicantWorkflowModel(createApplicantWorkspace(), listing)}
      />,
    );
    expect(screen.getByText("Kein Termin vorgeschlagen.")).toBeInstanceOf(
      HTMLElement,
    );
    expect(screen.queryByLabelText("Beginn")).toBeNull();
    expect(screen.queryByRole("button", { name: "Gegenvorschlag" })).toBeNull();
  });
});
