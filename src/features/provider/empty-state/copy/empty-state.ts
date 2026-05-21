import { Check, Clock, Eye, List, type LucideIcon } from "lucide-react";

export interface FlowStepCopy {
  readonly index: number;
  readonly title: string;
}

export interface BenefitCopy {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

export const providerEmptyStateCopy = {
  topbar: {
    help: "Hilfe",
  },
  user: {
    initials: "SK",
    name: "Sabine Kessler",
  },
  hero: {
    welcome: "Willkommen bei renyqo, Sabine",
    title: "Weniger sortieren. Klarer vermieten.",
    lead: "Lege dein Mietobjekt einmal sauber an und definiere direkt, welche Anforderungen wirklich wichtig sind. So erhältst du später weniger unpassende Anfragen und mehr Bewerbungen, die fachlich und finanziell zu deiner Immobilie passen.",
    cta: {
      label: "Erstes Mietobjekt anlegen",
      href: "/provider/listings/new",
    },
    trust: "Du kannst dein Mietobjekt jederzeit als Entwurf speichern.",
  },
  flow: {
    kicker: "In wenigen Schritten",
    steps: [
      { index: 1, title: "Mietobjekt anlegen" },
      { index: 2, title: "Anforderungen festlegen" },
      { index: 3, title: "Passende Bewerbungen erhalten" },
    ] as const satisfies readonly FlowStepCopy[],
    currentIndex: 0,
  },
  benefits: {
    title: "Warum sich der erste Schritt lohnt.",
    description:
      "renyqo strukturiert den Prozess von Anfang an — statt endloser E-Mails.",
    items: [
      {
        icon: List,
        title: "Weniger E-Mails, die nicht weiterführen",
        description:
          "Anfragen, die deinen Kriterien nicht entsprechen, erreichen dich erst gar nicht.",
      },
      {
        icon: Check,
        title: "Klare Anforderungen von Anfang an",
        description:
          "Du legst einmal fest, was wichtig ist — Suchende sehen es transparent vor der Bewerbung.",
      },
      {
        icon: Eye,
        title: "Bewerbungen besser einschätzen",
        description:
          "Angaben zu Einkommen und Nachweisen werden strukturiert angezeigt — du siehst schneller, was passt.",
      },
      {
        icon: Clock,
        title: "Zeit sparen vor der Besichtigung",
        description:
          "Weniger Sortieraufwand, mehr Klarheit — bevor jemand vor deiner Tür steht.",
      },
    ] as const satisfies readonly BenefitCopy[],
  },
} as const;
