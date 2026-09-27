export class InvalidDisplayOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDisplayOrderError";
  }
}

export function parseDisplayOrder(value: unknown): number {
  if (value === undefined) {
    throw new InvalidDisplayOrderError("displayOrder is required");
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new InvalidDisplayOrderError(
      "displayOrder must be a positive integer",
    );
  }

  return value;
}
