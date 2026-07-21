"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  ObjectType,
  PetOption,
  RequirementOption,
  RoomOption,
  SmokingOption,
} from "../copy/create-listing";

export interface ListingDraftErrors {
  city?: string;
  zip?: string;
  street?: string;
  area?: string;
  rooms?: string;
  bedrooms?: string;
  price?: string;
  additionalCosts?: string;
  depositMonths?: string;
  deposit?: string;
  availableFrom?: string;
  minIncome?: string;
  peopleCount?: string;
  legalAccepted?: string;
}

export interface ListingPhoto {
  readonly id: string;
  readonly src: string;
  readonly file: File;
}

export type DepositMonths = 1 | 2 | 3;

export interface ListingDraft {
  city: string;
  zip: string;
  street: string;
  hideAddress: boolean;
  objectType: ObjectType;
  area: string;
  rooms: RoomOption;
  bedrooms: number | null;
  price: string;
  additionalCosts: string;
  depositMonths: DepositMonths;
  deposit: string;
  availableFrom: string;
  titleOverride: string;
  description: string;
  photos: ReadonlyArray<ListingPhoto>;
  minIncome: string;
  schufa: RequirementOption;
  income: RequirementOption;
  /** Own optional eligibility criterion — not derived from household figures. */
  peopleCount: number | null;
  pets: PetOption;
  smoking: SmokingOption;
  legalAccepted: boolean;
}

export const INITIAL_DRAFT: ListingDraft = {
  city: "",
  zip: "",
  street: "",
  hideAddress: true,
  objectType: "wohnung",
  area: "",
  rooms: "",
  bedrooms: null,
  price: "",
  additionalCosts: "",
  depositMonths: 2,
  deposit: "",
  availableFrom: "",
  titleOverride: "",
  description: "",
  photos: [],
  minIncome: "",
  schufa: "optional",
  income: "optional",
  peopleCount: null,
  pets: "",
  smoking: "",
  legalAccepted: false,
};

const HISTORY_DEBOUNCE_MS = 500;
const MAX_HISTORY_LENGTH = 80;
const TEXT_GROUP_CHAR_LIMIT = 4;
const LOGICAL_BOUNDARY_CHARS = new Set([
  " ",
  "\n",
  "\t",
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  '"',
  "'",
  "/",
  "-",
  "\\",
]);

type Action =
  | {
      type: "set";
      field: keyof ListingDraft;
      value: ListingDraft[keyof ListingDraft];
      debounced: boolean;
    }
  | { type: "setPhotos"; photos: ReadonlyArray<ListingPhoto> }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "closeDebouncedGroup" };

interface ListingDraftHistoryState {
  readonly draft: ListingDraft;
  readonly past: ReadonlyArray<ListingDraft>;
  readonly future: ReadonlyArray<ListingDraft>;
  readonly textGroup: TextHistoryGroup | null;
}

interface TextHistoryGroup {
  readonly field: keyof ListingDraft;
  readonly value: string;
}

function appendHistory(
  past: ReadonlyArray<ListingDraft>,
  draft: ListingDraft,
): ReadonlyArray<ListingDraft> {
  const next = [...past, draft];
  return next.length > MAX_HISTORY_LENGTH ? next.slice(1) : next;
}

function isDebouncedFieldValue(value: ListingDraft[keyof ListingDraft]) {
  return typeof value === "string";
}

function isSimpleTextEdit(current: string, next: string): boolean {
  return next.startsWith(current) || current.startsWith(next);
}

function addsLogicalBoundary(current: string, next: string): boolean {
  if (!next.startsWith(current) || next.length <= current.length) return false;
  return Array.from(next.slice(current.length)).some((char) =>
    LOGICAL_BOUNDARY_CHARS.has(char),
  );
}

function shouldAppendTextHistory(
  state: ListingDraftHistoryState,
  field: keyof ListingDraft,
  nextValue: string,
): boolean {
  const currentValue = state.draft[field];
  const textGroup = state.textGroup;

  if (typeof currentValue !== "string") return true;
  if (!textGroup || textGroup.field !== field) return true;
  if (!isSimpleTextEdit(currentValue, nextValue)) return true;
  if (addsLogicalBoundary(currentValue, nextValue)) return true;

  return (
    Math.abs(nextValue.length - textGroup.value.length) >= TEXT_GROUP_CHAR_LIMIT
  );
}

function reducer(
  state: ListingDraftHistoryState,
  action: Action,
): ListingDraftHistoryState {
  switch (action.type) {
    case "set": {
      if (Object.is(state.draft[action.field], action.value)) return state;
      const nextDraft = { ...state.draft, [action.field]: action.value };
      if (action.debounced && typeof action.value === "string") {
        const shouldAppend = shouldAppendTextHistory(
          state,
          action.field,
          action.value,
        );
        const textGroup = {
          field: action.field,
          value: shouldAppend
            ? action.value
            : (state.textGroup?.value ?? action.value),
        };
        return {
          draft: nextDraft,
          past: shouldAppend
            ? appendHistory(state.past, state.draft)
            : state.past,
          future: [],
          textGroup,
        };
      }
      return {
        draft: nextDraft,
        past: appendHistory(state.past, state.draft),
        future: [],
        textGroup: null,
      };
    }
    case "setPhotos":
      if (state.draft.photos === action.photos) return state;
      return {
        draft: { ...state.draft, photos: action.photos },
        past: appendHistory(state.past, state.draft),
        future: [],
        textGroup: null,
      };
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        draft: previous,
        past: state.past.slice(0, -1),
        future: [state.draft, ...state.future],
        textGroup: null,
      };
    }
    case "redo": {
      const [next, ...future] = state.future;
      if (!next) return state;
      return {
        draft: next,
        past: appendHistory(state.past, state.draft),
        future,
        textGroup: null,
      };
    }
    case "closeDebouncedGroup":
      return state.textGroup ? { ...state, textGroup: null } : state;
  }
}

export interface ListingDraftStore {
  readonly draft: ListingDraft;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  setField<K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ): void;
  setPhotos(photos: ReadonlyArray<ListingPhoto>): void;
  undo(): void;
  redo(): void;
}

export function useListingDraft(
  initial: ListingDraft = INITIAL_DRAFT,
): ListingDraftStore {
  const debounceTimerRef = useRef<number | null>(null);
  const [state, dispatch] = useReducer(reducer, initial, (draft) => ({
    draft,
    past: [],
    future: [],
    textGroup: null,
  }));

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current === null) return;
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  const scheduleDebouncedGroupClose = useCallback(() => {
    clearDebounceTimer();
    debounceTimerRef.current = window.setTimeout(() => {
      dispatch({ type: "closeDebouncedGroup" });
      debounceTimerRef.current = null;
    }, HISTORY_DEBOUNCE_MS);
  }, [clearDebounceTimer]);

  const setField = useCallback(
    <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => {
      const debounced = isDebouncedFieldValue(value);
      if (debounced) {
        scheduleDebouncedGroupClose();
      } else {
        clearDebounceTimer();
      }
      dispatch({ type: "set", field, value, debounced });
    },
    [clearDebounceTimer, scheduleDebouncedGroupClose],
  );

  const setPhotos = useCallback(
    (photos: ReadonlyArray<ListingPhoto>) => {
      clearDebounceTimer();
      dispatch({ type: "setPhotos", photos });
    },
    [clearDebounceTimer],
  );

  const undo = useCallback(() => {
    clearDebounceTimer();
    dispatch({ type: "undo" });
  }, [clearDebounceTimer]);

  const redo = useCallback(() => {
    clearDebounceTimer();
    dispatch({ type: "redo" });
  }, [clearDebounceTimer]);

  useEffect(() => clearDebounceTimer, [clearDebounceTimer]);

  return useMemo(
    () => ({
      draft: state.draft,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      setField,
      setPhotos,
      undo,
      redo,
    }),
    [redo, setField, setPhotos, state.draft, state.future, state.past, undo],
  );
}
