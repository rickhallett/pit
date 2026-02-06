"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TopicInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: string) => void;
  presetName: string;
  inputHint?: string;
  inputExamples?: string[];
  isSubmitting?: boolean;
}

// Validation constants
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

export function TopicInputModal({
  isOpen,
  onClose,
  onSubmit,
  presetName,
  inputHint = "What should they debate?",
  inputExamples = [],
  isSubmitting = false,
}: TopicInputModalProps) {
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTopic("");
      setError(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    const sanitized = sanitizeInput(topic);
    const validation = validateTopic(sanitized);

    if (!validation.isValid) {
      setError(validation.error ?? "Invalid input");
      return;
    }

    setError(null);
    onSubmit(sanitized);
  }, [topic, onSubmit]);

  // Submit on Ctrl/Cmd + Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isSubmitting]
  );

  const handleExampleClick = useCallback((example: string) => {
    setTopic(example);
    setError(null);
  }, []);

  const charCount = topic.length;
  const isOverLimit = charCount > MAX_LENGTH_CODEPOINTS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-none border-4 border-white bg-black p-6 shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              {presetName}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{inputHint}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-3xl font-bold text-zinc-500 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <textarea
            ref={inputRef}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your topic..."
            disabled={isSubmitting}
            rows={3}
            className={`w-full resize-none rounded-none border-2 bg-zinc-900 p-4 font-mono text-white placeholder-zinc-600 focus:outline-none ${
              error
                ? "border-red-500"
                : isOverLimit
                  ? "border-yellow-500"
                  : "border-zinc-700 focus:border-white"
            } disabled:opacity-50`}
          />
          <div className="mt-2 flex items-center justify-between">
            <div>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
            <p
              className={`text-sm ${
                isOverLimit
                  ? "text-red-400"
                  : charCount > MAX_LENGTH_CODEPOINTS * 0.9
                    ? "text-yellow-400"
                    : "text-zinc-500"
              }`}
            >
              {charCount}/{MAX_LENGTH_CODEPOINTS}
            </p>
          </div>
        </div>

        {/* Examples */}
        {inputExamples.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Examples
            </p>
            <div className="flex flex-wrap gap-2">
              {inputExamples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  disabled={isSubmitting}
                  className="border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-4 border-zinc-700 bg-zinc-800 px-6 py-3 text-lg font-black uppercase tracking-tight text-white transition-colors hover:border-zinc-500 hover:bg-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isOverLimit}
            className="flex-1 border-4 border-white bg-white px-6 py-3 text-lg font-black uppercase tracking-tight text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {isSubmitting ? "Starting..." : "⚡ Start Battle"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Press Ctrl+Enter to submit
        </p>
      </div>
    </div>
  );
}
