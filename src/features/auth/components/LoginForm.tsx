"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiApple } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button/Button";
import { BrandIcon } from "@/components/ui/icon/BrandIcon";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { ApiError } from "@/lib/api/client";
import { login, getOnboardingState, resolveRedirectPath } from "@/lib/api/auth";
import { loginCopy } from "../copy/login";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { SocialButton } from "./SocialButton";

function resolveLoginError(status: number): string {
  if (status === 0)
    return "Der Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal.";
  if (status === 400) return "Bitte überprüfe deine Eingaben.";
  if (status === 401) return "E-Mail oder Passwort ist nicht korrekt.";
  return "Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.";
}

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    const email = (data.get("email") as string).trim();
    const password = data.get("password") as string;

    try {
      await login({ email, password });
      const { nextStep } = await getOnboardingState();
      router.push(resolveRedirectPath(nextStep));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? resolveLoginError(err.status)
          : "Ein unbekannter Fehler ist aufgetreten.",
      );
      setLoading(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-md border border-border bg-background px-8 pt-8 pb-7"
    >
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
        className="mb-3.5"
      />

      <div className="mb-4.5">
        <PasswordField
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
          disabled={loading}
          label={loginCopy.fields.password.label}
          placeholder={loginCopy.fields.password.placeholder}
          showLabel={loginCopy.fields.password.show}
          hideLabel={loginCopy.fields.password.hide}
        />
      </div>

      {error && <FormAlert variant="error" message={error} className="mb-4" />}

      <Button
        type="submit"
        disabled={loading}
        className="mb-4.5 w-full justify-center"
      >
        {loading ? loginCopy.submitting : loginCopy.submit}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-caption text-foreground-secondary">
        {loginCopy.noAccount}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary-hover"
        >
          {loginCopy.register}
        </Link>
      </div>
    </form>
  );
}
