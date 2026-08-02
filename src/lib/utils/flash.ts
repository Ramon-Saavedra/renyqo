const FLASH_KEY = "renyqo.flash";

export function setFlash(message: string): void {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {}
}

export function consumeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(FLASH_KEY);
    if (message !== null) sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}
