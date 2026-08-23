import type {
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import type { ListingStatus } from "../types";

export const PET_POLICY_LABEL: Record<PetPolicyBackend, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Auf Anfrage",
  NOT_ALLOWED: "Nicht erlaubt",
};

export const SMOKING_POLICY_LABEL: Record<SmokingPolicyBackend, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Auf Anfrage",
  NON_SMOKERS_PREFERRED: "Nicht erlaubt",
};

const VISIBILITY_NOTE: Record<Exclude<ListingStatus, "published">, string> = {
  paused:
    "Dieses Objekt ist pausiert. Bewerbende sehen es aktuell nicht in der Suche.",
  draft: "Als Entwurf ist dieses Objekt für niemanden außer dir sichtbar.",
  archived: "Archivierte Objekte sind für Bewerbende nicht sichtbar.",
};

export function getVisibilityNote(
  status: ListingStatus,
  showExactAddress: boolean | null,
): string {
  if (status !== "published") return VISIBILITY_NOTE[status];
  if (showExactAddress === true) {
    return "Die genaue Adresse ist öffentlich sichtbar. Bewerbende sehen sie in der Suche und in der Objektansicht. Du kannst die Sichtbarkeit jederzeit unter „Bearbeiten“ ändern.";
  }
  if (showExactAddress === false) {
    return "Die genaue Adresse ist nur für dich sichtbar. Bewerbende sehen zunächst nur Stadt und ungefähre Lage. Du kannst die vollständige Adresse jederzeit unter „Bearbeiten“ freigeben.";
  }
  return "Die Sichtbarkeit der genauen Adresse konnte nicht ermittelt werden. Bitte prüfe die Einstellung unter „Bearbeiten“.";
}

export const listingDetailCopy = {
  backLabel: "Zurück zu Meine Objekte",
  backHref: "/provider/listings",
  loading: "Objekt wird geladen …",
  actions: {
    publish: "Veröffentlichen",
    publishing: "Wird veröffentlicht …",
    draft: "Als Entwurf setzen",
    drafting: "Wird gespeichert …",
    archive: "Archivieren",
    archiving: "Wird archiviert …",
    publishShort: "Online",
    draftShort: "Entwurf",
    archiveShort: "Archiv",
  },
  gallery: {
    counter: (current: number, total: number) => `${current} / ${total}`,
    emptyLead:
      "Noch keine Fotos hinzugefügt. Bewerbende sehen ein Objekt mit Fotos deutlich häufiger.",
  },
  facts: {
    title: "Kerndaten",
    coldRent: "Kaltmiete",
    additionalCosts: "Nebenkosten",
    deposit: "Kaution",
    depositMonths: "Kaution in Monatsmieten",
    livingArea: "Wohnfläche",
    rooms: "Zimmer",
    bedrooms: "Schlafzimmer",
    availableFrom: "Frei ab",
  },
  description: {
    title: "Beschreibung",
  },
  requirements: {
    title: "Anforderungen an Bewerbende",
    schufa: "SCHUFA-Auskunft",
    incomeProof: "Einkommensnachweis",
    minimumIncome: "Mindesteinkommen netto",
    peopleCount: "Passend für insgesamt",
    pets: "Haustiere",
    smoking: "Rauchen",
    empty: "-",
    required: "Erforderlich",
    notRequired: "Nicht erforderlich",
    peopleCountValue: (count: number) =>
      `Max. ${count} ${count === 1 ? "Person" : "Personen"}`,
  },
  address: {
    title: "Adresse & Sichtbarkeit",
    unknown: "Adresse offen",
  },
  error: {
    title: "Dieses Mietobjekt konnte nicht geladen werden.",
    lead: "Möglicherweise besteht ein vorübergehendes Verbindungsproblem, oder das Objekt ist nicht mehr verfügbar.",
    retry: "Erneut versuchen",
    action: "Aktion konnte nicht ausgeführt werden — bitte versuche es erneut.",
    network: "Netzwerkfehler — bitte versuche es erneut.",
  },
} as const;
