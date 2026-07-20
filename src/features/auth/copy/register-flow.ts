export const REGISTER_STEPS = [
  "01 Kontotyp",
  "02 Konto erstellen",
] as const;

export type RegisterStep = (typeof REGISTER_STEPS)[number];
