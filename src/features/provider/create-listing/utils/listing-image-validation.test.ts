import { describe, expect, it } from "vitest";

import {
  MAX_LISTING_IMAGE_SIZE_BYTES,
  validateListingImageFile,
} from "./listing-image-validation";

describe("validateListingImageFile", () => {
  it.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["photo.png", "image/png"],
    ["photo.webp", "image/webp"],
  ])("accepts %s with MIME type %s", (name, type) => {
    const file = new File(["image"], name, { type });

    expect(validateListingImageFile(file)).toBeNull();
  });

  it("accepts allowed extensions when the browser does not provide a MIME type", () => {
    const file = new File(["image"], "photo.JPG", { type: "" });

    expect(validateListingImageFile(file)).toBeNull();
  });

  it("rejects unsupported MIME types", () => {
    const file = new File(["image"], "photo.gif", { type: "image/gif" });

    expect(validateListingImageFile(file)).toBe("invalid-format");
  });

  it("rejects files larger than 10 MB", () => {
    const file = new File(["image"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", {
      value: MAX_LISTING_IMAGE_SIZE_BYTES + 1,
    });

    expect(validateListingImageFile(file)).toBe("too-large");
  });
});
