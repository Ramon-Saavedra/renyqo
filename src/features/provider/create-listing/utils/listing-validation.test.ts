import { describe, expect, it } from "vitest";
import { isBedroomRoomRelationshipValid } from "./listing-validation";

describe("isBedroomRoomRelationshipValid", () => {
  it("returns true when rooms is empty", () => {
    expect(isBedroomRoomRelationshipValid("", "2")).toBe(true);
  });

  it("returns true when bedrooms is empty", () => {
    expect(isBedroomRoomRelationshipValid("3", "")).toBe(true);
  });

  it("returns true when bedrooms equals rooms", () => {
    expect(isBedroomRoomRelationshipValid("3", "3")).toBe(true);
  });

  it("returns true when bedrooms is less than rooms", () => {
    expect(isBedroomRoomRelationshipValid("3", "2")).toBe(true);
  });

  it("returns true with decimal rooms", () => {
    expect(isBedroomRoomRelationshipValid("2.5", "2")).toBe(true);
  });

  it("returns true with bedrooms 0", () => {
    expect(isBedroomRoomRelationshipValid("1", "0")).toBe(true);
  });

  it("returns false when bedrooms exceeds rooms", () => {
    expect(isBedroomRoomRelationshipValid("2", "3")).toBe(false);
  });

  it("returns false when bedrooms exceeds decimal rooms", () => {
    expect(isBedroomRoomRelationshipValid("2.5", "3")).toBe(false);
  });

  it("returns true when rooms is individually invalid", () => {
    // Don't double-report — rooms validator handles this case.
    expect(isBedroomRoomRelationshipValid("abc", "2")).toBe(true);
  });

  it("returns true when bedrooms is individually invalid (non-integer)", () => {
    expect(isBedroomRoomRelationshipValid("3", "2.5")).toBe(true);
  });

  it("returns true when bedrooms is negative", () => {
    // Individual bedrooms validator will catch this.
    expect(isBedroomRoomRelationshipValid("3", "-1")).toBe(true);
  });
});
