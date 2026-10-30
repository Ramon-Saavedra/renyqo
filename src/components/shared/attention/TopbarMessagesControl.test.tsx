import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopbarMessagesControl } from "./TopbarMessagesControl";

const useGlobalAttention = vi.hoisted(() => vi.fn());

vi.mock("@/lib/attention/hooks/use-global-attention", () => ({
  useGlobalAttention,
}));

describe("TopbarMessagesControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing while the first message fetch has no count yet", () => {
    useGlobalAttention.mockReturnValue({
      loading: true,
      error: false,
      messageCount: 0,
      messageGroups: [],
    });

    render(<TopbarMessagesControl role="applicant" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the trigger mounted while a later refresh is loading", () => {
    useGlobalAttention.mockReturnValue({
      loading: true,
      error: false,
      messageCount: 2,
      messageGroups: [],
    });

    render(<TopbarMessagesControl role="applicant" />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders nothing when there are no messages", () => {
    useGlobalAttention.mockReturnValue({
      loading: false,
      error: false,
      messageCount: 0,
      messageGroups: [],
    });

    render(<TopbarMessagesControl role="applicant" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
