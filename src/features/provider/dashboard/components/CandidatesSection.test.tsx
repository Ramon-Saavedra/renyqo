import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rejectProviderApplication } from "../api/provider-application-rejection";
import {
  TabRefreshProvider,
  useTabRefreshRevision,
} from "../hooks/TabRefreshProvider";
import { CandidatesSection } from "./CandidatesSection";
import type { Candidate, DashboardObject } from "../types";

vi.mock("../api/provider-application-rejection", () => ({
  rejectProviderApplication: vi.fn(),
}));

const publishedObject: DashboardObject = {
  id: "object-1",
  title: "Wohnung Mitte",
  fullTitle: "Wohnung Mitte",
  objectType: null,
  district: "Berlin-Mitte",
  address: "Torstraße 1, 10119 Berlin",
  coldRent: 900,
  livingArea: 60,
  rooms: "2",
  availableFrom: "01.08.2026",
  publishedAt: "02.07.2026, 13:00",
  updatedAt: "02.07.2026, 12:00",
  status: "published",
  activeApplicationsCount: 1,
};

const draftObject: DashboardObject = {
  ...publishedObject,
  id: "object-2",
  status: "draft",
};

const candidates: readonly Candidate[] = [
  {
    id: "candidate-1",
    objectId: "object-1",
    initials: "AL",
    name: "Anna Lehmann",
    household: "2 Personen",
    warnings: [],
  },
];

const candidateWithBothWarnings: Candidate = {
  id: "candidate-warnings-both",
  objectId: "object-1",
  initials: "AB",
  name: "Anna Berger",
  household: "2 Personen",
  warnings: ["pets_by_arrangement", "smoking_by_arrangement"],
};

const candidateWithSmokingWarning: Candidate = {
  id: "candidate-warning-smoking",
  objectId: "object-1",
  initials: "AS",
  name: "Anna Sommer",
  household: "2 Personen",
  warnings: ["smoking_by_arrangement"],
};

const fiveCandidates: readonly Candidate[] = Array.from(
  { length: 5 },
  (_, index) => ({
    id: `candidate-${index + 1}`,
    objectId: "object-1",
    initials: `C${index + 1}`,
    name: `Candidate ${index + 1}`,
    household: "2 Personen",
    warnings: [],
  }),
);

const fifoCandidates: readonly Candidate[] = [
  {
    id: "candidate-fifo-1",
    objectId: "object-1",
    initials: "FA",
    name: "FIFO Anna",
    household: "1 Person",
    warnings: [],
  },
  {
    id: "candidate-fifo-2",
    objectId: "object-1",
    initials: "FB",
    name: "FIFO Bruno",
    household: "2 Personen",
    warnings: [],
  },
  {
    id: "candidate-fifo-3",
    objectId: "object-1",
    initials: "FC",
    name: "FIFO Clara",
    household: "3 Personen",
    warnings: [],
  },
];

function RefreshRevisionProbe() {
  const revision = useTabRefreshRevision();
  return <output data-testid="refresh-revision">{revision}</output>;
}

describe("CandidatesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the compact active occupancy indicator in the section header", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("1 / 5 aktiv")).not.toBeNull();
  });

  it("renders one active candidate and four empty slots", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.getByText("Anna Lehmann").closest("article")).not.toBeNull();
    expect(screen.getAllByText("Platz frei")).toHaveLength(4);
  });

  it("cancels candidate rejection without calling the backend", async () => {
    const user = userEvent.setup();
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Bewerber ablehnen?" }),
    ).not.toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Behalten" })[1]!);

    expect(rejectProviderApplication).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
  });

  it("removes the candidate and requests a refresh after backend success", async () => {
    const user = userEvent.setup();
    vi.mocked(rejectProviderApplication).mockResolvedValue();
    render(
      <TabRefreshProvider>
        <CandidatesSection
          object={publishedObject}
          candidates={candidates}
          waitingCountState={{ status: "success", count: 0 }}
          isLoading={false}
          hasError={false}
        />
        <RefreshRevisionProbe />
      </TabRefreshProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    await waitFor(() => {
      expect(rejectProviderApplication).toHaveBeenCalledWith("candidate-1");
      expect(screen.queryByText("Anna Lehmann")).toBeNull();
      expect(screen.getByTestId("refresh-revision").textContent).toBe("1");
    });
    expect(screen.getByText("Bewerbung wurde abgelehnt.")).not.toBeNull();
  });

  it("shows a rejected application again when the backend returns it as active", async () => {
    const user = userEvent.setup();
    vi.mocked(rejectProviderApplication).mockResolvedValue();
    const { rerender } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    await waitFor(() => {
      expect(screen.queryByText("Anna Lehmann")).toBeNull();
    });

    rerender(
      <CandidatesSection
        object={publishedObject}
        candidates={[...candidates]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
  });

  it("keeps a confirmed rejection hidden when active data changed during submission", async () => {
    const user = userEvent.setup();
    let resolveRejection: (() => void) | undefined;
    const rejection = new Promise<void>((resolve) => {
      resolveRejection = resolve;
    });
    vi.mocked(rejectProviderApplication).mockReturnValue(rejection);
    const { rerender } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    rerender(
      <CandidatesSection
        object={publishedObject}
        candidates={[...candidates]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    await act(async () => {
      resolveRejection?.();
      await rejection;
    });

    await waitFor(() => {
      expect(screen.queryByText("Anna Lehmann")).toBeNull();
    });
  });

  it("keeps the candidate visible and shows a safe error after failure", async () => {
    const user = userEvent.setup();
    vi.mocked(rejectProviderApplication).mockRejectedValue(
      new Error("internal backend details"),
    );
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Anna Lehmann ablehnen" }),
    );
    await user.click(screen.getByRole("button", { name: "Ablehnen" }));

    expect(
      await screen.findByText(
        "Die Bewerbung konnte nicht abgelehnt werden. Bitte versuche es erneut.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(screen.queryByText("internal backend details")).toBeNull();
  });

  it("renders both backend warnings with their matching icons", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={[candidateWithBothWarnings]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByLabelText("Haustiere klären")).not.toBeNull();
    expect(screen.getByLabelText("Rauchen klären")).not.toBeNull();
  });

  it("removes a candidate immediately when the active backend result changes", () => {
    const { rerender } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    rerender(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Anna Lehmann")).toBeNull();
  });

  it("shows warning tooltips through keyboard focus", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={[candidateWithSmokingWarning]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    const trigger = screen.getByLabelText("Rauchen klären");
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).not.toBeNull();
    expect(trigger.getAttribute("aria-describedby")).toBe(
      screen.getByRole("tooltip").id,
    );
    expect(screen.getByRole("tooltip").style.transform).toBe(
      "translateX(-100%)",
    );

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.blur(trigger);
    expect(trigger.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders five empty slots when there are zero active candidates", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText("Platz frei")).toHaveLength(5);
  });

  it("renders five active candidate cards without empty slots", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={fiveCandidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText(/Candidate /)).toHaveLength(5);
    expect(screen.queryByText("Platz frei")).toBeNull();
  });

  it("preserves the backend FIFO order for active candidates", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={fifoCandidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getAllByText(/^FIFO /).map((candidate) => candidate.textContent),
    ).toEqual(["FIFO Anna", "FIFO Bruno", "FIFO Clara"]);
  });

  it("renders at most five active candidate cards even when more are provided", () => {
    const sixCandidates: readonly Candidate[] = Array.from(
      { length: 6 },
      (_, index) => ({
        id: `candidate-${index + 1}`,
        objectId: "object-1",
        initials: `C${index + 1}`,
        name: `Candidate ${index + 1}`,
        household: "2 Personen",
        warnings: [],
      }),
    );

    render(
      <CandidatesSection
        object={publishedObject}
        candidates={sixCandidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getAllByText(/Candidate /)).toHaveLength(5);
    expect(screen.queryByText("Candidate 6")).toBeNull();
    expect(screen.queryByText("Platz frei")).toBeNull();
  });

  it("renders the neutral capacity label when waiting count is zero", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByRole("status", { name: "Kapazität 5" })).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders singular waiting copy for one waiting application", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 1 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByRole("status", { name: "+1 wartet" })).not.toBeNull();
  });

  it("renders plural waiting copy for multiple waiting applications", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 3 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByRole("status", { name: "+3 warten" })).not.toBeNull();
  });

  it("uses the active candidate count for the first waiting position", () => {
    const { rerender } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 5 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Nr. 2 von 6")).not.toBeNull();

    rerender(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "success", count: 5 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByText("Nr. 1 von 5")).not.toBeNull();
  });

  it("shows waiting-count error without rendering a fake zero", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "error" }}
        isLoading={false}
        hasError={false}
      />,
    );

    const error = screen.getByRole("status", {
      name: "Warteschlange konnte nicht geladen werden.",
    });
    expect(error.getAttribute("aria-live")).toBe("polite");
    expect(screen.queryByRole("status", { name: "Kapazität 5" })).toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("weitere passende Bewerbung wartet")).toBeNull();
    expect(
      screen.queryByText("weitere passende Bewerbungen warten"),
    ).toBeNull();
  });

  it("renders the waiting teaser without waiting applicant data", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 2 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.getByRole("status", { name: "+2 warten" })).not.toBeNull();
    const queueLabel = screen.getByText("in Warteschlange");
    const teaser = queueLabel.parentElement;
    expect(teaser?.textContent).toBe("in Warteschlange");
    expect(screen.queryByText(/waiting applicant/i)).toBeNull();
    expect(screen.queryAllByText(/@/)).toHaveLength(0);
    expect(screen.queryByLabelText(/klären/)).toBeNull();
  });

  it("renders a draft message instead of candidates for draft objects", () => {
    render(
      <CandidatesSection
        object={draftObject}
        candidates={candidates}
        waitingCountState={{ status: "success", count: 0 }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(
      screen.getByText(
        "Dieses Objekt ist noch ein Entwurf. Veröffentliche es, um passende Bewerbungen zu erhalten.",
      ),
    ).not.toBeNull();
    expect(screen.queryByText("Anna Lehmann")).toBeNull();
  });

  it("renders five empty slots when no object is selected", () => {
    render(
      <CandidatesSection
        object={null}
        candidates={candidates}
        waitingCountState={{ status: "idle" }}
        isLoading={false}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(screen.getAllByText("Platz frei")).toHaveLength(5);
  });

  it("shows an application error while still rendering active candidates", () => {
    render(
      <CandidatesSection
        object={publishedObject}
        candidates={candidates}
        waitingCountState={{ status: "error" }}
        isLoading={false}
        hasError={true}
      />,
    );

    expect(
      screen.getByText(
        "Bewerbungen konnten nicht geladen werden. Bitte versuche es gleich erneut.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Anna Lehmann")).not.toBeNull();
    expect(
      screen.getByText("Warteschlange konnte nicht geladen werden."),
    ).not.toBeNull();
  });

  it("shows loading placeholders instead of candidate cards", () => {
    const { container } = render(
      <CandidatesSection
        object={publishedObject}
        candidates={[]}
        waitingCountState={{ status: "loading" }}
        isLoading={true}
        hasError={false}
      />,
    );

    expect(screen.queryByText("Anna Lehmann")).toBeNull();
    expect(screen.queryByText("Platz frei")).toBeNull();
    expect(container.getElementsByClassName("sk").length).toBeGreaterThan(0);
  });
});
