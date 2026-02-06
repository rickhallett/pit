/**
 * Topic Validation Tests
 * 
 * These test the validation logic used in TopicInputModal.
 * Run with: npx vitest run lib/__tests__/topic-validation.test.ts
 */

import { describe, it, expect } from 'vitest';

// Validation constants (mirrored from TopicInputModal)
const MAX_LENGTH_CODEPOINTS = 280;
const MAX_LENGTH_BYTES = 1024;

/**
 * Sanitize user input:
 * - Strip script/style tags WITH their contents (XSS prevention)
 * - Strip remaining HTML tags
 * - Strip leading/trailing whitespace
 * - Collapse consecutive whitespace to single space
 * - Remove control characters (ASCII 0-31)
 */
function sanitizeInput(input: string): string {
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
function validateTopic(input: string): { isValid: boolean; error?: string } {
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

describe('sanitizeInput', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('collapses consecutive whitespace to single space', () => {
    expect(sanitizeInput('hello    world')).toBe('hello world');
  });

  it('strips control characters', () => {
    expect(sanitizeInput('hello\x00world\x1F')).toBe('helloworld');
  });

  it('handles combined sanitization', () => {
    expect(sanitizeInput('  Padded  topic  ')).toBe('Padded topic');
  });

  it('preserves emoji', () => {
    expect(sanitizeInput('🔥 Hot take 🔥')).toBe('🔥 Hot take 🔥');
  });

  // XSS prevention tests (HAL spec)
  it('strips HTML script tags', () => {
    expect(sanitizeInput("<script>alert('xss')</script>test")).toBe('test');
  });

  it('strips nested HTML with script contents removed', () => {
    // Script content removed entirely, then remaining tags stripped
    expect(sanitizeInput('<div><script>bad</script></div>content')).toBe('content');
  });

  it('strips event handler attributes (tag removal)', () => {
    // The tag is removed; attribute content becomes harmless text if any remains
    expect(sanitizeInput('before<img src=x onerror=alert(1)>after')).toBe('beforeafter');
  });

  it('strips self-closing tags', () => {
    expect(sanitizeInput('hello<br/>world')).toBe('helloworld');
    expect(sanitizeInput('test<hr />end')).toBe('testend');
  });

  it('preserves angle brackets not part of tags', () => {
    // Mathematical expressions should be preserved
    expect(sanitizeInput('x > 5 and y < 10')).toBe('x > 5 and y < 10');
  });
});

describe('validateTopic', () => {
  it('rejects empty string', () => {
    const result = validateTopic('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a topic');
  });

  it('rejects whitespace-only string', () => {
    const result = validateTopic('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a topic');
  });

  it('accepts valid topic', () => {
    const result = validateTopic('Valid topic');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  // Boundary cases (HAL spec: 0, 1, 280, 281)
  it('accepts single character topic (boundary: 1 char)', () => {
    const result = validateTopic('A');
    expect(result.isValid).toBe(true);
  });

  it('accepts padded topic (after sanitization)', () => {
    const result = validateTopic('  Padded  topic  ');
    expect(result.isValid).toBe(true);
  });

  it('rejects topic over 280 characters', () => {
    const longTopic = 'A'.repeat(281);
    const result = validateTopic(longTopic);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('280 characters or less');
  });

  it('accepts topic at exactly 280 characters', () => {
    const maxTopic = 'A'.repeat(280);
    const result = validateTopic(maxTopic);
    expect(result.isValid).toBe(true);
  });

  it('handles control characters in input', () => {
    // Control chars get stripped, then validated
    const result = validateTopic('Has\x00control\x1Fchars');
    expect(result.isValid).toBe(true);
  });

  it('rejects string that becomes empty after stripping control chars', () => {
    const result = validateTopic('\x00\x1F');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a topic');
  });

  it('accepts emoji-heavy topics within limit', () => {
    const emojiTopic = '🔥'.repeat(50); // 50 emoji = 100 code units (JS .length)
    const result = validateTopic(emojiTopic);
    expect(result.isValid).toBe(true);
  });

  it('counts emoji as code units, not graphemes', () => {
    // "🔥🎯💀" = 3 graphemes but 6 code units (each emoji is a surrogate pair)
    // We explicitly use .length (code units), not grapheme count
    const threeEmoji = '🔥🎯💀';
    expect(threeEmoji.length).toBe(6); // Documenting JS behavior
    
    // 140 emoji = 280 code units = at limit
    const maxEmoji = '🔥'.repeat(140);
    expect(maxEmoji.length).toBe(280);
    expect(validateTopic(maxEmoji).isValid).toBe(true);
    
    // 141 emoji = 282 code units = over limit
    const overEmoji = '🔥'.repeat(141);
    expect(overEmoji.length).toBe(282);
    expect(validateTopic(overEmoji).isValid).toBe(false);
  });

  it('byte limit is unreachable with current codepoint limit', () => {
    // NOTE: The byte limit (1024) cannot be exceeded while staying under
    // the codepoint limit (280 code units) because:
    // - Max bytes per code unit is 3 (BMP chars) or 2 (emoji = 4 bytes / 2 units)
    // - 280 code units × 3 bytes max = 840 bytes < 1024
    //
    // The byte limit is a backstop for future changes to the codepoint limit.
    // This test documents that it's currently unreachable.
    const maxEmoji = '🔥'.repeat(140); // 280 code units, 560 bytes
    expect(maxEmoji.length).toBe(280); // At code unit limit
    expect(new TextEncoder().encode(maxEmoji).length).toBe(560); // Under byte limit
    expect(validateTopic(maxEmoji).isValid).toBe(true);
  });
});
