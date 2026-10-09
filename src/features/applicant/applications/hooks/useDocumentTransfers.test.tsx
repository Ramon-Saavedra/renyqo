import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  downloadDocumentContent,
  uploadRequestedDocument,
} from "../api/documents";
import { useDocumentTransfers } from "./useDocumentTransfers";
import type * as documentsApi from "../api/documents";
import type { WorkspaceDocumentRequest } from "../api/workspace";

vi.mock("../api/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof documentsApi>()),
  uploadRequestedDocument: vi.fn(),
  downloadDocumentContent: vi.fn(),
}));

const refresh = vi.fn(() => 3);
const file = new File(["%PDF"], "document.pdf", { type: "application/pdf" });
const REQUESTS: readonly WorkspaceDocumentRequest[] = ["one", "two"].map(
  (requestId): WorkspaceDocumentRequest => ({
    requestId,
    type: "INCOME_PROOF",
    customLabel: null,
    status: "UPLOAD_REQUIRED",
    documentId: null,
    canDownload: false,
    canUpload: true,
  }),
);

function Harness({
  accepted,
  requests = REQUESTS,
}: {
  readonly accepted: number;
  readonly requests?: readonly WorkspaceDocumentRequest[];
}) {
  const { bindInput, onFileSelected, openPicker, download, isUploadBlocked } =
    useDocumentTransfers("application-test", refresh, accepted, requests);
  return (
    <>
      <input
        aria-label="file"
        type="file"
        ref={bindInput}
        onChange={onFileSelected}
      />
      <button onClick={() => openPicker("one")}>one</button>
      <button onClick={() => openPicker("two")}>two</button>
      <button onClick={() => download("document-one")}>download</button>
      <output>
        {isUploadBlocked("one") ? "one blocked" : "one available"}
      </output>
      <output>
        {isUploadBlocked("two") ? "two blocked" : "two available"}
      </output>
    </>
  );
}

function select(requestId: string) {
  fireEvent.click(screen.getByRole("button", { name: requestId }));
  fireEvent.change(screen.getByLabelText("file"), {
    target: { files: [file] },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(uploadRequestedDocument).mockResolvedValue(undefined);
  vi.mocked(downloadDocumentContent).mockResolvedValue(undefined);
});

describe("document synchronization", () => {
  it.each(["denied", "missing"] as const)(
    "blocks the picker and upload for a %s request",
    (condition) => {
      const requests = REQUESTS.flatMap((request) =>
        request.requestId !== "one"
          ? [request]
          : condition === "missing"
            ? []
            : [{ ...request, canUpload: false }],
      );
      render(<Harness accepted={1} requests={requests} />);
      const input = screen.getByLabelText<HTMLInputElement>("file");
      const click = vi.spyOn(input, "click");
      select("one");
      expect(click).not.toHaveBeenCalled();
      expect(uploadRequestedDocument).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      click.mockRestore();
    },
  );

  it.each(["revoked", "removed"] as const)(
    "rechecks the current request when permission is %s after opening the picker",
    async (condition) => {
      const { rerender } = render(<Harness accepted={1} />);
      const input = screen.getByLabelText<HTMLInputElement>("file");
      const click = vi.spyOn(input, "click");
      fireEvent.click(screen.getByRole("button", { name: "one" }));
      expect(click).toHaveBeenCalledOnce();
      const requests = REQUESTS.flatMap((request) =>
        request.requestId !== "one"
          ? [request]
          : condition === "removed"
            ? []
            : [{ ...request, canUpload: false }],
      );
      rerender(<Harness accepted={1} requests={requests} />);
      fireEvent.change(input, { target: { files: [file] } });
      expect(uploadRequestedDocument).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      select("two");
      await waitFor(() =>
        expect(uploadRequestedDocument).toHaveBeenCalledExactlyOnceWith(
          "application-test",
          "two",
          file,
        ),
      );
      click.mockRestore();
    },
  );

  it("blocks only the uploaded request and its selector until the required refresh is accepted", async () => {
    const { rerender } = render(<Harness accepted={1} />);
    select("one");
    await screen.findByText("one blocked");
    select("one");
    expect(uploadRequestedDocument).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "download" }));
    expect(downloadDocumentContent).toHaveBeenCalledWith(
      "application-test",
      "document-one",
    );
    select("two");
    await screen.findByText("two blocked");
    expect(uploadRequestedDocument).toHaveBeenCalledTimes(2);
    rerender(<Harness accepted={2} />);
    expect(screen.getByText("one blocked")).toBeTruthy();
    select("one");
    expect(uploadRequestedDocument).toHaveBeenCalledTimes(2);
    rerender(<Harness accepted={3} />);
    expect(screen.getByText("one available")).toBeTruthy();
    select("one");
    await waitFor(() =>
      expect(uploadRequestedDocument).toHaveBeenCalledTimes(3),
    );
  });

  it.each([409, 500])(
    "keeps conflicts blocked and normal failures retryable (%s)",
    async (status) => {
      vi.mocked(uploadRequestedDocument).mockRejectedValueOnce(
        new ApiError(status, "internal"),
      );
      const { rerender } = render(<Harness accepted={1} />);
      select("one");
      await waitFor(() =>
        expect(uploadRequestedDocument).toHaveBeenCalledTimes(1),
      );
      await waitFor(() => {
        expect(refresh).toHaveBeenCalledTimes(status === 409 ? 1 : 0);
        expect(
          screen.getByText(status === 409 ? "one blocked" : "one available"),
        ).toBeTruthy();
      });
      select("one");
      if (status === 409) {
        expect(uploadRequestedDocument).toHaveBeenCalledTimes(1);
        rerender(<Harness accepted={3} />);
        select("one");
      }
      await waitFor(() =>
        expect(uploadRequestedDocument).toHaveBeenCalledTimes(2),
      );
    },
  );
});
