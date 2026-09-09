import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SafeUser } from "./auth";
import {
  invalidateCurrentUser,
  setCurrentUser,
  useCurrentUser,
} from "./use-current-user";

vi.mock("./auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

const user: SafeUser = {
  id: "user-1",
  name: "Ada",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

function Probe() {
  const { user: currentUser, loading } = useCurrentUser();
  return <span>{loading ? "loading" : (currentUser?.email ?? "none")}</span>;
}

describe("useCurrentUser", () => {
  afterEach(() => {
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
});
