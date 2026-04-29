"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Field } from "./Field";
import { createAccountCopy } from "../copy/create-account";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  name?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const labelToggle = visible
    ? createAccountCopy.fields.password.hide
    : createAccountCopy.fields.password.show;

  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      inputClassName="pr-11"
      trailing={
        <button
          type="button"
          aria-label={labelToggle}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-sm p-2 text-foreground-tertiary transition-colors hover:bg-background-subtle hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus"
        >
          <AppIcon icon={Eye} size={16} strokeWidth={1.6} decorative />
        </button>
      }
    />
  );
}
