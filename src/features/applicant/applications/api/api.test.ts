import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiGet,
  apiGetBlobResponse,
  apiPatch,
  apiPatchJsonVoid,
  apiPostFormData,
} from "@/lib/api/client";
import type * as clientApi from "@/lib/api/client";
import {
  APPLICATION_ID,
  conversationPage,
  createWorkspace,
  message,
  overviewCard,
} from "../testing/fixtures";
import { getApplicantActivityPage } from "./activity";
import { loadCompleteConversation, markConversationRead } from "./conversation";
import {
  downloadDocumentContent,
  getDocumentRequestTimelines,
  uploadRequestedDocument,
} from "./documents";
import {
  ApplicantApplicationContractError,
  ApplicantApplicationNotFoundError,
} from "./errors";
import { getApplicantApplicationsOverview } from "./overview";
import {
  acceptViewing,
  declineViewing,
  requestAnotherViewingTime,
  submitViewingInterest,
} from "./viewings";
import { getApplicantWorkspace, parseApplicantWorkspace } from "./workspace";

vi.mock("@/lib/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof clientApi>();
  return {
    ...actual,
    apiGet: vi.fn(),
    apiGetBlobResponse: vi.fn(),
    apiPatch: vi.fn(),
    apiPatchJsonVoid: vi.fn(),
    apiPostFormData: vi.fn(),
  };
});

const BASE = `/api/v1/applicant/applications/${APPLICATION_ID}`;

describe("document timeline identity", () => {
  const requestedAt = "2026-09-29T08:13:00.000Z";
  const reviewedAt = "2026-09-30T08:13:00.000Z";
  const snapshot = (requestId: string, documentId: string | null) => ({
    requestId,
    documentId,
    type: "INCOME_PROOF" as const,
    customLabel: null,
    status: "REVIEWED" as const,
    canDownload: true,
    canUpload: false,
  });
  const file = (id: string, requestId: string, createdAt = requestedAt) => ({
    id, requestId, createdAt,
    state: "AVAILABLE",
    availableAt: createdAt,
    reviewedAt: id === "A" ? reviewedAt : null,
  });
  const history = (id: string, documents: ReturnType<typeof file>[]) => ({
    id, applicationId: APPLICATION_ID, type: "INCOME_PROOF",
    requestedAt, supersededAt: null, documents,
  });

  it.each([requestedAt, "2026-10-01T08:13:00.000Z"])(
    "resolves snapshot A before trailing B with timestamp %s",
    async (timestamp) => {
      vi.mocked(apiGet).mockResolvedValue([
        history("request-1", [file("A", "request-1"), file("B", "request-1", timestamp)]),
      ]);
      const result = await getDocumentRequestTimelines(APPLICATION_ID, [snapshot("request-1", "A")]);
      expect(result.get("request-1")).toEqual({ requestedAt, uploadedAt: requestedAt, reviewedAt });
    },
  );

  it("does not infer a document when the snapshot ID is null", async () => {
    vi.mocked(apiGet).mockResolvedValue([history("request-1", [file("A", "request-1")])]);
    const result = await getDocumentRequestTimelines(APPLICATION_ID, [snapshot("request-1", null)]);
    expect(result.get("request-1")).toEqual({ requestedAt, uploadedAt: null, reviewedAt: null });
  });

  it("rejects a missing current ID and succeeds when a retry contains it", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce([history("request-1", [file("B", "request-1")])])
      .mockResolvedValueOnce([history("request-1", [file("A", "request-1")])]);
    const requests = [snapshot("request-1", "A")];
    await expect(getDocumentRequestTimelines(APPLICATION_ID, requests)).rejects.toBeInstanceOf(ApplicantApplicationContractError);
    expect((await getDocumentRequestTimelines(APPLICATION_ID, requests)).get("request-1")?.reviewedAt).toBe(reviewedAt);
  });

  it("keeps replacement dates within their own request history", async () => {
    const replacementDate = "2026-10-02T08:13:00.000Z";
    vi.mocked(apiGet).mockResolvedValue([
      history("old", [file("A", "old")]),
      history("replacement", [file("B", "replacement", replacementDate)]),
    ]);
    const result = await getDocumentRequestTimelines(APPLICATION_ID, [snapshot("replacement", "B")]);
    expect(result.size).toBe(1);
    expect(result.get("replacement")).toEqual({ requestedAt, uploadedAt: replacementDate, reviewedAt: null });
    await expect(getDocumentRequestTimelines(APPLICATION_ID, [snapshot("replacement", "A")])).rejects.toBeInstanceOf(ApplicantApplicationContractError);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applicant applications overview", () => {
  it("requests a backend page and forwards the cursor", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      asOf: "2026-10-04T09:20:00.000Z",
      items: [overviewCard({ applicationId: "a-1" })],
      pagination: { limit: 20, hasMore: true, nextCursor: "cursor-2" },
      totalCount: 21,
    });

    const page = await getApplicantApplicationsOverview("cursor-1");

    expect(apiGet).toHaveBeenCalledWith(
      "/api/v1/applicant/applications/overview?limit=20&cursor=cursor-1",
      undefined,
    );
    expect(page.items).toHaveLength(1);
    expect(page.pagination.nextCursor).toBe("cursor-2");
  });

  it("rejects pages that claim more results without a cursor", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      asOf: "2026-10-04T09:20:00.000Z",
      items: [],
      pagination: { limit: 20, hasMore: true, nextCursor: null },
      totalCount: 21,
    });

    await expect(getApplicantApplicationsOverview(null)).rejects.toBeInstanceOf(
      ApplicantApplicationContractError,
    );
  });

  it("rejects unknown application statuses instead of normalizing them", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      asOf: "2026-10-04T09:20:00.000Z",
      items: [{ ...overviewCard({ applicationId: "a-1" }), status: "REVIEW" }],
      pagination: { limit: 20, hasMore: false, nextCursor: null },
      totalCount: 1,
    });

    await expect(getApplicantApplicationsOverview(null)).rejects.toBeInstanceOf(
      ApplicantApplicationContractError,
    );
  });
});

describe("applicant workspace", () => {
  it("parses a valid workspace", () => {
    const workspace = createWorkspace();
    expect(parseApplicantWorkspace(workspace, APPLICATION_ID)).toEqual(
      workspace,
    );
  });

  it("rejects a workspace for another application", () => {
    expect(() =>
      parseApplicantWorkspace(createWorkspace(), "another-application"),
    ).toThrow(ApplicantApplicationContractError);
  });

  it("rejects provider-only pending actions", () => {
    const workspace = createWorkspace({
      attention: {
        pendingActions: [
          {
            type: "UPLOAD_REQUESTED_DOCUMENT",
            source: "DOCUMENT",
            target: { requestId: "request-1" },
          },
        ],
      },
    });
    const tampered = {
      ...workspace,
      attention: {
        ...workspace.attention,
        pendingActions: [
          {
            type: "REVIEW_DOCUMENT",
            source: "DOCUMENT",
            target: { requestId: "request-1", documentId: "document-1" },
          },
        ],
      },
    };

    expect(() => parseApplicantWorkspace(tampered, APPLICATION_ID)).toThrow(
      ApplicantApplicationContractError,
    );
  });

  it("maps a missing application to a not-found error", async () => {
    vi.mocked(apiGet).mockRejectedValue(new ApiError(404, "Not found"));

    await expect(getApplicantWorkspace(APPLICATION_ID)).rejects.toBeInstanceOf(
      ApplicantApplicationNotFoundError,
    );
  });
});

describe("applicant conversation", () => {
  it.each([true, false])(
    "preserves history and disabled sending with expectedResponder=null and isOpen=%s",
    async (isOpen) => {
      const history = [message(1, "PROVIDER", "Hallo")];
      vi.mocked(apiGet).mockResolvedValue(
        conversationPage(history, {
          isOpen,
          canCurrentUserSend: false,
          expectedResponder: null,
        }),
      );
      await expect(loadCompleteConversation(APPLICATION_ID)).resolves.toEqual({
        messages: history,
        capabilities: {
          isOpen,
          canCurrentUserSend: false,
          expectedResponder: null,
        },
      });
    },
  );

  it("preserves the provider turn without adding a read-only field", async () => {
    const history = [message(1, "APPLICANT", "Antwort")];
    vi.mocked(apiGet).mockResolvedValue(
      conversationPage(history, {
        isOpen: true,
        canCurrentUserSend: false,
        expectedResponder: "PROVIDER",
      }),
    );
    await expect(loadCompleteConversation(APPLICATION_ID)).resolves.toEqual({
      messages: history,
      capabilities: {
        isOpen: true,
        canCurrentUserSend: false,
        expectedResponder: "PROVIDER",
      },
    });
  });

  it("loads every page using afterSequence and nextAfterSequence", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce(
        conversationPage([message(1, "PROVIDER", "Hallo")], {
          hasMore: true,
          nextAfterSequence: 1,
        }),
      )
      .mockResolvedValueOnce(
        conversationPage([message(2, "APPLICANT", "Guten Tag")]),
      );

    const messages = await loadCompleteConversation(APPLICATION_ID);

    expect(messages.messages.map((item) => item.sequence)).toEqual([1, 2]);
    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      `${BASE}/conversation?afterSequence=0&limit=50`,
      undefined,
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      `${BASE}/conversation?afterSequence=1&limit=50`,
      undefined,
    );
  });

  it("stops on a cursor that does not advance", async () => {
    vi.mocked(apiGet).mockResolvedValue(
      conversationPage([message(1, "PROVIDER", "Hallo")], {
        hasMore: true,
        nextAfterSequence: 0,
      }),
    );

    await expect(
      loadCompleteConversation(APPLICATION_ID),
    ).rejects.toBeInstanceOf(ApplicantApplicationContractError);
  });

  it("marks messages read through the given sequence", async () => {
    vi.mocked(apiPatch).mockResolvedValue({ markedCount: 2 });

    await expect(markConversationRead(APPLICATION_ID, 7)).resolves.toBe(2);
    expect(apiPatch).toHaveBeenCalledWith(`${BASE}/conversation/read`, {
      throughSequence: 7,
    });
  });
});

describe("applicant documents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads the file in the multipart field file", async () => {
    vi.mocked(apiPostFormData).mockResolvedValue({
      id: "document-1",
      requestId: "request-1",
      state: "PROCESSING",
      mimeType: "application/pdf",
      size: 4,
      createdAt: "2026-10-04T09:20:00.000Z",
      availableAt: null,
      reviewedAt: null,
      canDownload: false,
      canReview: false,
    });
    const file = new File(["%PDF"], "schufa.pdf", { type: "application/pdf" });

    await uploadRequestedDocument(APPLICATION_ID, "request-1", file);

    const [path, body] = vi.mocked(apiPostFormData).mock.calls[0] ?? [];
    expect(path).toBe(`${BASE}/document-requests/request-1/document`);
    expect(body).toBeInstanceOf(FormData);
    expect(body instanceof FormData ? body.get("file") : null).toBe(file);
  });

  it("downloads content as an attachment instead of navigating to it", async () => {
    vi.mocked(apiGetBlobResponse).mockResolvedValue({
      blob: new Blob(["<svg onload=alert(1)>"], { type: "image/svg+xml" }),
      contentDisposition: null,
    });
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe("application/octet-stream");
      return "blob:document";
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("Unterlage");
        expect(this.href).toBe("blob:document");
      });
    const open = vi.spyOn(window, "open");

    await downloadDocumentContent(APPLICATION_ID, "document-1");

    expect(apiGetBlobResponse).toHaveBeenCalledWith(
      `${BASE}/documents/document-1/content`,
      { timeoutMs: 60_000 },
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });
});

describe("applicant viewings", () => {
  it("sends the documented action bodies", async () => {
    vi.mocked(apiPatchJsonVoid).mockResolvedValue(undefined);

    await acceptViewing(APPLICATION_ID, "viewing-1");
    await declineViewing(APPLICATION_ID, "viewing-1");
    await requestAnotherViewingTime(APPLICATION_ID, "viewing-1", "  ");
    await requestAnotherViewingTime(APPLICATION_ID, "viewing-1", " Ab 18 Uhr ");
    await submitViewingInterest(APPLICATION_ID, "viewing-1", "NOT_INTERESTED");

    const calls = vi.mocked(apiPatchJsonVoid).mock.calls;
    expect(calls).toEqual([
      [`${BASE}/viewings/viewing-1/accept`, {}],
      [`${BASE}/viewings/viewing-1/decline`, {}],
      [`${BASE}/viewings/viewing-1/request-another-time`, {}],
      [
        `${BASE}/viewings/viewing-1/request-another-time`,
        { message: "Ab 18 Uhr" },
      ],
      [`${BASE}/viewings/viewing-1/interest`, { interest: "NOT_INTERESTED" }],
    ]);
  });
});

describe("applicant activity", () => {
  it("passes the cursor and validates the page", async () => {
    vi.mocked(apiGet).mockResolvedValue({
      asOf: "2026-10-04T09:20:00.000Z",
      items: [
        {
          id: "activity-1",
          type: "APPLICATION_SUBMITTED",
          actorType: "APPLICANT",
          occurredAt: "2026-09-12T18:47:00.000Z",
          payload: null,
        },
      ],
      pagination: { limit: 20, hasMore: false, nextCursor: null },
      totalCount: 1,
    });

    const page = await getApplicantActivityPage(APPLICATION_ID, "cursor-1");

    expect(apiGet).toHaveBeenCalledWith(
      `${BASE}/activity?limit=20&cursor=cursor-1`,
      undefined,
    );
    expect(page.totalCount).toBe(1);
  });
});
