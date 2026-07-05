"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiApple } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button/Button";
import { BrandIcon } from "@/components/ui/icon/BrandIcon";
import { FieldError } from "@/components/ui/form/FieldError";
import { FormAlert } from "@/components/ui/form/FormAlert";
import { ApiError } from "@/lib/api/client";
import {
  register,
  getOnboardingState,
  resolveRedirectPath,
  type UserRole,
} from "@/lib/api/auth";
import {
  getPasswordStrength,
  generateSecurePassword,
  type PasswordStrength,
} from "@/features/auth/utils/password";
import { createAccountCopy } from "../copy/create-account";
import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { SocialButton } from "./SocialButton";

interface CreateAccountFormProps {
  idPrefix: string;
  role: UserRole;
}

interface FormErrors {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  terms?: string | undefined;
}

type GlobalMessage = { variant: "error" | "success"; text: string };

const STRENGTH_LEVELS: Record<PasswordStrength, number> = {
  schwach: 1,
  mittel: 2,
  stark: 3,
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(
  name: string,
  email: string,
  password: string,
  termsChecked: boolean,
): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = createAccountCopy.validation.name;
  if (!isValidEmail(email)) errors.email = createAccountCopy.validation.email;
  if (password.length < 8)
    errors.password = createAccountCopy.validation.password;
  if (!termsChecked) errors.terms = createAccountCopy.validation.terms;
  return errors;
}

export function CreateAccountForm({ idPrefix, role }: CreateAccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [globalMessage, setGlobalMessage] = useState<GlobalMessage | null>(
    null,
  );

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const consentId = `${idPrefix}-terms`;

  const strength = getPasswordStrength(password);

  function handleSuggestPassword() {
    setPassword(generateSecurePassword());
    setFieldErrors((prev) => ({ ...prev, password: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGlobalMessage(null);

    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string).trim();
    const email = (data.get("email") as string).trim();
    const termsChecked = data.get("terms") === "on";

    const errors = validateForm(name, email, password, termsChecked);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ email: createAccountCopy.validation.emailTaken });
      } else if (err instanceof ApiError && err.status === 0) {
        setGlobalMessage({
          variant: "error",
          text: createAccountCopy.globalErrors.unavailable,
        });
      } else {
        setGlobalMessage({
          variant: "error",
          text: createAccountCopy.globalErrors.unknown,
        });
      }
      setLoading(false);
      return;
    }

    setGlobalMessage({
      variant: "success",
      text: createAccountCopy.success,
    });

    let path = "/provider/get-started";
    try {
      const { nextStep } = await getOnboardingState();
      path = resolveRedirectPath(nextStep);
    } catch {}

    setTimeout(() => router.push(path), 1500);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-md border border-border bg-background px-8 pt-8 pb-7"
    >
      <div className="grid gap-2.5">
        <SocialButton
          icon={<BrandIcon icon={FcGoogle} size={16} decorative />}
          aria-label={createAccountCopy.google}
          disabled={loading}
        >
          {createAccountCopy.google}
        </SocialButton>
        <SocialButton
          icon={<BrandIcon icon={SiApple} size={16} decorative />}
          aria-label={createAccountCopy.apple}
          disabled={loading}
        >
          {createAccountCopy.apple}
        </SocialButton>
      </div>

      <div className="mt-5.5 mb-4.5 flex items-center gap-3 font-mono text-meta uppercase text-foreground-tertiary">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        {createAccountCopy.divider}
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      <Field
        id={nameId}
        name="name"
        type="text"
        autoComplete="name"
        label={createAccountCopy.fields.name.label}
        placeholder={createAccountCopy.fields.name.placeholder}
        required
        disabled={loading}
        error={fieldErrors.name}
        onChange={() =>
          setFieldErrors((prev) => ({ ...prev, name: undefined }))
        }
        className="mb-3.5"
      />

      <Field
        id={emailId}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        label={createAccountCopy.fields.email.label}
        placeholder={createAccountCopy.fields.email.placeholder}
        required
        disabled={loading}
        error={fieldErrors.email}
        onChange={() =>
          setFieldErrors((prev) => ({ ...prev, email: undefined }))
        }
        className="mb-3.5"
      />

      <div className="mb-4">
        <PasswordField
          id={passwordId}
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          label={createAccountCopy.fields.password.label}
          placeholder={createAccountCopy.fields.password.placeholder}
          error={fieldErrors.password}
        />

        {password.length > 0 && strength && (
          <div className="mb-1 flex items-center gap-3 pt-2">
            <div className="flex flex-1 gap-1">
              {([1, 2, 3] as const).map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= STRENGTH_LEVELS[strength]
                      ? strength === "stark"
                        ? "bg-success"
                        : "bg-warning"
                      : "bg-border",
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                "shrink-0 text-caption",
                strength === "stark" ? "text-success" : "text-warning",
              )}
            >
              {createAccountCopy.passwordStrength[strength]}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleSuggestPassword}
          className="pt-1 text-caption font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createAccountCopy.passwordStrength.suggest}
        </button>
      </div>

      <div className="pt-1.5 mb-4">
        <Checkbox
          id={consentId}
          name="terms"
          required
          disabled={loading}
          onChange={() =>
            setFieldErrors((prev) => ({ ...prev, terms: undefined }))
          }
          className="mb-1.5"
        >
          {createAccountCopy.consent.prefix}
          <a
            href="#nutzungsbedingungen"
            className="font-medium text-primary hover:text-primary-hover"
          >
            {createAccountCopy.consent.terms}
          </a>
          {createAccountCopy.consent.middle}
          <a
            href="#datenschutz"
            className="font-medium text-primary hover:text-primary-hover"
          >
            {createAccountCopy.consent.privacy}
          </a>
          {createAccountCopy.consent.suffix}
        </Checkbox>
        {fieldErrors.terms && <FieldError message={fieldErrors.terms} />}
      </div>

      {globalMessage && (
        <FormAlert
          variant={globalMessage.variant}
          message={globalMessage.text}
          className="mb-4"
        />
      )}

      <Button
        type="submit"
        disabled={loading}
        className="mb-4.5 w-full justify-center"
      >
        {loading ? createAccountCopy.submitting : createAccountCopy.submit}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-caption text-foreground-secondary">
        {createAccountCopy.alreadyAccount}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-hover"
        >
          {createAccountCopy.signIn}
        </Link>
      </div>
    </form>
  );
}
