import {
  fireEvent,
  act,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { ApplicantApplicationContractError } from "../../api/errors";
import type * as conversationApi from "../../api/conversation";
import {
  downloadDocumentContent,
  getDocumentRequestTimelines,
  uploadRequestedDocument,
} from "../../api/documents";
import type * as documentsApi from "../../api/documents";
import type * as viewingsApi from "../../api/viewings";
import {
  getApplicantWorkspace,
  type ApplicantWorkspace,
  type WorkspaceDocumentRequest,
} from "../../api/workspace";
import type * as workspaceApi from "../../api/workspace";
import { APPLICATION_ID, createWorkspace } from "../../testing/fixtures";
import { ApplicationWorkspace } from "./ApplicationWorkspace";

vi.mock("../../api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof workspaceApi>()),
  getApplicantWorkspace: vi.fn(),
}));

vi.mock("../../api/conversation", async (importOriginal) => ({
  ...(await importOriginal<typeof conversationApi>()),
  loadCompleteConversation: vi.fn().mockResolvedValue({
    messages: [],
    capabilities: {
      isOpen: true,
      canCurrentUserSend: false,
      expectedResponder: null,
    },
  }),
}));

vi.mock("../../api/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof documentsApi>()),
  getDocumentRequestTimelines: vi.fn(),
  uploadRequestedDocument: vi.fn(),
  downloadDocumentContent: vi.fn(),
}));

vi.mock("../../api/viewings", async (importOriginal) => ({
  ...(await importOriginal<typeof viewingsApi>()),
  getViewingDetail: vi.fn(),
}));

vi.mock("../../api/activity", () => ({
  getApplicantActivityPage: vi.fn(),
}));

const getWorkspace = vi.mocked(getApplicantWorkspace);

function request(
  overrides: Partial<WorkspaceDocumentRequest> & { readonly requestId: string },
): WorkspaceDocumentRequest {
  return {
    type: "INCOME_PROOF",
    customLabel: null,
    status: "UPLOAD_REQUIRED",
    documentId: null,
    canDownload: false,
    canUpload: true,
    ...overrides,
  };
}

function workspaceWith(
  requests: readonly WorkspaceDocumentRequest[],
  asOf?: string,
): ApplicantWorkspace {
  return createWorkspace(
    {
      attention: {
        pendingActions: requests
          .filter((item) => item.canUpload)
          .map((item) => ({
            type: "UPLOAD_REQUESTED_DOCUMENT" as const,
            source: "DOCUMENT" as const,
            target: { requestId: item.requestId },
          })),
      },
      documentsSummary: { currentRequests: [...requests] },
    },
    asOf,
  );
}

function documentsRegion() {
  return screen.findByRole("region", { name: "Unterlagen" });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("missing file input");
  return input;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDocumentRequestTimelines).mockResolvedValue(
    new Map([
      [
        "request-1",
        {
          requestedAt: "2026-09-29T08:13:00.000Z",
          uploadedAt: null,
          reviewedAt: null,
        },
      ],
    ]),
  );
});

describe("ApplicationWorkspace documents", () => {
  it.each(["denied", "missing"] as const)(
    "disables primary and secondary upload steps for %s requests",
    async (condition) => {
      const user = userEvent.setup();
      const workspace = workspaceWith([
        ...(condition === "denied"
          ? [
              request({ requestId: "request-1", canUpload: false }),
              request({
                requestId: "request-2",
                type: "OTHER",
                customLabel: "Zusatzunterlage",
                canUpload: false,
              }),
            ]
          : []),
        request({ requestId: "request-3", type: "SCHUFA" }),
      ]);
      getWorkspace.mockResolvedValue({
        ...workspace,
        attention: {
          ...workspace.attention,
          pendingActions: ["request-1", "request-2", "request-3"].map(
            (requestId) => ({
              type: "UPLOAD_REQUESTED_DOCUMENT" as const,
              source: "DOCUMENT" as const,
              target: { requestId },
            }),
          ),
          pendingActionCount: 3,
          hasPendingAction: true,
        },
      });
      render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
      const panel = await screen.findByRole("region", {
        name: "Dein nächster Schritt",
      });
      const primary = within(panel).getByRole("button", {
        name: "Datei hochladen",
      });
      const secondary = within(panel).getByRole("button", {
        name:
          condition === "denied"
            ? /Zusatzunterlage hochladen/
            : /Unterlage hochladen/,
      });
      expect(primary).toHaveProperty("disabled", true);
      expect(secondary).toHaveProperty("disabled", true);
      expect(
        within(panel).getByRole("button", {
          name: /SCHUFA-Auskunft hochladen/,
        }),
      ).toHaveProperty("disabled", false);
      const click = vi.spyOn(fileInput(), "click");
      await user.click(primary);
      await user.click(secondary);
      expect(click).not.toHaveBeenCalled();
      expect(uploadRequestedDocument).not.toHaveBeenCalled();
      click.mockRestore();
    },
  );

  it("locks only the uploaded request in the row and next step through failed refresh and retry", async () => {
    const user = userEvent.setup();
    const workspace = workspaceWith([
      request({ requestId: "request-1" }),
      request({ requestId: "request-2", type: "SCHUFA" }),
      request({
        requestId: "request-3",
        type: "OTHER",
        canUpload: false,
        canDownload: true,
        documentId: "document-3",
        status: "RECEIVED",
      }),
    ]);
    let finishRetry: (value: ApplicantWorkspace) => void = () => undefined;
    getWorkspace
      .mockResolvedValueOnce(workspace)
      .mockRejectedValueOnce(new ApiError(503, "internal"))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishRetry = resolve;
        }),
      );
    vi.mocked(uploadRequestedDocument).mockResolvedValue(undefined);
    vi.mocked(downloadDocumentContent).mockResolvedValue(undefined);
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    fireEvent.click(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    );
    fireEvent.change(fileInput(), {
      target: {
        files: [
          new File(["%PDF"], "document.pdf", { type: "application/pdf" }),
        ],
      },
    });
    await screen.findByText(/Der aktuelle Stand konnte nicht geladen werden/);
    expect(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    ).toHaveProperty("disabled", true);
    expect(
      within(region).getByRole("button", { name: "SCHUFA-Auskunft hochladen" }),
    ).toHaveProperty("disabled", false);
    const nextStep = screen.getByRole("region", { name: "Dein nächster Schritt" });
    expect(
      within(nextStep).getByRole("button", { name: "Datei hochladen" }),
    ).toHaveProperty("disabled", true);
    await user.click(
      within(region).getByRole("button", {
        name: "Sonstiges Dokument herunterladen",
      }),
    );
    expect(downloadDocumentContent).toHaveBeenCalledWith(
      APPLICATION_ID,
      "document-3",
    );
    await user.click(screen.getByRole("button", { name: "Erneut versuchen" }));
    expect(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    ).toHaveProperty("disabled", true);
    await act(async () => {
      finishRetry(workspace);
    });
    await waitFor(() =>
      expect(
        within(region).getByRole("button", {
          name: "Einkommensnachweis hochladen",
        }),
      ).toHaveProperty("disabled", false),
    );
    expect(uploadRequestedDocument).toHaveBeenCalledTimes(1);
    expect(workspace.documentsSummary.currentRequests[0]?.canUpload).toBe(true);
  });

  it("shows required uploads with the backend request date", async () => {
    getWorkspace.mockResolvedValue(
      workspaceWith([request({ requestId: "request-1" })]),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();

    expect(within(region).getByText("Einkommensnachweis")).toBeTruthy();
    expect(within(region).getByText("Noch hochzuladen")).toBeTruthy();
    expect(
      await within(region).findByText("Angefordert am 29.09.2026"),
    ).toBeTruthy();
    expect(within(region).getByText("0 von 1 hochgeladen")).toBeTruthy();
    expect(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    ).toBeTruthy();
  });

  it("does not offer upload when the backend capability is false", async () => {
    getWorkspace.mockResolvedValue(
      workspaceWith([request({ requestId: "request-1", canUpload: false })]),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();

    expect(within(region).getByText("Noch hochzuladen")).toBeTruthy();
    expect(
      within(region).queryByRole("button", { name: /hochladen/ }),
    ).toBeNull();
  });

  it("uploads a selected file and refreshes the workspace", async () => {
    getWorkspace
      .mockResolvedValueOnce(
        workspaceWith([request({ requestId: "request-1" })]),
      )
      .mockResolvedValueOnce(
        workspaceWith(
          [
            request({
              requestId: "request-1",
              status: "PROCESSING",
              documentId: "document-1",
              canUpload: false,
            }),
          ],
          "2026-10-04T09:25:00.000Z",
        ),
      );
    vi.mocked(uploadRequestedDocument).mockResolvedValue(undefined);
    const click = vi.spyOn(HTMLInputElement.prototype, "click");

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    fireEvent.click(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    );
    expect(click).toHaveBeenCalled();
    const file = new File(["%PDF-1.7"], "lohn.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    expect(await within(region).findByText("Wird verarbeitet")).toBeTruthy();
    expect(uploadRequestedDocument).toHaveBeenCalledWith(
      APPLICATION_ID,
      "request-1",
      file,
    );
    expect(getWorkspace).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it("rejects unsupported files before calling the backend", async () => {
    getWorkspace.mockResolvedValue(
      workspaceWith([request({ requestId: "request-1" })]),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    fireEvent.click(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    );
    fireEvent.change(fileInput(), {
      target: {
        files: [new File(["<svg/>"], "bild.svg", { type: "image/svg+xml" })],
      },
    });

    expect(
      await within(region).findByText(
        "Bitte wähle eine PDF-, JPEG- oder PNG-Datei.",
      ),
    ).toBeTruthy();
    expect(uploadRequestedDocument).not.toHaveBeenCalled();
  });

  it("shows a safe message when the upload fails", async () => {
    getWorkspace.mockResolvedValue(
      workspaceWith([request({ requestId: "request-1" })]),
    );
    vi.mocked(uploadRequestedDocument).mockRejectedValue(
      new ApiError(500, "S3 bucket renyqo-documents unavailable"),
    );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    fireEvent.click(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    );
    fireEvent.change(fileInput(), {
      target: {
        files: [new File(["%PDF"], "lohn.pdf", { type: "application/pdf" })],
      },
    });

    expect(
      await within(region).findByText(
        "Die Unterlage konnte nicht hochgeladen werden. Bitte versuche es erneut.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/S3 bucket/)).toBeNull();
    expect(getWorkspace).toHaveBeenCalledTimes(1);
  });

  it("downloads available documents through the safe download helper", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(
      workspaceWith([
        request({
          requestId: "request-1",
          type: "SCHUFA",
          status: "RECEIVED",
          documentId: "document-1",
          canDownload: true,
          canUpload: false,
        }),
      ]),
    );
    vi.mocked(downloadDocumentContent).mockResolvedValue(undefined);

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    await user.click(
      within(region).getByRole("button", {
        name: "SCHUFA-Auskunft herunterladen",
      }),
    );

    expect(downloadDocumentContent).toHaveBeenCalledWith(
      APPLICATION_ID,
      "document-1",
    );
  });

  it("drops a cancelled request once the backend no longer returns it", async () => {
    const user = userEvent.setup();
    getWorkspace
      .mockResolvedValueOnce(
        workspaceWith([
          request({ requestId: "request-1" }),
          request({
            requestId: "request-2",
            type: "OTHER",
            customLabel: "Mietschuldenfreiheitsbescheinigung",
          }),
        ]),
      )
      .mockResolvedValueOnce(
        workspaceWith(
          [request({ requestId: "request-1" })],
          "2026-10-04T09:30:00.000Z",
        ),
      );

    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    expect(
      within(region).getByText("Mietschuldenfreiheitsbescheinigung"),
    ).toBeTruthy();

    vi.mocked(uploadRequestedDocument).mockRejectedValue(
      new ApiError(409, "Conflict"),
    );
    await user.click(
      within(region).getByRole("button", {
        name: "Einkommensnachweis hochladen",
      }),
    );
    fireEvent.change(fileInput(), {
      target: {
        files: [new File(["%PDF"], "lohn.pdf", { type: "application/pdf" })],
      },
    });

    expect(
      await within(region).findByText(
        "Für diese Anforderung liegt bereits eine Unterlage vor. Der Stand wurde aktualisiert.",
      ),
    ).toBeTruthy();
    await waitFor(() =>
      expect(
        within(region).queryByText("Mietschuldenfreiheitsbescheinigung"),
      ).toBeNull(),
    );
    expect(getWorkspace).toHaveBeenCalledTimes(2);
  });
});

describe("document timeline recovery", () => {
  it.each(["success", "failure"] as const)(
    "hides A dates while B loads with the same asOf and handles %s",
    async (outcome) => {
      const user = userEvent.setup();
      const current = request({
        requestId: "request-1",
        documentId: "A",
        status: "RECEIVED",
        canUpload: false,
      });
      getWorkspace
        .mockResolvedValueOnce(workspaceWith([current]))
        .mockResolvedValueOnce(workspaceWith([{ ...current, documentId: "B" }]));
      const datesA = new Map([["request-1", {
        requestedAt: "2026-09-29T08:13:00.000Z",
        uploadedAt: "2026-09-30T08:13:00.000Z",
        reviewedAt: null,
      }]]);
      const datesB = new Map([["request-1", {
        requestedAt: "2026-09-29T08:13:00.000Z",
        uploadedAt: "2026-10-02T08:13:00.000Z",
        reviewedAt: null,
      }]]);
      let resolveLoad: (value: typeof datesB) => void = () => undefined;
      let rejectLoad: (error: Error) => void = () => undefined;
      vi.mocked(getDocumentRequestTimelines)
        .mockResolvedValueOnce(datesA)
        .mockReturnValueOnce(new Promise((resolve, reject) => {
          resolveLoad = resolve;
          rejectLoad = reject;
        }));
      render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
      const region = await documentsRegion();
      await within(region).findByText("Hochgeladen am 30.09.2026");
      act(() => window.dispatchEvent(new Event("focus")));
      await waitFor(() => expect(getDocumentRequestTimelines).toHaveBeenCalledTimes(2));
      expect(within(region).queryByText("Hochgeladen am 30.09.2026")).toBeNull();
      expect(within(region).getByText("Hochgeladen")).toBeTruthy();
      await act(async () => {
        if (outcome === "success") resolveLoad(datesB);
        else rejectLoad(new ApiError(503, "internal"));
      });
      if (outcome === "failure") {
        await within(region).findByText("Die Zeitangaben konnten nicht geladen werden.");
        expect(within(region).queryByText("Hochgeladen am 30.09.2026")).toBeNull();
        vi.mocked(getDocumentRequestTimelines).mockResolvedValueOnce(datesB);
        await user.click(within(region).getByRole("button", { name: "Erneut versuchen" }));
      }
      await within(region).findByText("Hochgeladen am 02.10.2026");
      expect(within(region).queryByText("Hochgeladen am 30.09.2026")).toBeNull();
      expect(getWorkspace).toHaveBeenCalledTimes(2);
    },
  );

  it.each([undefined, "2026-10-04T10:00:00.000Z"])(
    "reloads dates normally when the current document stays the same (%s)",
    async (asOf) => {
      const current = request({
        requestId: "request-1",
        documentId: "A",
        status: "RECEIVED",
        canUpload: false,
      });
      getWorkspace
        .mockResolvedValueOnce(workspaceWith([current]))
        .mockResolvedValueOnce(workspaceWith([current], asOf));
      const dates = new Map([["request-1", {
        requestedAt: "2026-09-29T08:13:00.000Z",
        uploadedAt: "2026-09-30T08:13:00.000Z",
        reviewedAt: null,
      }]]);
      vi.mocked(getDocumentRequestTimelines).mockResolvedValue(dates);
      render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
      const region = await documentsRegion();
      await within(region).findByText("Hochgeladen am 30.09.2026");
      act(() => window.dispatchEvent(new Event("focus")));
      await waitFor(() => expect(getDocumentRequestTimelines).toHaveBeenCalledTimes(2));
      await within(region).findByText("Hochgeladen am 30.09.2026");
      expect(within(region).queryByText("Die Zeitangaben konnten nicht geladen werden.")).toBeNull();
    },
  );

  it("retries missing current document metadata with the same workspace snapshot", async () => {
    const user = userEvent.setup();
    const current = request({ requestId: "request-1", documentId: "A", status: "RECEIVED", canUpload: false });
    getWorkspace.mockResolvedValue(workspaceWith([current]));
    vi.mocked(getDocumentRequestTimelines)
      .mockRejectedValueOnce(new ApplicantApplicationContractError())
      .mockResolvedValueOnce(new Map([["request-1", {
        requestedAt: "2026-09-29T08:13:00.000Z",
        uploadedAt: "2026-09-30T08:13:00.000Z",
        reviewedAt: null,
      }]]));
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    await within(region).findByText("Die Zeitangaben konnten nicht geladen werden.");
    await user.click(within(region).getByRole("button", { name: "Erneut versuchen" }));
    await waitFor(() => expect(within(region).queryByText("Die Zeitangaben konnten nicht geladen werden.")).toBeNull());
    expect(getWorkspace).toHaveBeenCalledOnce();
    expect(getDocumentRequestTimelines).toHaveBeenCalledTimes(2);
    expect(getDocumentRequestTimelines).toHaveBeenLastCalledWith(APPLICATION_ID, [current], expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("shows a controlled error and retries only the auxiliary load", async () => {
    const user = userEvent.setup();
    getWorkspace.mockResolvedValue(
      workspaceWith([request({ requestId: "request-1" })]),
    );
    vi.mocked(getDocumentRequestTimelines)
      .mockRejectedValueOnce(new ApiError(503, "storage internal"))
      .mockResolvedValueOnce(new Map());
    render(<ApplicationWorkspace applicationId={APPLICATION_ID} />);
    const region = await documentsRegion();
    await within(region).findByText(
      "Die Zeitangaben konnten nicht geladen werden.",
    );
    expect(screen.queryByText("storage internal")).toBeNull();
    await user.click(
      within(region).getByRole("button", { name: "Erneut versuchen" }),
    );
    await waitFor(() =>
      expect(
        within(region).queryByText(
          "Die Zeitangaben konnten nicht geladen werden.",
        ),
      ).toBeNull(),
    );
    expect(getWorkspace).toHaveBeenCalledOnce();
    expect(getDocumentRequestTimelines).toHaveBeenCalledTimes(2);
  });
});
