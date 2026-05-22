import Link from "next/link";
import { Button } from "@/components/ui/button/Button";
import { Field } from "./Field";
import { PasswordField } from "./PasswordField";
import { Checkbox } from "./Checkbox";
import { AppleIcon, GoogleIcon, SocialButton } from "./SocialButton";
import { createAccountCopy } from "../copy/create-account";

interface CreateAccountFormProps {
  idPrefix: string;
}

export function CreateAccountForm({ idPrefix }: CreateAccountFormProps) {
  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;
  const consentId = `${idPrefix}-terms`;

  return (
    <form
      noValidate
      className="mx-auto w-full max-w-md rounded-md border border-border bg-background px-8 pt-8 pb-7"
    >
      <div className="grid gap-2.5">
        <SocialButton
          icon={<GoogleIcon />}
          aria-label={createAccountCopy.google}
        >
          {createAccountCopy.google}
        </SocialButton>
        <SocialButton icon={<AppleIcon />} aria-label={createAccountCopy.apple}>
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
        className="mb-3.5"
      />

      <PasswordField
        id={passwordId}
        name="password"
        autoComplete="new-password"
        minLength={8}
        required
        label={createAccountCopy.fields.password.label}
        placeholder={createAccountCopy.fields.password.placeholder}
        hint={createAccountCopy.fields.password.hint}
      />

      <Checkbox id={consentId} name="terms" required className="mt-1.5 mb-4.5">
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

      <Button type="submit" className="w-full justify-center">
        {createAccountCopy.submit}
      </Button>

      <div className="mt-4.5 flex items-center justify-center gap-1.5 text-caption text-foreground-secondary">
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
