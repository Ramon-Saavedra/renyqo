export const loginCopy = {
  title: "Willkommen zurück",
  subtitle: "Melde dich mit deiner E-Mail und deinem Passwort an.",
  divider: "oder mit E-Mail",
  google: "Weiter mit Google",
  apple: "Weiter mit Apple",
  fields: {
    email: {
      label: "E-Mail",
      placeholder: "name@beispiel.de",
    },
    password: {
      label: "Passwort",
      placeholder: "Dein Passwort",
      show: "Passwort anzeigen",
      hide: "Passwort verbergen",
    },
  },
  forgotPassword: "Passwort vergessen?",
  submit: "Anmelden",
  submitting: "Bitte warten…",
  noAccount: "Noch kein Konto?",
  register: "Registrieren",
  resetSuccess:
    "Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt anmelden.",
  errors: {
    emailRequired: "Bitte gib deine E-Mail-Adresse ein.",
    emailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    passwordRequired: "Bitte gib dein Passwort ein.",
    invalidCredentials: "E-Mail oder Passwort ist nicht korrekt.",
    unavailable:
      "Der Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal.",
    timeout:
      "Die Anfrage dauert zu lange. Bitte überprüfe deine Verbindung und versuche es erneut.",
    server:
      "Der Server konnte die Anmeldung nicht verarbeiten. Bitte versuche es später erneut.",
    unexpected:
      "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.",
    onboarding:
      "Die Anmeldung war erfolgreich, aber dein nächster Schritt konnte nicht geladen werden.",
  },
} as const;
