"use client";

import { useCallback, useMemo, useReducer } from "react";
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
  deposit?: string;
  availableFrom?: string;
  legalAccepted?: string;
}

export interface ListingPhoto {
  readonly id: string;
  readonly src: string;
}

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
  deposit: string;
  availableFrom: string;
  titleOverride: string;
  description: string;
  photos: ReadonlyArray<ListingPhoto>;
  minIncome: string;
  schufa: RequirementOption;
  income: RequirementOption;
  adults: number | null;
  kids: number | null;
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
  deposit: "",
  availableFrom: "",
  titleOverride: "",
  description: "",
  photos: [],
  minIncome: "",
  schufa: "optional",
  income: "optional",
  adults: null,
  kids: null,
  pets: "absprache",
  smoking: "absprache",
  legalAccepted: false,
};

type Action =
  | {
      type: "set";
      field: keyof ListingDraft;
      value: ListingDraft[keyof ListingDraft];
    }
  | { type: "setPhotos"; photos: ReadonlyArray<ListingPhoto> };

function reducer(state: ListingDraft, action: Action): ListingDraft {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "setPhotos":
      return { ...state, photos: action.photos };
  }
}

export interface ListingDraftStore {
  readonly draft: ListingDraft;
  setField<K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ): void;
  setPhotos(photos: ReadonlyArray<ListingPhoto>): void;
}

export function useListingDraft(
  initial: ListingDraft = INITIAL_DRAFT,
): ListingDraftStore {
  const [draft, dispatch] = useReducer(reducer, initial);

  const setField = useCallback(
    <K extends keyof ListingDraft>(field: K, value: ListingDraft[K]) => {
      dispatch({ type: "set", field, value });
    },
    [],
  );

  const setPhotos = useCallback((photos: ReadonlyArray<ListingPhoto>) => {
    dispatch({ type: "setPhotos", photos });
  }, []);

  return useMemo(
    () => ({ draft, setField, setPhotos }),
    [draft, setField, setPhotos],
  );
}
