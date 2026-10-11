import { cleanup } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { SafeUser } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  setCurrentUser,
} from "@/lib/api/use-current-user";
import { AppTopbar } from "./AppTopbar";

const applicant: SafeUser = {
  id: "applicant-1",
  name: "Ada Applicant",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

describe("AppTopbar hydration", () => {
  afterEach(() => {
    cleanup();
    invalidateCurrentUser();
  });

  it("keeps the public logo href during hydration when the client cache already has a user", () => {
    setCurrentUser(applicant);
    const html = renderToString(<AppTopbar />);
    expect(html).toContain('href="/"');

    const container = document.createElement("div");
    container.innerHTML = html;

    const recoverableErrors: unknown[] = [];
    hydrateRoot(container, <AppTopbar />, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error);
      },
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(container.querySelector('a[href="/listings"]')).toBeNull();
  });
});
