import { cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SafeUser } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  setCurrentUser,
} from "@/lib/api/use-current-user";
import { ListingsTopbarActions } from "./ListingsTopbarActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/listings",
}));

vi.mock("@/components/layout/account-menu/AccountMenu", () => ({
  AccountMenu: () => <div data-testid="account-menu">account menu</div>,
}));

const applicant: SafeUser = {
  id: "applicant-1",
  name: "Ada Applicant",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

describe("ListingsTopbarActions hydration", () => {
  afterEach(() => {
    cleanup();
    invalidateCurrentUser();
  });

  it("hydrates the loading shell when the client session cache already has a user", () => {
    setCurrentUser(applicant);
    const html = renderToString(<ListingsTopbarActions />);
    expect(html).toContain("sk-pill");

    const container = document.createElement("div");
    container.innerHTML = html;

    const recoverableErrors: unknown[] = [];
    hydrateRoot(container, <ListingsTopbarActions />, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error);
      },
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(container.querySelector(".sk-pill")).not.toBeNull();
  });

  it("shows the account menu only after hydration resolves the session", async () => {
    setCurrentUser(applicant);
    render(<ListingsTopbarActions />);
    expect(
      (await import("@testing-library/react")).screen.getByTestId(
        "account-menu",
      ),
    ).not.toBeNull();
  });
});
