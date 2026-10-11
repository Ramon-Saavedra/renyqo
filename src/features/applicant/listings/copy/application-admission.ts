import type { ApplicationSubmissionBlockReason } from "../api/application-admission";

export const applicationAdmissionCopy = {
  applied: "Bereits beworben",
  apply: "Bewerben",
  withdraw: "Bewerbung zurückziehen",
  sending: "Bewerbung wird gesendet …",
  withdrawing: "Bewerbung wird zurückgezogen …",
  sent: "Bewerbung erfolgreich gesendet.",
  waiting: "Deine Bewerbung steht auf der Warteliste.",
  withdrawn: "Deine Bewerbung wurde zurückgezogen.",
  eligibilityFailed: "Die Voraussetzungen konnten nicht gepr\u00fcft werden.",
  withdrawalFailed: "Die Bewerbung konnte nicht zur\u00fcckgezogen werden.",
  notFound: "Dieses Objekt ist nicht mehr verf\u00fcgbar.",
  forbidden: "Du kannst dich derzeit nicht auf dieses Objekt bewerben.",
  rateLimited: "Bitte warte kurz, bevor du es erneut versuchst.",
  failed: "Die Bewerbung konnte nicht gesendet werden.",
  duplicate: "Du hast dich bereits auf dieses Objekt beworben.",
  notSelected: "Nicht ausgewählt",
  accepted: "Bewerbung angenommen",
  rented: "Objekt vermietet",
  unavailable: "Bewerbung derzeit nicht möglich",
} as const;

export const applicationBlockCopy: Record<
  ApplicationSubmissionBlockReason,
  string
> = {
  AUTHENTICATION_REQUIRED: "Bitte melde dich an, um dich zu bewerben.",
  LISTING_NOT_ACCEPTING_APPLICATIONS:
    "Dieses Objekt nimmt derzeit keine Bewerbungen an.",
  CURRENT_APPLICATION_EXISTS: applicationAdmissionCopy.duplicate,
  APPLICATION_ACCEPTED: "Der Anbieter hat deine Bewerbung angenommen.",
  APPLICATION_REAPPLICATION_COOLDOWN:
    "Du wurdest für dieses Mietobjekt leider nicht ausgewählt.",
  APPLICATION_HISTORY_REQUIRES_REVIEW:
    "Eine erneute Bewerbung ist derzeit nicht möglich.",
  LISTING_RENTED: "Dieses Objekt wurde bereits vermietet.",
  APPLICANT_NOT_ELIGIBLE:
    "Dein Profil erfüllt die Voraussetzungen derzeit nicht.",
};
