import { describe, it, expect } from "vitest";
import { isValidEmail, isStrongPassword } from "./validation";

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("trader@example.com")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("test@")).toBe(false);
    expect(isValidEmail("@test.com")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("accepts a password with 10+ chars, a letter, and a number", () => {
    expect(isStrongPassword("password123")).toBe(true);
  });

  it("rejects passwords shorter than 10 characters", () => {
    expect(isStrongPassword("short1a")).toBe(false);
  });

  it("rejects passwords with no digit", () => {
    expect(isStrongPassword("onlylettersnodigits")).toBe(false);
  });

  it("rejects passwords with no letter", () => {
    expect(isStrongPassword("1234567890")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isStrongPassword(undefined)).toBe(false);
  });
});
