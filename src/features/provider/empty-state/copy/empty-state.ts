import { Check, Clock, Eye, List, type LucideIcon } from "lucide-react";

export type StepPreview =
  | { readonly kind: "property-chips"; readonly labels: readonly string[] }
  | { readonly kind: "criteria-fields" }
  | { readonly kind: "result-bars" };

export interface FlowStepCopy {
  readonly index: number;
  readonly title: string;
  readonly preview: StepPreview;
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
  hero: {
    welcome: {
      fallback: "Willkommen bei Renyqo.",
      private: (firstName: string) => `Willkommen bei Renyqo, ${firstName}.`,
      company: (firstName: string, companyName: string) =>
        `Willkommen bei Renyqo, ${firstName} und das Team von ${companyName}.`,
    },
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
      {
        index: 1,
        title: "Mietobjekt anlegen",
        preview: {
          kind: "property-chips",
          labels: ["Adresse", "Größe", "Miete"],
        },
      },
      {
        index: 2,
        title: "Anforderungen festlegen",
        preview: { kind: "criteria-fields" },
      },
      {
        index: 3,
        title: "Passende Bewerbungen erhalten",
        preview: { kind: "result-bars" },
      },
    ] as const satisfies readonly FlowStepCopy[],
  },
  benefits: {
    title: "Warum sich der erste Schritt lohnt.",
    description:
      "Renyqo strukturiert den Prozess von Anfang an — statt endloser E-Mails.",
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
