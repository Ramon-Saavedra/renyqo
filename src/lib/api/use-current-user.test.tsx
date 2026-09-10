import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, type SafeUser } from "./auth";
import { ApiError } from "./client";
import {
  invalidateCurrentUser,
  setCurrentUser,
  useCurrentUser,
} from "./use-current-user";

vi.mock("./auth", () => ({
  getCurrentUser: vi.fn(),
}));

const getCurrentUserMock = vi.mocked(getCurrentUser);

const user: SafeUser = {
  id: "user-1",
  name: "Ada",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

function Probe() {
  const { user: currentUser, loading, error } = useCurrentUser();
  if (loading) return <span>loading</span>;
  if (error) return <span>error</span>;
  return <span>{currentUser?.email ?? "none"}</span>;
}

describe("useCurrentUser", () => {
  afterEach(() => {
    cleanup();
    getCurrentUserMock.mockReset();
    invalidateCurrentUser();
  });

  it("uses a loading server snapshot even when the client cache already has a user", () => {
    setCurrentUser(user);
    const html = renderToString(<Probe />);
    expect(html).toContain("loading");
    expect(html).not.toContain("ada@example.com");
  });

  it("returns the cached user on the client after the cache is populated", () => {
    setCurrentUser(user);
    render(<Probe />);
    expect(screen.getByText("ada@example.com")).toBeInstanceOf(HTMLElement);
  });

  it("treats a confirmed 401 as anonymous and does not keep an error state", async () => {
    getCurrentUserMock.mockRejectedValue(
      new ApiError(401, "Unauthorized", "http"),
    );
    invalidateCurrentUser();
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("none")).toBeInstanceOf(HTMLElement);
    });
    expect(screen.queryByText("error")).toBeNull();
  });

  it("keeps a recoverable error for 5xx responses instead of becoming anonymous", async () => {
    getCurrentUserMock.mockRejectedValue(new ApiError(500, "fail", "http"));
    invalidateCurrentUser();
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInstanceOf(HTMLElement);
    });
    expect(screen.queryByText("none")).toBeNull();
  });

  it("keeps a recoverable error for network failures instead of becoming anonymous", async () => {
    getCurrentUserMock.mockRejectedValue(new ApiError(0, "network", "network"));
    invalidateCurrentUser();
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInstanceOf(HTMLElement);
    });
    expect(screen.queryByText("none")).toBeNull();
  });

  it("does not treat 403 as anonymous", async () => {
    getCurrentUserMock.mockRejectedValue(
      new ApiError(403, "Forbidden", "http"),
    );
    invalidateCurrentUser();
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInstanceOf(HTMLElement);
    });
  });

  it("retries a failed session load after invalidateCurrentUser", async () => {
    getCurrentUserMock.mockRejectedValue(new ApiError(500, "fail", "http"));
    invalidateCurrentUser();
    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInstanceOf(HTMLElement);
    });

    getCurrentUserMock.mockResolvedValue(user);
    invalidateCurrentUser();

    await waitFor(() => {
      expect(screen.getByText("ada@example.com")).toBeInstanceOf(HTMLElement);
    });
  });
});
