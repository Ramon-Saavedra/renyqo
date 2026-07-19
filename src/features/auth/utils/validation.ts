export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export function validateLoginFields(
  email: string,
  password: string,
  messages: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
  },
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!email) {
    errors.email = messages.emailRequired;
  } else if (!isValidEmail(email)) {
    errors.email = messages.emailInvalid;
  }
  if (!password) errors.password = messages.passwordRequired;
  return errors;
}
