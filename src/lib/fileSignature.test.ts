import { describe, it, expect } from "vitest";
import { matchesImageSignature } from "./fileSignature";

describe("matchesImageSignature", () => {
  it("accepts a valid JPEG signature", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00]);
    expect(matchesImageSignature(buffer, "image/jpeg")).toBe(true);
  });

  it("accepts a valid PNG signature", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(matchesImageSignature(buffer, "image/png")).toBe(true);
  });

  it("accepts valid GIF87a and GIF89a signatures", () => {
    const gif87 = Buffer.from("GIF87a", "ascii");
    const gif89 = Buffer.from("GIF89a", "ascii");
    expect(matchesImageSignature(gif87, "image/gif")).toBe(true);
    expect(matchesImageSignature(gif89, "image/gif")).toBe(true);
  });

  it("accepts a valid WEBP signature (RIFF....WEBP)", () => {
    const buffer = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // file size placeholder
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(matchesImageSignature(buffer, "image/webp")).toBe(true);
  });

  it("rejects a file whose bytes don't match the claimed MIME type", () => {
    // A plain text/script payload masquerading as a PNG via its declared MIME type.
    const buffer = Buffer.from("<script>alert(1)</script>", "ascii");
    expect(matchesImageSignature(buffer, "image/png")).toBe(false);
  });

  it("rejects an unknown MIME type outright", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff]);
    expect(matchesImageSignature(buffer, "application/pdf")).toBe(false);
  });

  it("rejects a buffer shorter than the expected signature", () => {
    const buffer = Buffer.from([0x89, 0x50]);
    expect(matchesImageSignature(buffer, "image/png")).toBe(false);
  });
});
