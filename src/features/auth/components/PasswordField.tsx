"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { Field } from "./Field";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  name?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  disabled?: boolean;
  showLabel?: string;
  hideLabel?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  error?: string | undefined;
}

export function PasswordField({
  showLabel = "Passwort anzeigen",
  hideLabel = "Passwort verbergen",
  disabled,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      {...props}
      disabled={disabled}
      type={visible ? "text" : "password"}
      inputClassName="pr-11"
      trailing={
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? hideLabel : showLabel}
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
