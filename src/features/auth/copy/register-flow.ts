export const REGISTER_STEPS = [
  "02 Kontotyp",
  "03 Konto erstellen",
  "04 Bestätigung",
] as const;

export type RegisterStep = (typeof REGISTER_STEPS)[number];
