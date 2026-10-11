import { act, cleanup, within } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SafeUser } from "@/lib/api/auth";
import {
  invalidateCurrentUser,
  setCurrentUser,
} from "@/lib/api/use-current-user";
import { AccountMenu } from "./AccountMenu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/applicant/profile",
}));

vi.mock("@/features/applicant/profile/hooks/useApplicantProfileStatus", () => ({
  useApplicantProfileStatus: () => "exists",
  invalidateApplicantProfile: vi.fn(),
}));

const applicant: SafeUser = {
  id: "applicant-1",
  name: "Ada Applicant",
  email: "ada@example.com",
  role: "applicant",
  providerType: null,
  companyName: null,
};

describe("AccountMenu hydration", () => {
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

  it("hydrates the loading trigger when the client session cache already has a user", async () => {
    setCurrentUser(applicant);
    const html = renderToString(<AccountMenu variant="full" />);
    expect(html).toContain("sk-circle");

    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = html;
    hydrationContainer = container;

    const recoverableErrors: unknown[] = [];
    await act(async () => {
      hydrationRoot = hydrateRoot(container, <AccountMenu variant="full" />, {
        onRecoverableError: (error) => {
          recoverableErrors.push(error);
        },
      });
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(
      within(hydrationContainer).getByRole("button", {
        name: "Konto & Profil",
      }),
    ).not.toBeNull();
  });
});
