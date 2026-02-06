"use client";

import { useState, useEffect, useCallback } from "react";
import { getBoutShare } from "@/lib/api";

interface ShareModalProps {
  boutId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ boutId, isOpen, onClose }: ShareModalProps) {
  const [shareText, setShareText] = useState<string>("");
  const [permalink, setPermalink] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch share text when modal opens
  useEffect(() => {
    if (!isOpen) return;

    async function fetchShare() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBoutShare(boutId);
        setShareText(data.text);
        setPermalink(data.permalink);
      } catch (err) {
        setError("Failed to generate share text");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchShare();
  }, [boutId, isOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [shareText]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-none border-4 border-white bg-black p-6 shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Share the Carnage
          </h2>
          <button
            onClick={onClose}
            className="text-3xl font-bold text-zinc-500 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center">
            <p className="animate-pulse text-zinc-400">Generating share text...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Share Text Preview */}
            <div className="mb-6 whitespace-pre-wrap rounded-none border-2 border-zinc-700 bg-zinc-900 p-4 font-mono text-sm text-zinc-300">
              {shareText}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCopy}
                className={`flex-1 border-4 px-6 py-3 text-lg font-black uppercase tracking-tight transition-colors ${
                  copied
                    ? "border-green-500 bg-green-500 text-black"
                    : "border-white bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border-4 border-zinc-700 bg-zinc-800 px-6 py-3 text-center text-lg font-black uppercase tracking-tight text-white transition-colors hover:border-zinc-500 hover:bg-zinc-700"
              >
                Share on X
              </a>
            </div>

            {/* Permalink */}
            <p className="mt-4 text-center text-sm text-zinc-500">
              Permalink:{" "}
              <a
                href={permalink}
                className="text-purple-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {permalink}
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
