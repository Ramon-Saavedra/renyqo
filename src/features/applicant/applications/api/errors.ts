import { ApiError } from "@/lib/api/client";

export class ApplicantApplicationContractError extends Error {
  constructor() {
    super("Invalid applicant application response");
    this.name = "ApplicantApplicationContractError";
  }
}

export class ApplicantApplicationNotFoundError extends Error {
  constructor() {
    super("Applicant application not found");
    this.name = "ApplicantApplicationNotFoundError";
  }
}

export function isCancelledRequest(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "cancelled";
}

export function isNotFoundResponse(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isStateConflict(error: unknown): boolean {
  return (
    error instanceof ApiError && error.kind === "http" && error.status === 409
  );
}
