const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

export function isStrongPassword(password: unknown): password is string {
  return typeof password === "string" && PASSWORD_REGEX.test(password);
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 10 characters and include at least one letter and one number";
