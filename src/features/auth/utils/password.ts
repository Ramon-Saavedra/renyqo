export type PasswordStrength = "schwach" | "mittel" | "stark";

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (password.length === 0) return null;
  if (password.length < 8) return "schwach";

  const types = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  if (types < 3) return "mittel";
  return "stark";
}

const CHARSET_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARSET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_NUMBERS = "0123456789";
const CHARSET_SYMBOLS = "!@#$%^&*-_=+?.";

export function generateSecurePassword(): string {
  const all = CHARSET_LOWER + CHARSET_UPPER + CHARSET_NUMBERS + CHARSET_SYMBOLS;

  const chars = [
    ...pick(CHARSET_LOWER, 3),
    ...pick(CHARSET_UPPER, 3),
    ...pick(CHARSET_NUMBERS, 3),
    ...pick(CHARSET_SYMBOLS, 3),
    ...pick(all, 4),
  ];

  return shuffle(chars).join("");
}

function pick(charset: string, count: number): string[] {
  return Array.from(
    { length: count },
    () => charset[randomInt(charset.length)]!,
  );
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

function randomInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0]! % max;
}
