/**
 * Browser-compatible hex preview. Converts a UTF-8 string to space-separated
 * uppercase hex pairs. e.g. "Hi" → "48 69"
 */
export function toHexPreview(text: string): string {
  if (!text) return '';
  return Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}
