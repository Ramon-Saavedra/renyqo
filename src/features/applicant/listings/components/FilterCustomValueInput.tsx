"use client";

import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";

interface FilterCustomValueInputProps {
  id: string;
  value: string;
  suffix: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

export function FilterCustomValueInput({
  id,
  value,
  suffix,
  ariaLabel,
  onChange,
  onCommit,
}: FilterCustomValueInputProps) {
  return (
    <InputAffix suffix={suffix}>
      <Input
        id={id}
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        className="pr-22"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onCommit();
        }}
      />
    </InputAffix>
  );
}
