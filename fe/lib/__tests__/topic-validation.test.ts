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
 * - Strip leading/trailing whitespace
 * - Collapse consecutive whitespace to single space
 * - Remove control characters (ASCII 0-31)
 */
function sanitizeInput(input: string): string {
  return input
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
    const emojiTopic = '🔥'.repeat(50); // 50 emoji = 50 codepoints but 200 bytes
    const result = validateTopic(emojiTopic);
    expect(result.isValid).toBe(true);
  });

  it('rejects topics exceeding byte limit', () => {
    // Create a string that's under 280 codepoints but over 1024 bytes
    // Each emoji is 4 bytes, so 280 emoji = 1120 bytes > 1024
    const emojiTopic = '🔥'.repeat(280);
    const result = validateTopic(emojiTopic);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('fewer emoji');
  });
});
