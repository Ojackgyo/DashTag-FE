/**
 * Normalizes user-authored plain text before sending it to the API.
 * React escapes rendered strings; this additionally removes control and bidi
 * override characters that can be abused in logs, moderation tools and alerts.
 * The server must still validate, encode and sanitize every field independently.
 */
export function sanitizePlainText(value: string, maxLength: number): string {
  const withoutControls = Array.from(value, char => {
    const code = char.charCodeAt(0);
    const forbiddenControl = (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
    const bidiOverride = (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
    return forbiddenControl || bidiOverride ? '' : char;
  }).join('');

  return withoutControls
    .normalize('NFKC')
    .slice(0, maxLength)
    .trim();
}
