/**
 * Topic Input Validation
 * 
 * Shared validation logic for user-provided debate topics.
 * Used by TopicInputModal and tests.
 */

// Validation constants
export const MAX_LENGTH_CODEPOINTS = 280;
export const MAX_LENGTH_BYTES = 1024;

/**
 * Sanitize user input:
 * - Strip script/style tags WITH their contents (XSS prevention)
 * - Strip remaining HTML tags
 * - Strip leading/trailing whitespace
 * - Collapse consecutive whitespace to single space
 * - Remove control characters (ASCII 0-31)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip script tags + contents
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Strip style tags + contents
    .replace(/<[^>]*>/g, "") // Strip remaining HTML tags
    .trim()
    .replace(/[\x00-\x1F]/g, "") // Strip control chars
    .replace(/\s+/g, " "); // Collapse whitespace
}

/**
 * Validate topic input
 */
export function validateTopic(input: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeInput(input);

  // Empty check (after sanitization)
  if (sanitized.length === 0) {
    return { isValid: false, error: "Please enter a topic" };
  }

  // Length check (codepoints)
  if (sanitized.length > MAX_LENGTH_CODEPOINTS) {
    return {
      isValid: false,
      error: `Topic must be ${MAX_LENGTH_CODEPOINTS} characters or less`,
    };
  }

  // Byte length backstop (for storage safety)
  const byteLength = new TextEncoder().encode(sanitized).length;
  if (byteLength > MAX_LENGTH_BYTES) {
    return {
      isValid: false,
      error: "Topic is too long (try using fewer emoji or special characters)",
    };
  }

  return { isValid: true };
}
