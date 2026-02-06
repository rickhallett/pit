"use client";

import { useState, FormEvent } from "react";

interface WaitlistFormProps {
  source?: string;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function WaitlistForm({ source = "landing", className = "" }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("You're in! We'll notify you when we launch.");
        setEmail("");
      } else if (response.status === 409) {
        setStatus("success");
        setMessage("You're already on the list! We'll be in touch.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again?");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Network error. Please try again.");
      console.error("Waitlist signup error:", err);
    }
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="your@email.com"
          disabled={status === "loading" || status === "success"}
          className="flex-1 border-4 border-white bg-black px-4 py-3 text-lg font-bold text-white placeholder-zinc-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={`border-4 px-6 py-3 text-lg font-black uppercase tracking-tight transition-colors ${
            status === "success"
              ? "border-green-500 bg-green-500 text-black"
              : status === "loading"
              ? "border-zinc-500 bg-zinc-500 text-black"
              : "border-white bg-white text-black hover:bg-zinc-200"
          } disabled:cursor-not-allowed`}
        >
          {status === "loading"
            ? "..."
            : status === "success"
            ? "✓"
            : "Notify Me"}
        </button>
      </form>

      {/* Status message */}
      {message && (
        <p
          className={`mt-3 text-sm font-bold ${
            status === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default WaitlistForm;
