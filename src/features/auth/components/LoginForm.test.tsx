import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import { loginCopy } from "../copy/login";
import { LoginForm } from "./LoginForm";

const mockReplace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
  getOnboardingState: vi.fn(),
  resolveRedirectPath: vi.fn(),
}));

import { getOnboardingState, login, resolveRedirectPath } from "@/lib/api/auth";

function renderForm() {
  return render(<LoginForm />);
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("structure", () => {
    it("renders a form with noValidate", () => {
      const { container } = renderForm();
      const form = container.querySelector("form") as HTMLFormElement;

      expect(form).toBeInstanceOf(HTMLFormElement);
      expect(form.noValidate).toBe(true);
    });

    it("renders the email field with correct type and name", () => {
      renderForm();
      const input = screen.getByLabelText(
        loginCopy.fields.email.label,
      ) as HTMLInputElement;

      expect(input.getAttribute("type")).toBe("email");
      expect(input.getAttribute("name")).toBe("email");
    });

    it("renders the password field masked by default", () => {
      renderForm();
      const input = screen.getByLabelText(
        loginCopy.fields.password.label,
      ) as HTMLInputElement;

      expect(input.getAttribute("type")).toBe("password");
      expect(input.getAttribute("name")).toBe("password");
    });

    it("renders a submit button with the submit copy", () => {
      renderForm();
      const btn = screen.getByRole("button", {
        name: loginCopy.submit,
      }) as HTMLButtonElement;

      expect(btn.getAttribute("type")).toBe("submit");
    });

    it("renders the register link pointing to /register/account-type", () => {
      renderForm();
      const link = screen.getByRole("link", { name: loginCopy.register });

      expect(link.getAttribute("href")).toBe("/register/account-type");
    });

    it("renders the password recovery link pointing to /forgot-password", () => {
      renderForm();
      const link = screen.getByRole("link", { name: loginCopy.forgotPassword });

      expect(link.getAttribute("href")).toBe("/forgot-password");
    });

    it("does not show an error alert on initial render", () => {
      renderForm();

      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("submit success", () => {
    it("calls login with trimmed email and password then redirects", async () => {
      const user = userEvent.setup();
      vi.mocked(login).mockResolvedValue({
        id: "1",
        name: "Test",
        email: "test@test.de",
        role: "applicant",
      } as never);
      vi.mocked(getOnboardingState).mockResolvedValue({
        nextStep: "applicant_area_pending",
      } as never);
      vi.mocked(resolveRedirectPath).mockReturnValue("/dashboard/applicant");

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "  test@test.de  ",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      expect(login).toHaveBeenCalledWith({
        email: "test@test.de",
        password: "password123",
      });
      expect(getOnboardingState).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/dashboard/applicant");
    });

    it("disables the submit button and shows submitting copy while loading", async () => {
      const user = userEvent.setup();
      vi.mocked(login).mockReturnValue(new Promise(() => {}));

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "t@t.de",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "pass",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      const btn = (await screen.findByRole("button", {
        name: loginCopy.submitting,
      })) as HTMLButtonElement;

      expect(btn.disabled).toBe(true);
      expect(btn.closest("form")?.getAttribute("aria-busy")).toBe("true");
      await user.click(btn);
      expect(login).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    async function submitAndTriggerError(status: number) {
      const user = userEvent.setup();
      vi.mocked(login).mockRejectedValue(new ApiError(status, "error"));

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "t@t.de",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "pass",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));
    }

    it("shows wrong credentials message for a 401 response", async () => {
      await submitAndTriggerError(401);
      const alert = await screen.findByRole("alert");

      expect(alert.textContent).toBe("E-Mail oder Passwort ist nicht korrekt.");
    });

    it("shows server unavailable message for status 0", async () => {
      await submitAndTriggerError(0);
      const alert = await screen.findByRole("alert");

      expect(alert.textContent).toContain(
        "Der Server ist aktuell nicht erreichbar",
      );
    });

    it("shows a timeout message for timed out requests", async () => {
      const user = userEvent.setup();
      vi.mocked(login).mockRejectedValue(new ApiError(0, "timeout", "timeout"));

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "t@t.de",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "pass",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      expect((await screen.findByRole("alert")).textContent).toContain(
        "Die Anfrage dauert zu lange",
      );
    });

    it("shows a server error message for unexpected server failures", async () => {
      const user = userEvent.setup();
      vi.mocked(login).mockRejectedValue(new ApiError(503, "unavailable"));

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "t@t.de",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "pass",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      expect((await screen.findByRole("alert")).textContent).toContain(
        "Der Server konnte die Anmeldung nicht verarbeiten",
      );
    });

    it("validates email and password before sending the request", async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      expect(login).not.toHaveBeenCalled();
      expect(screen.getAllByRole("alert")).toHaveLength(2);
      expect(screen.getByText(loginCopy.errors.emailRequired)).toBeTruthy();
      expect(screen.getByText(loginCopy.errors.passwordRequired)).toBeTruthy();
    });

    it("shows a server error message for unexpected server status codes", async () => {
      await submitAndTriggerError(500);
      const alert = await screen.findByRole("alert");

      expect(alert.textContent).toContain(loginCopy.errors.server);
    });

    it("re-enables the submit button after an error", async () => {
      await submitAndTriggerError(401);
      await screen.findByRole("alert");

      const btn = screen.getByRole("button", {
        name: loginCopy.submit,
      }) as HTMLButtonElement;

      expect(btn.disabled).toBe(false);
    });

    it("shows unknown error message for a non-ApiError rejection", async () => {
      const user = userEvent.setup();
      vi.mocked(login).mockRejectedValue(new Error("unexpected"));

      renderForm();
      await user.type(
        screen.getByLabelText(loginCopy.fields.email.label),
        "t@t.de",
      );
      await user.type(
        screen.getByLabelText(loginCopy.fields.password.label),
        "pass",
      );
      await user.click(screen.getByRole("button", { name: loginCopy.submit }));

      const alert = await screen.findByRole("alert");

      expect(alert.textContent).toContain(
        "Ein unerwarteter Fehler ist aufgetreten",
      );
    });
  });
});
