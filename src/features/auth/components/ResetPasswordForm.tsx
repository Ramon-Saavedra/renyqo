"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { resetPassword } from "@/lib/api/auth";
import { resolveAuthErrorCategory } from "@/features/auth/utils/api-error";
import { resolveResetPasswordErrorMessage } from "@/features/auth/utils/password-recovery-error";
import { passwordRecoveryCopy } from "../copy/password-recovery";
import { PasswordField } from "./PasswordField";

interface ResetPasswordFormProps {
  token: string;
}

interface ResetPasswordFieldErrors {
  password?: string;
  confirmation?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [error, setError] = useState<string | null>(
    token ? null : passwordRecoveryCopy.reset.errors.missingToken,
  );

  const formLocked = loading || !token;

  function clearFieldError(field: keyof ResetPasswordFieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formLocked) return;

    const nextErrors: ResetPasswordFieldErrors = {};
    if (!password) {
      nextErrors.password = passwordRecoveryCopy.reset.errors.passwordRequired;
    } else if (password.length < 8) {
      nextErrors.password = passwordRecoveryCopy.reset.errors.passwordTooShort;
    }
    if (!confirmation) {
      nextErrors.confirmation =
        passwordRecoveryCopy.reset.errors.confirmationRequired;
    } else if (password !== confirmation) {
      nextErrors.confirmation =
        passwordRecoveryCopy.reset.errors.passwordsDoNotMatch;
    }

    setFieldErrors(nextErrors);
    setError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      router.replace("/login?reset=success");
    } catch (err) {
      const message = resolveResetPasswordErrorMessage(
        resolveAuthErrorCategory(err),
      );
      if (message) setError(message);
      setLoading(false);
    }
  }

  return (
    <form
      noValidate
      aria-busy={loading}
      aria-describedby={error ? "reset-password-error" : undefined}
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col rounded-md border border-border bg-background px-8 pb-7 pt-8"
    >
      <div className="mb-4.5">
        <PasswordField
          id="reset-password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
          label={passwordRecoveryCopy.reset.passwordLabel}
          placeholder={passwordRecoveryCopy.reset.passwordPlaceholder}
          showLabel={passwordRecoveryCopy.reset.showPassword}
          hideLabel={passwordRecoveryCopy.reset.hidePassword}
          disabled={formLocked}
          error={fieldErrors.password}
        />
      </div>

      <div className="mb-4.5">
        <PasswordField
          id="reset-password-confirmation"
          name="passwordConfirmation"
          autoComplete="new-password"
          minLength={8}
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            clearFieldError("confirmation");
          }}
          label={passwordRecoveryCopy.reset.confirmationLabel}
          placeholder={passwordRecoveryCopy.reset.confirmationPlaceholder}
          showLabel={passwordRecoveryCopy.reset.showPassword}
          hideLabel={passwordRecoveryCopy.reset.hidePassword}
          disabled={formLocked}
          error={fieldErrors.confirmation}
        />
      </div>

      {error && (
        <FormAlert
          id="reset-password-error"
          variant="error"
          message={error}
          className="mb-4"
        />
      )}

      <Button
        type="submit"
        disabled={formLocked}
        className="w-full justify-center"
      >
        {loading
          ? passwordRecoveryCopy.reset.submitting
          : passwordRecoveryCopy.reset.submit}
      </Button>
      {loading && (
        <span role="status" className="sr-only">
          {passwordRecoveryCopy.reset.submitting}
        </span>
      )}
    </form>
  );
}
