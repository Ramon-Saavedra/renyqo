import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkflowCommandResult } from "@/lib/viewing-workflow/command-schema";
import { commitViewingCommand } from "../snapshot/command";
import {
  useViewingCommands,
  type ViewingCommandStatus,
} from "./use-viewing-commands";

vi.mock("../snapshot/command", () => ({ commitViewingCommand: vi.fn() }));

const response: WorkflowCommandResult = {
  applicationId: "application-1",
  workflowId: "workflow-1",
  workflowRevision: 3,
  proposalId: "proposal-1",
  appointmentId: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(commitViewingCommand).mockImplementation(
    async (_applicationId, _side, command) => ({
      status: "success",
      result: await command(),
    }),
  );
});

describe("viewing command submission lock", () => {
  it.each(["applicant", "provider"] as const)(
    "blocks synchronous re-entry for %s before React updates pending",
    async (side) => {
      let finish!: (value: WorkflowCommandResult) => void;
      const deferred = new Promise<WorkflowCommandResult>((resolve) => {
        finish = resolve;
      });
      const command = vi.fn().mockReturnValue(deferred);
      const duplicate = vi.fn().mockResolvedValue(response);
      const onChanged = vi.fn();
      const { result } = renderHook(() =>
        useViewingCommands("application-1", side, 2, onChanged),
      );
      const submissions: Promise<ViewingCommandStatus>[] = [];
      act(() => {
        submissions.push(result.current.run("accept", command));
        submissions.push(result.current.run("cancel", duplicate));
      });
      await expect(submissions[1]).resolves.toBe("busy");
      expect(command).toHaveBeenCalledExactlyOnceWith({
        requestKey: expect.any(String),
        expectedWorkflowRevision: 2,
      });
      expect(duplicate).not.toHaveBeenCalled();
      expect(commitViewingCommand).toHaveBeenCalledTimes(1);
      expect(result.current.pending).toBe("accept");
      await act(async () => {
        finish(response);
        await expect(submissions[0]).resolves.toBe("success");
      });
      expect(onChanged).toHaveBeenCalledTimes(1);
      expect(result.current.pending).toBeNull();
      expect(result.current.notice).toBeNull();
      await act(async () => {
        await expect(result.current.run("cancel", duplicate)).resolves.toBe(
          "success",
        );
      });
      expect(duplicate).toHaveBeenCalledTimes(1);
    },
  );

  it("releases the lock after a failed command so the user can retry", async () => {
    vi.mocked(commitViewingCommand).mockResolvedValueOnce({
      status: "error",
      failure: null,
      error: new Error("offline"),
    });
    const command = vi.fn().mockResolvedValue(response);
    const { result } = renderHook(() =>
      useViewingCommands("application-1", "provider", 2, vi.fn()),
    );
    await act(async () => {
      await expect(result.current.run("close", command)).resolves.toBe("error");
    });
    expect(result.current.pending).toBeNull();
    expect(result.current.notice).toBe("error");
    await act(async () => {
      await expect(result.current.run("close", command)).resolves.toBe(
        "success",
      );
    });
    expect(result.current.notice).toBeNull();
  });

  it("releases the lock even if a callback throws unexpectedly", async () => {
    const onChanged = vi.fn().mockImplementationOnce(() => {
      throw new Error("callback failed");
    });
    const command = vi.fn().mockResolvedValue(response);
    const { result } = renderHook(() =>
      useViewingCommands("application-1", "provider", 2, onChanged),
    );
    await act(async () => {
      await expect(result.current.run("outcome", command)).rejects.toThrow(
        "callback failed",
      );
    });
    expect(result.current.pending).toBeNull();
    await act(async () => {
      await expect(result.current.run("outcome", command)).resolves.toBe(
        "success",
      );
    });
    expect(command).toHaveBeenCalledTimes(2);
  });
});
