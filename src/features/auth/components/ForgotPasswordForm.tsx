"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { forgotPassword } from "@/lib/api/auth";
import { resolveAuthErrorCategory } from "@/features/auth/utils/api-error";
import { isValidEmail } from "@/features/auth/utils/validation";
import { resolveForgotPasswordErrorMessage } from "@/features/auth/utils/password-recovery-error";
import { passwordRecoveryCopy } from "../copy/password-recovery";
import { Field } from "./Field";

interface ForgotPasswordFieldErrors {
  email?: string;
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  function clearEmailError() {
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const value = new FormData(e.currentTarget).get("email");
    const email = typeof value === "string" ? value.trim() : "";
    const nextErrors: ForgotPasswordFieldErrors = {};

    if (!email) {
      nextErrors.email = passwordRecoveryCopy.forgot.errors.emailRequired;
    } else if (!isValidEmail(email)) {
      nextErrors.email = passwordRecoveryCopy.forgot.errors.emailInvalid;
    }

    setFieldErrors(nextErrors);
    setError(null);
    setSubmitted(false);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      const message = resolveForgotPasswordErrorMessage(
        resolveAuthErrorCategory(err),
      );
      if (message) setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      noValidate
      aria-busy={loading}
      aria-describedby={error ? "forgot-password-error" : undefined}
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col rounded-md border border-border bg-background px-8 pb-7 pt-8"
    >
      {submitted && (
        <FormAlert
          variant="success"
          message={passwordRecoveryCopy.forgot.success}
          className="mb-4"
        />
      )}

      <Field
        id="forgot-password-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={passwordRecoveryCopy.forgot.emailLabel}
        placeholder={passwordRecoveryCopy.forgot.emailPlaceholder}
        required
        disabled={loading}
        error={fieldErrors.email}
        onChange={clearEmailError}
        className="mb-4.5"
      />

      {error && (
        <FormAlert
          id="forgot-password-error"
          variant="error"
          message={error}
          className="mb-4"
        />
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center"
      >
        {loading
          ? passwordRecoveryCopy.forgot.submitting
          : submitted
            ? passwordRecoveryCopy.forgot.resend
            : passwordRecoveryCopy.forgot.submit}
      </Button>
      {loading && (
        <span role="status" className="sr-only">
          {passwordRecoveryCopy.forgot.submitting}
        </span>
      )}
    </form>
  );
}
