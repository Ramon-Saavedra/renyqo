import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/auth";
import { passwordRecoveryCopy } from "../copy/password-recovery";
import { ResetPasswordForm } from "./ResetPasswordForm";

const mockReplace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/api/auth", () => ({
  resetPassword: vi.fn(),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing token without sending a request", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="" />);

    expect(
      screen.getByText(passwordRecoveryCopy.reset.errors.missingToken),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: passwordRecoveryCopy.reset.submit,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.reset.submit }),
    );

    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("requires matching passwords before sending the token", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="reset-token" />);

    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.passwordLabel),
      "Secure123!",
    );
    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.confirmationLabel),
      "Different123!",
    );
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.reset.submit }),
    );

    expect(resetPassword).not.toHaveBeenCalled();
    expect(
      screen.getByText(passwordRecoveryCopy.reset.errors.passwordsDoNotMatch),
    ).toBeTruthy();
  });

  it("redirects to login after a successful reset", async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockResolvedValue(undefined);
    render(<ResetPasswordForm token="reset-token" />);

    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.passwordLabel),
      "Secure123!",
    );
    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.confirmationLabel),
      "Secure123!",
    );
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.reset.submit }),
    );

    expect(resetPassword).toHaveBeenCalledWith({
      token: "reset-token",
      newPassword: "Secure123!",
    });
    expect(mockReplace).toHaveBeenCalledWith("/login?reset=success");
  });

  it("maps invalid or expired tokens to a neutral message", async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockRejectedValue(
      new ApiError(410, "token detail", "http"),
    );
    render(<ResetPasswordForm token="reset-token" />);

    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.passwordLabel),
      "Secure123!",
    );
    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.confirmationLabel),
      "Secure123!",
    );
    await user.click(
      screen.getByRole("button", { name: passwordRecoveryCopy.reset.submit }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      passwordRecoveryCopy.reset.errors.invalidToken,
    );
    expect(alert.textContent).not.toContain("token detail");
  });

  it("prevents duplicate submissions while the request is pending", async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockReturnValue(new Promise(() => {}));
    render(<ResetPasswordForm token="reset-token" />);

    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.passwordLabel),
      "Secure123!",
    );
    await user.type(
      screen.getByLabelText(passwordRecoveryCopy.reset.confirmationLabel),
      "Secure123!",
    );
    const button = screen.getByRole("button", {
      name: passwordRecoveryCopy.reset.submit,
    });
    await user.click(button);
    await user.click(button);

    expect(resetPassword).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
