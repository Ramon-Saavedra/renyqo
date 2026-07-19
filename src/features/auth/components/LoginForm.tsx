"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiApple } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button/Button";
import { BrandIcon } from "@/components/ui/icon/BrandIcon";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { getOnboardingState, login, resolveRedirectPath } from "@/lib/api/auth";
import { resolveAuthErrorCategory } from "@/features/auth/utils/api-error";
import {
  type LoginFieldErrors,
  validateLoginFields,
} from "@/features/auth/utils/validation";
import { resolveLoginErrorMessage } from "@/features/auth/utils/login-error";
import { loginCopy } from "../copy/login";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { SocialButton } from "./SocialButton";

interface LoginFormProps {
  initialSuccessMessage?: string;
}

export function LoginForm({ initialSuccessMessage }: LoginFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(
    initialSuccessMessage ?? null,
  );

  function clearFieldError(field: keyof LoginFieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const data = new FormData(e.currentTarget);
    const emailValue = data.get("email");
    const passwordValue = data.get("password");
    const email = typeof emailValue === "string" ? emailValue.trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const validationErrors = validateLoginFields(email, password, {
      emailRequired: loginCopy.errors.emailRequired,
      emailInvalid: loginCopy.errors.emailInvalid,
      passwordRequired: loginCopy.errors.passwordRequired,
    });

    setFieldErrors(validationErrors);
    setError(null);
    setSuccessMessage(null);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      await login({ email, password });

      let nextStep: Awaited<ReturnType<typeof getOnboardingState>>["nextStep"];
      try {
        nextStep = (await getOnboardingState()).nextStep;
      } catch {
        setError(loginCopy.errors.onboarding);
        setLoading(false);
        return;
      }

      router.push(resolveRedirectPath(nextStep));
    } catch (err) {
      const message = resolveLoginErrorMessage(resolveAuthErrorCategory(err));
      if (message) setError(message);
      setLoading(false);
    }
  }

  return (
    <form
      noValidate
      aria-busy={loading}
      aria-describedby={error ? "login-form-error" : undefined}
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col rounded-md border border-border bg-background px-8 pb-7 pt-8"
    >
      {successMessage && (
        <FormAlert
          id="login-form-success"
          variant="success"
          message={successMessage}
          className="mb-4"
        />
      )}

      <div className="mb-5.5 grid gap-2.5">
        <SocialButton
          icon={<BrandIcon icon={FcGoogle} size={16} decorative />}
          aria-label={loginCopy.google}
          disabled={loading}
        >
          {loginCopy.google}
        </SocialButton>
        <SocialButton
          icon={<BrandIcon icon={SiApple} size={16} decorative />}
          aria-label={loginCopy.apple}
          disabled={loading}
        >
          {loginCopy.apple}
        </SocialButton>
      </div>

      <div className="mb-4.5 flex items-center gap-3 font-mono text-meta uppercase text-foreground-tertiary">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        {loginCopy.divider}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      <Field
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={loginCopy.fields.email.label}
        placeholder={loginCopy.fields.email.placeholder}
        required
        disabled={loading}
        error={fieldErrors.email}
        onChange={() => clearFieldError("email")}
        className="mb-3.5"
      />

      <div className="mb-2">
        <PasswordField
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
          disabled={loading}
          error={fieldErrors.password}
          onChange={() => clearFieldError("password")}
          label={loginCopy.fields.password.label}
          placeholder={loginCopy.fields.password.placeholder}
          showLabel={loginCopy.fields.password.show}
          hideLabel={loginCopy.fields.password.hide}
        />
      </div>

      <Link
        href="/forgot-password"
        className="mb-4 self-end text-caption font-medium text-primary hover:text-primary-hover"
      >
        {loginCopy.forgotPassword}
      </Link>

      {error && (
        <FormAlert
          id="login-form-error"
          variant="error"
          message={error}
          className="mb-4"
        />
      )}

      <Button
        type="submit"
        disabled={loading}
        className="mb-4.5 w-full justify-center"
      >
        {loading ? loginCopy.submitting : loginCopy.submit}
      </Button>
      {loading && (
        <span role="status" className="sr-only">
          {loginCopy.submitting}
        </span>
      )}

      <div className="flex items-center justify-center gap-1.5 text-caption text-foreground-secondary">
        {loginCopy.noAccount}
        <Link
          href="/register/account-type"
          className="font-medium text-primary hover:text-primary-hover"
        >
          {loginCopy.register}
        </Link>
      </div>
    </form>
  );
}
