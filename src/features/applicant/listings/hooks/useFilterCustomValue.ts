import { useState } from "react";
import {
  digitsOnly,
  isCustomFilterValue,
  parseFilterInteger,
} from "../utils/filter-value";

interface UseFilterCustomValueResult {
  readonly customMode: boolean;
  readonly draft: string;
  readonly selectPreset: (value: number | null) => void;
  readonly selectCustom: () => void;
  readonly setDraft: (raw: string) => void;
  readonly commit: () => void;
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

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      setCustomMode(false);
      setDraftState("");
      if (value !== null) onChange(null);
      return;
    }
    const parsed = parseFilterInteger(trimmed);
    if (parsed === null) {
      setDraftState(
        isCustomFilterValue(options, value) && value !== null
          ? String(value)
          : "",
      );
      return;
    }
    onChange(parsed);
    if (isCustomFilterValue(options, parsed)) {
      setCustomMode(true);
      setDraftState(String(parsed));
      return;
    }
    setCustomMode(false);
    setDraftState("");
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
