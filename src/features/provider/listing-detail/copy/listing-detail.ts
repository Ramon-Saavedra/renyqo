import type {
  ObjectTypeBackend,
  PetPolicyBackend,
  SmokingPolicyBackend,
} from "@/lib/api/listings";
import type { ListingStatus } from "../types";

export const OBJECT_TYPE_LABEL: Record<ObjectTypeBackend, string> = {
  APARTMENT: "Wohnung",
  HOUSE: "Haus",
  ROOM: "Zimmer",
};

export const PET_POLICY_LABEL: Record<PetPolicyBackend, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Nach Absprache",
  PREFER_NOT: "Nicht erwünscht",
};

export const SMOKING_POLICY_LABEL: Record<SmokingPolicyBackend, string> = {
  ALLOWED: "Erlaubt",
  BY_ARRANGEMENT: "Nach Absprache",
  PREFER_NOT: "Nicht erlaubt",
};

export const VISIBILITY_NOTE: Record<ListingStatus, string> = {
  published:
    "Die genaue Adresse ist nur für dich sichtbar. Bewerbende sehen zunächst nur Stadtteil und Postleitzahl — die vollständige Adresse wird erst nach Zusage freigegeben.",
  paused:
    "Dieses Objekt ist pausiert. Bewerbende sehen es aktuell nicht in der Suche.",
  draft: "Als Entwurf ist dieses Objekt für niemanden außer dir sichtbar.",
  archived: "Archivierte Objekte sind für Bewerbende nicht sichtbar.",
};

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
    schufa: "SCHUFA",
    incomeProof: "Einkommensnachweis",
    minimumIncome: "Mindesteinkommen (Haushalt)",
    peopleCount: "Personenanzahl",
    pets: "Haustiere",
    smoking: "Rauchen",
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
