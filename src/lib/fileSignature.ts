// Validates a file's actual bytes against known magic numbers for the image types this app
// accepts, so a renamed/relabeled non-image file can't slip past a client-supplied MIME type.

function matchesBytes(buffer: Buffer, offset: number, signature: number[]): boolean {
  if (buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

export function matchesImageSignature(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return matchesBytes(buffer, 0, [0xff, 0xd8, 0xff]);
    case "image/png":
      return matchesBytes(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return (
        matchesBytes(buffer, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || // GIF87a
        matchesBytes(buffer, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // GIF89a
      );
    case "image/webp":
      return (
        matchesBytes(buffer, 0, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
        matchesBytes(buffer, 8, [0x57, 0x45, 0x42, 0x50]) // "WEBP"
      );
    default:
      return false;
  }
}
