import { act, cleanup } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
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
  let hydrationRoot: Root | null = null;
  let hydrationContainer: HTMLDivElement | null = null;

  afterEach(async () => {
    if (hydrationRoot !== null) {
      await act(async () => {
        hydrationRoot!.unmount();
      });
      hydrationRoot = null;
    }
    hydrationContainer?.remove();
    hydrationContainer = null;
    cleanup();
    invalidateCurrentUser();
  });

  it("keeps the public logo href during hydration when the client cache already has a user", async () => {
    setCurrentUser(applicant);
    const html = renderToString(<AppTopbar />);
    expect(html).toContain('href="/"');

    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = html;
    hydrationContainer = container;

    const recoverableErrors: unknown[] = [];
    await act(async () => {
      hydrationRoot = hydrateRoot(container, <AppTopbar />, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(
      hydrationContainer.querySelector('a[href="/listings"]'),
    ).not.toBeNull();
  });
});
