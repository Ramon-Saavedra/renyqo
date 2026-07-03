import type { Role } from "./account-type";

export const createAccountCopy = {
  back: "Zurück",
  divider: "oder mit E-Mail",
  google: "Weiter mit Google",
  apple: "Weiter mit Apple",
  fields: {
    name: {
      label: "Name",
      placeholder: "Vor- und Nachname",
    },
    email: {
      label: "E-Mail",
      placeholder: "name@beispiel.de",
    },
    password: {
      label: "Passwort",
      placeholder: "Mindestens 8 Zeichen",
      hint: "Mindestens 8 Zeichen, mit einer Zahl oder einem Sonderzeichen.",
      show: "Passwort anzeigen",
      hide: "Passwort verbergen",
    },
  },
  consent: {
    prefix: "Ich akzeptiere die ",
    terms: "Nutzungsbedingungen",
    middle: " und die ",
    privacy: "Datenschutzerklärung",
    suffix: ".",
  },
  submit: "Konto erstellen",
  submitting: "Bitte warten…",
  success: "Konto erfolgreich erstellt. Du wirst weitergeleitet…",
  alreadyAccount: "Bereits ein Konto?",
  signIn: "Anmelden",
  validation: {
    name: "Bitte gib deinen Namen ein.",
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    emailTaken: "Diese E-Mail wird bereits verwendet.",
    password: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    terms: "Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.",
  },
  passwordStrength: {
    schwach: "Schwach",
    mittel: "Mittel",
    stark: "Stark",
    suggest: "Sicheres Passwort vorschlagen",
  },
  globalErrors: {
    unavailable:
      "Der Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal.",
    unknown:
      "Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.",
  },
} as const;

interface ReassureItem {
  title: string;
  description: string;
}

interface RoleCopy {
  tag: string;
  title: string;
  subtitle: string;
  reassure: readonly [ReassureItem, ReassureItem];
}

export const createAccountRoleCopy: Record<Role, RoleCopy> = {
  applicant: {
    tag: "Suchende",
    title: "Konto erstellen",
    subtitle:
      "Starte mit einem einfachen Konto. Dein Mietprofil kannst du später Schritt für Schritt ergänzen.",
    reassure: [
      {
        title: "Kein Druck, keine Pflichtangaben",
        description: "Name, E-Mail, Passwort — mehr brauchst du jetzt nicht.",
      },
      {
        title: "Daten bleiben bei dir",
        description: "Nachweise teilst du nur, wenn du dich aktiv bewirbst.",
      },
    ],
  },
  provider: {
    tag: "Anbieter",
    title: "Anbieter-Konto erstellen",
    subtitle:
      "Lege dein Konto an. Ob Eigentümer oder Makler, kannst du danach festlegen.",
    reassure: [
      {
        title: "Erst das Konto, dann die Details",
        description:
          "Objekte und Anbietertyp legst du später im Anbieter-Bereich fest.",
      },
      {
        title: "DSGVO-konform & sicher",
        description:
          "Wir verschlüsseln Daten und teilen sie nicht ohne deine Zustimmung.",
      },
    ],
  },
};
