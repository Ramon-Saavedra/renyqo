"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";

type FilterCustomCommitSource = "enter" | "blur";

interface FilterCustomValueInputProps {
  id: string;
  value: string;
  suffix: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onCommit: (source: FilterCustomCommitSource) => boolean;
}

export function FilterCustomValueInput({
  id,
  value,
  suffix,
  ariaLabel,
  onChange,
  onCommit,
}: FilterCustomValueInputProps) {
  const skipBlurCommitRef = useRef(false);

  return (
    <InputAffix suffix={suffix}>
      <Input
        id={id}
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value}
        className="pr-22"
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          onCommit("blur");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          skipBlurCommitRef.current = onCommit("enter");
        }}
      />
    </InputAffix>
  );
}
