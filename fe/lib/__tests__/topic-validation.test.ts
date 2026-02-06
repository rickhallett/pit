/**
 * Topic Validation Tests
 * 
 * These test the validation logic used in TopicInputModal.
 * Run with: npx vitest run lib/__tests__/topic-validation.test.ts
 */

import { describe, it, expect } from 'vitest';
import { 
  sanitizeInput, 
  validateTopic, 
  MAX_LENGTH_CODEPOINTS, 
  MAX_LENGTH_BYTES 
} from '../topic-validation';

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

  it('strips script tags with content (XSS prevention)', () => {
    expect(sanitizeInput('Hello<script>alert("xss")</script>World')).toBe('HelloWorld');
  });

  it('strips style tags with content', () => {
    expect(sanitizeInput('Hello<style>body{color:red}</style>World')).toBe('HelloWorld');
  });

  it('strips other HTML tags', () => {
    expect(sanitizeInput('<p>Hello</p> <b>World</b>')).toBe('Hello World');
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

describe('constants', () => {
  it('exports expected limits', () => {
    expect(MAX_LENGTH_CODEPOINTS).toBe(280);
    expect(MAX_LENGTH_BYTES).toBe(1024);
  });
});
