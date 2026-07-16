import type {
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";

export const OBJECT_TYPE_OPTIONS: ReadonlyArray<{
  value: ObjectTypeBackend;
  label: string;
}> = [
  { value: "APARTMENT", label: "Wohnung" },
  { value: "HOUSE", label: "Haus" },
  { value: "ROOM", label: "Zimmer" },
];

export const PET_POLICY_OPTIONS: ReadonlyArray<{
  value: PetPolicyBackend;
  label: string;
}> = [
  { value: "ALLOWED", label: "Erlaubt" },
  { value: "BY_ARRANGEMENT", label: "Nach Absprache" },
  { value: "PREFER_NOT", label: "Nicht erwünscht" },
];

export const SMOKING_POLICY_OPTIONS: ReadonlyArray<{
  value: SmokingPolicyBackend;
  label: string;
}> = [
  { value: "ALLOWED", label: "Erlaubt" },
  { value: "BY_ARRANGEMENT", label: "Nach Absprache" },
  { value: "NON_SMOKERS_PREFERRED", label: "Nichtraucher bevorzugt" },
];

export const listingEditCopy = {
  edit: "Bearbeiten",
  editShort: "Ändern",
  save: "Speichern",
  saving: "Wird gespeichert …",
  saved: "Gespeichert",
  savedNotice: "Deine Änderungen wurden gespeichert.",
  cancel: "Abbrechen",
  unsavedNotice: "Du hast ungespeicherte Änderungen.",
  emptyOption: "Keine Angabe",
  fields: {
    objectType: "Objekttyp",
    title: "Objekttitel",
    titlePlaceholder: "z. B. Helle Altbauwohnung mit Balkon",
    street: "Straße",
    zip: "PLZ",
    city: "Stadt",
    showExactAddress: "Genaue Adresse öffentlich anzeigen",
    showExactAddressHint:
      "Ist dies deaktiviert, sehen Bewerbende zunächst nur Stadt und ungefähre Lage.",
    coldRent: "Kaltmiete",
    additionalCosts: "Nebenkosten",
    deposit: "Kaution",
    depositMonths: "Kaution in Monatsmieten",
    livingArea: "Wohnfläche",
    rooms: "Zimmer",
    bedrooms: "Schlafzimmer",
    availableFrom: "Frei ab",
    description: "Beschreibung",
    descriptionPlaceholder:
      "Was macht dein Objekt besonders? Beschreibe in 2–3 Sätzen, was Bewerbende wissen sollten.",
    minimumIncome: "Mindesteinkommen netto",
    schufaRequired: "SCHUFA-Auskunft erforderlich",
    incomeProofRequired: "Einkommensnachweis erforderlich",
    peopleCount: "Passend für insgesamt",
    pets: "Haustiere",
    smoking: "Rauchen",
  },
  suffix: {
    perMonth: "€ / Monat",
    euro: "€",
    area: "m²",
  },
  validation: {
    title: "Bitte gib einen Titel an",
    amount: "Bitte gib einen gültigen Betrag an",
    area: "Bitte gib eine gültige Wohnfläche an",
    rooms: "Bitte gib eine gültige Zimmeranzahl an",
  },
  error: {
    save: "Die Änderungen konnten nicht gespeichert werden — bitte versuche es erneut.",
    network: "Netzwerkfehler — bitte versuche es erneut.",
    validation: "Bitte prüfe deine Eingaben.",
  },
  discardModal: {
    title: "Änderungen verwerfen?",
    text: "Du hast ungespeicherte Änderungen. Wenn du die Bearbeitung verlässt, gehen diese Änderungen verloren.",
    primary: "Weiter bearbeiten",
    secondary: "Änderungen verwerfen",
  },
} as const;
