import { useState } from "react";
import {
  digitsOnly,
  isCustomFilterValue,
  parseFilterInteger,
} from "../utils/filter-value";

export type FilterCustomCommitResult =
  | { readonly kind: "kept" }
  | { readonly kind: "preset"; readonly value: number }
  | { readonly kind: "cleared" };

interface UseFilterCustomValueResult {
  readonly customMode: boolean;
  readonly draft: string;
  readonly selectPreset: (value: number | null) => void;
  readonly selectCustom: () => void;
  readonly setDraft: (raw: string) => void;
  readonly commit: () => FilterCustomCommitResult;
}

export function useFilterCustomValue(
  value: number | null,
  options: readonly { readonly value: number | null }[],
  onChange: (value: number | null) => void,
): UseFilterCustomValueResult {
  const [customMode, setCustomMode] = useState(() =>
    isCustomFilterValue(options, value),
  );
  const [draft, setDraftState] = useState(() =>
    isCustomFilterValue(options, value) && value !== null ? String(value) : "",
  );
  const [syncedValue, setSyncedValue] = useState(value);
  const [syncedOptions, setSyncedOptions] = useState(options);

  if (value !== syncedValue || options !== syncedOptions) {
    setSyncedValue(value);
    setSyncedOptions(options);
    if (isCustomFilterValue(options, value)) {
      setCustomMode(true);
      setDraftState(String(value));
    } else {
      setCustomMode(false);
      setDraftState("");
    }
  }

  const selectPreset = (next: number | null) => {
    setCustomMode(false);
    setDraftState("");
    onChange(next);
  };

  const selectCustom = () => {
    setCustomMode(true);
    setDraftState(value !== null ? String(value) : "");
  };

  const setDraft = (raw: string) => {
    setDraftState(digitsOnly(raw));
  };

  const commit = (): FilterCustomCommitResult => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      setCustomMode(false);
      setDraftState("");
      if (value !== null) onChange(null);
      return { kind: "cleared" };
    }
    const parsed = parseFilterInteger(trimmed);
    if (parsed === null) {
      setDraftState(
        isCustomFilterValue(options, value) && value !== null
          ? String(value)
          : "",
      );
      return { kind: "kept" };
    }
    onChange(parsed);
    if (isCustomFilterValue(options, parsed)) {
      setCustomMode(true);
      setDraftState(String(parsed));
      return { kind: "kept" };
    }
    setCustomMode(false);
    setDraftState("");
    return { kind: "preset", value: parsed };
  };

  return {
    customMode,
    draft,
    selectPreset,
    selectCustom,
    setDraft,
    commit,
  };
}
