import { createAdmission } from "./admission";
import type { PublicListing, PublicListingDetail } from "../types";

export function buildPublicListing(
  overrides: Partial<PublicListing> = {},
): PublicListing {
  return {
    id: "l1",
    title: "Testwohnung",
    location: "Berlin, Mitte",
    rooms: 3,
    livingArea: 80,
    availableFrom: null,
    coldRent: 1200,
    serviceCharge: 200,
    matchesProfile: null,
    admission: createAdmission(),
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
    isNew: false,
    coverImageUrl: null,
    publishedAt: "2026-01-01T00:00:00.000Z",
    applicationAttention: null,
    ...overrides,
  };
}

export function buildPublicListingDetail(
  overrides: Partial<PublicListingDetail> = {},
): PublicListingDetail {
  return {
    id: "detail-1",
    title: "Testwohnung",
    location: "Berlin · Mitte",
    matchesProfile: "unknown",
    admission: createAdmission(),
    hasApplied: false,
    applicationStatus: null,
    publicReason: null,
    isSaved: false,
    street: null,
    zip: null,
    city: "Berlin",
    district: "Mitte",
    objectType: "APARTMENT",
    livingArea: 80,
    rooms: 3,
    bedrooms: 1,
    coldRent: 1200,
    additionalCosts: 200,
    deposit: 2400,
    depositMonths: 2,
    availableFrom: null,
    shortDescription: null,
    publishedAt: null,
    isNew: false,
    images: [],
    schufaRequired: false,
    incomeProofRequired: false,
    suitableForPeopleCount: null,
    petsPolicy: null,
    smokingPolicy: null,
    applicationAttention: null,
    ...overrides,
  };
}
