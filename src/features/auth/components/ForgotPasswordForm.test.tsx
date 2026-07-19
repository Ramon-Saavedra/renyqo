import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { forgotPassword } from "@/lib/api/auth";
import { passwordRecoveryCopy } from "../copy/password-recovery";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

vi.mock("@/lib/api/auth", () => ({
  forgotPassword: vi.fn(),
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the email before sending a request", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.forgot.submit }),
    );

    expect(forgotPassword).not.toHaveBeenCalled();
    expect(
      screen.getByText(passwordRecoveryCopy.forgot.errors.emailRequired),
    ).toBeTruthy();
  });

  it("shows a neutral confirmation after the request succeeds", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-Mail"), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.forgot.submit }),
    );

    expect(forgotPassword).toHaveBeenCalledWith({ email: "user@example.com" });
    expect(
      await screen.findByText(passwordRecoveryCopy.forgot.success),
    ).toBeTruthy();
  });

  it("maps timeout errors without exposing backend details", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockRejectedValue(
      new ApiError(0, "internal timeout detail", "timeout"),
    );
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-Mail"), "user@example.com");
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.forgot.submit }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Die Anfrage dauert zu lange");
    expect(alert.textContent).not.toContain("internal timeout detail");
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockReturnValue(new Promise(() => {}));
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-Mail"), "user@example.com");
    const button = screen.getByRole("button", {
      name: passwordRecoveryCopy.forgot.submit,
    });
    await user.click(button);
    await user.click(button);

    expect(forgotPassword).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
