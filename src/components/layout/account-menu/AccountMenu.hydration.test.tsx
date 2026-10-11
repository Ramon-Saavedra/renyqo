import { cleanup } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
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
  afterEach(() => {
    cleanup();
    invalidateCurrentUser();
  });

  it("hydrates the loading trigger when the client session cache already has a user", () => {
    setCurrentUser(applicant);
    const html = renderToString(<AccountMenu variant="full" />);
    expect(html).toContain("sk-circle");

    const container = document.createElement("div");
    container.innerHTML = html;

    const recoverableErrors: unknown[] = [];
    hydrateRoot(container, <AccountMenu variant="full" />, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error);
      },
    });

    expect(recoverableErrors).toHaveLength(0);
    expect(container.querySelector(".sk-circle")).not.toBeNull();
  });
});
