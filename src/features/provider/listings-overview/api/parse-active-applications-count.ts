import { MAX_ACTIVE_APPLICATIONS } from "../types";

export class InvalidActiveApplicationsCountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidActiveApplicationsCountError";
  }
}

export function parseActiveApplicationsCount(value: unknown): number {
  if (value === undefined) {
    throw new InvalidActiveApplicationsCountError(
      "activeApplicationsCount is required",
    );
  }

  if (value === null) {
    throw new InvalidActiveApplicationsCountError(
      "activeApplicationsCount must not be null",
    );
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new InvalidActiveApplicationsCountError(
      "activeApplicationsCount must be an integer",
    );
  }

  if (value < 0 || value > MAX_ACTIVE_APPLICATIONS) {
    throw new InvalidActiveApplicationsCountError(
      `activeApplicationsCount must be between 0 and ${MAX_ACTIVE_APPLICATIONS}`,
    );
  }

  return value;
}
