export const passwordRecoveryCopy = {
  forgot: {
    title: "Passwort zurücksetzen",
    subtitle:
      "Gib deine E-Mail-Adresse ein. Wenn ein Konto existiert, erhältst du weitere Anweisungen.",
    emailLabel: "E-Mail",
    emailPlaceholder: "name@beispiel.de",
    submit: "Link anfordern",
    resend: "Erneut senden",
    submitting: "Bitte warten…",
    success:
      "Wenn ein Konto mit dieser E-Mail-Adresse existiert, erhältst du in Kürze Anweisungen zum Zurücksetzen deines Passworts.",
    errors: {
      emailRequired: "Bitte gib deine E-Mail-Adresse ein.",
      emailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
      unavailable:
        "Der Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal.",
      timeout:
        "Die Anfrage dauert zu lange. Bitte überprüfe deine Verbindung und versuche es erneut.",
      server:
        "Der Server konnte die Anfrage nicht verarbeiten. Bitte versuche es später erneut.",
      unexpected:
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.",
    },
  },
  reset: {
    title: "Neues Passwort festlegen",
    subtitle: "Vergib ein neues Passwort für dein Renyqo-Konto.",
    passwordLabel: "Neues Passwort",
    passwordPlaceholder: "Mindestens 8 Zeichen",
    confirmationLabel: "Neues Passwort bestätigen",
    confirmationPlaceholder: "Neues Passwort wiederholen",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
    submit: "Passwort speichern",
    submitting: "Bitte warten…",
    errors: {
      missingToken:
        "Dieser Link zum Zurücksetzen des Passworts ist ungültig oder unvollständig.",
      passwordRequired: "Bitte gib ein neues Passwort ein.",
      passwordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      confirmationRequired: "Bitte bestätige dein neues Passwort.",
      passwordsDoNotMatch: "Die Passwörter stimmen nicht überein.",
      invalidToken:
        "Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet.",
      unavailable:
        "Der Server ist aktuell nicht erreichbar. Bitte versuche es später noch einmal.",
      timeout:
        "Die Anfrage dauert zu lange. Bitte überprüfe deine Verbindung und versuche es erneut.",
      server:
        "Das neue Passwort konnte nicht gespeichert werden. Bitte versuche es später erneut.",
      unexpected:
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.",
    },
  },
  backToLogin: "Zurück zur Anmeldung",
} as const;
