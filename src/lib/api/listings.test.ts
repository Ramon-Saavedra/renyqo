import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiPatch, apiPatchVoid, apiPost, apiPostFormData } from "./client";
import {
  createListingDraft,
  publishListing,
  reorderListingImages,
  updateListing,
  uploadListingImage,
  type CreateListingPayload,
  type ListingImage,
  type UpdateListingPayload,
} from "./listings";

vi.mock("./client", () => ({
  apiPatch: vi.fn(),
  apiPatchVoid: vi.fn(),
  apiPost: vi.fn(),
  apiPostFormData: vi.fn(),
}));

const PAYLOAD: CreateListingPayload = {
  city: "Berlin",
  zip: "10115",
  street: undefined,
  showExactAddress: false,
  objectType: "APARTMENT",
  livingArea: 65,
  rooms: 3,
  bedrooms: null,
  coldRent: 1100,
  additionalCosts: undefined,
  depositMonths: 2,
  deposit: 2200,
  availableFrom: "2026-07-01",
  title: "Wohnung in Berlin",
  shortDescription: "Helle Wohnung",
  minimumHouseholdNetIncome: null,
  schufaRequired: false,
  incomeProofRequired: true,
  suitableForPeopleCount: null,
  petsPolicy: "BY_ARRANGEMENT",
  smokingPolicy: "NON_SMOKERS_PREFERRED",
};

describe("createListingDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses JSON when no file is provided", async () => {
    vi.mocked(apiPost).mockResolvedValue({ id: "listing-1" } as never);

    await expect(createListingDraft(PAYLOAD)).resolves.toEqual({
      id: "listing-1",
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/provider/listings", PAYLOAD);
    expect(apiPostFormData).not.toHaveBeenCalled();
  });

  it("uses FormData with the first image under the file field when a file is provided", async () => {
    vi.mocked(apiPostFormData).mockResolvedValue({ id: "listing-1" } as never);
    const file = new File(["image"], "cover.jpg", { type: "image/jpeg" });

    await createListingDraft(PAYLOAD, file);

    expect(apiPost).not.toHaveBeenCalled();
    expect(apiPostFormData).toHaveBeenCalledWith(
      "/api/v1/provider/listings",
      expect.any(FormData),
    );

    const formData = vi.mocked(apiPostFormData).mock.calls[0]?.[1] as FormData;
    expect(formData.get("file")).toBe(file);
    expect(formData.get("city")).toBe("Berlin");
    expect(formData.get("showExactAddress")).toBe("false");
    expect(formData.get("livingArea")).toBe("65");
    expect(formData.get("depositMonths")).toBe("2");
    expect(formData.get("deposit")).toBe("2200");
    expect(formData.get("incomeProofRequired")).toBe("true");
    expect(formData.get("smokingPolicy")).toBe("NON_SMOKERS_PREFERRED");
    expect(formData.has("street")).toBe(false);
    expect(formData.has("bedrooms")).toBe(false);
    expect(formData.has("additionalCosts")).toBe(false);
    expect(formData.has("minimumHouseholdNetIncome")).toBe(false);
    expect(formData.has("suitableForPeopleCount")).toBe(false);
  });
});

describe("uploadListingImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads one image and returns the complete ListingImage object", async () => {
    const image: ListingImage = {
      id: "img-1",
      secureUrl: "https://example.com/photo.jpg",
      position: 0,
      isCover: true,
    };
    vi.mocked(apiPostFormData).mockResolvedValue(image as never);
    const file = new File(["image"], "gallery.jpg", { type: "image/jpeg" });

    await expect(uploadListingImage("listing-1", file)).resolves.toEqual(image);

    expect(apiPostFormData).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/images",
      expect.any(FormData),
    );

    const formData = vi.mocked(apiPostFormData).mock.calls[0]?.[1] as FormData;
    expect(Array.from(formData.keys())).toEqual(["file"]);
    expect(formData.get("file")).toBe(file);
  });
});

describe("reorderListingImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the ordered image ID array to the images/order endpoint", async () => {
    vi.mocked(apiPatch).mockResolvedValue(undefined);

    await reorderListingImages("listing-1", ["img-2", "img-1", "img-3"]);

    expect(apiPatch).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/images/order",
      { imageIds: ["img-2", "img-1", "img-3"] },
    );
  });
});

describe("publishListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiPatchVoid with the correct publish endpoint", async () => {
    vi.mocked(apiPatchVoid).mockResolvedValue(undefined);

    await publishListing("listing-1");

    expect(apiPatchVoid).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1/publish",
    );
  });
});

describe("updateListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls apiPatch with the correct endpoint and payload", async () => {
    const payload: UpdateListingPayload = { title: "Neuer Titel" };
    vi.mocked(apiPatch).mockResolvedValue(undefined);

    await updateListing("listing-1", payload);

    expect(apiPatch).toHaveBeenCalledWith(
      "/api/v1/provider/listings/listing-1",
      payload,
    );
  });
});
