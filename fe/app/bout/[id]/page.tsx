"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Layout } from "@/components";

// Types from API
interface BoutMessage {
  id: string;
  agent_name: string;
  agent_role?: string;
  content: string;
  turn_number: number;
  timestamp: string;
}

interface BoutDetail {
  id: string;
  status: string;
  preset_id: string;
  topic?: string;
  messages: BoutMessage[];
  total_turns: number;
  created_at: string;
  completed_at?: string;
}

// API helpers
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getBout(boutId: string): Promise<BoutDetail> {
  const res = await fetch(`${API_BASE}/api/bout/${boutId}`);
  if (!res.ok) throw new Error("Failed to fetch bout");
  return res.json();
}

function connectBoutStream(boutId: string): EventSource {
  return new EventSource(`${API_BASE}/api/bout/${boutId}/stream`);
}

type BoutStatus = "pending" | "running" | "complete" | "error" | "timeout";

interface BoutState {
  status: BoutStatus;
  messages: BoutMessage[];
  currentAgent: string | null;
  currentTurn: number;
  error: string | null;
  totalCost: number | null;
}

export default function BoutPage() {
  const params = useParams();
  const boutId = params.id as string;

  const [bout, setBout] = useState<BoutDetail | null>(null);
  const [state, setState] = useState<BoutState>({
    status: "pending",
    messages: [],
    currentAgent: null,
    currentTurn: 0,
    error: null,
    totalCost: null,
  });
  const [loading, setLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // Fetch initial bout state
  useEffect(() => {
    async function loadBout() {
      try {
        setLoading(true);
        const data = await getBout(boutId);
        setBout(data);
        setState((prev) => ({
          ...prev,
          status: data.status as BoutStatus,
          messages: data.messages || [],
        }));

        // If bout is pending, connect to stream
        if (data.status === "pending") {
          connectToStream();
        }
      } catch (err: unknown) {
        console.error("Failed to load bout:", err);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to load bout",
        }));
      } finally {
        setLoading(false);
      }
    }

    loadBout();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [boutId]);

  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = connectBoutStream(boutId);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("turn_start", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: "running",
        currentAgent: data.agent_name,
        currentTurn: data.turn_number,
      }));
    });

    eventSource.addEventListener("turn_end", (_e: MessageEvent) => {
      // Fetch updated messages
      getBout(boutId).then((boutData: BoutDetail) => {
        setState((prev) => ({
          ...prev,
          messages: boutData.messages || [],
          currentAgent: null,
        }));
      });
    });

    eventSource.addEventListener("bout_complete", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        status: "complete",
        totalCost: data.total_cost,
        currentAgent: null,
      }));
      eventSource.close();
    });

    eventSource.addEventListener("error", (e: Event) => {
      // Check if it's an SSE error event with data
      if (e instanceof MessageEvent && e.data) {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: data.message || "An error occurred",
        }));
      }
      eventSource.close();
    });

    eventSource.onerror = () => {
      // Connection error
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Connection lost",
      }));
      eventSource.close();
    };
  }, [boutId]);

  // Agent color mapping (fallback)
  const getAgentColor = (agentName: string): string => {
    const colors: Record<string, string> = {
      Socrates: "#5B8FB9",
      Nietzsche: "#8B0000",
      "Ayn Rand": "#DAA520",
      Buddha: "#FFA500",
      // Add more as needed
    };
    return colors[agentName] || "#666666";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto" />
            <p className="text-lg text-zinc-400">Loading bout...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="border-b-2 border-white/20 bg-zinc-950 px-4 py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                  {bout?.preset_id?.replace(/-/g, " ") || "Battle"}
                </h1>
                {bout?.topic && (
                  <p className="mt-1 text-sm text-zinc-400">Topic: {bout.topic}</p>
                )}
              </div>
              <div className="text-right">
                <StatusBadge status={state.status} />
                <p className="mt-1 text-xs text-zinc-500">
                  Turn {state.currentTurn} / {bout?.total_turns || "?"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-6">
            {state.messages.map((message, index) => (
              <MessageCard
                key={message.id || index}
                message={message}
                color={getAgentColor(message.agent_name)}
              />
            ))}

            {/* Typing indicator */}
            {state.currentAgent && (
              <div className="flex items-center gap-3 text-zinc-400">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-sm font-medium">{state.currentAgent} is thinking...</span>
              </div>
            )}

            {/* Error state */}
            {state.status === "error" && (
              <div className="rounded-lg border-2 border-red-500 bg-red-950/20 p-4">
                <p className="font-bold text-red-400">Error</p>
                <p className="text-sm text-red-300">{state.error}</p>
              </div>
            )}

            {/* Completion state */}
            {state.status === "complete" && (
              <div className="rounded-lg border-2 border-green-500 bg-green-950/20 p-6 text-center">
                <p className="text-lg font-bold text-green-400">Battle Complete</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {state.messages.length} turns • ${state.totalCost?.toFixed(4) || "0.00"} cost
                </p>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="mt-4 rounded-lg bg-white px-6 py-2 font-bold text-black transition-transform hover:scale-105"
                >
                  Start Another Battle
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>
    </Layout>
  );
}

// Status badge component
function StatusBadge({ status }: { status: BoutStatus }) {
  const styles: Record<BoutStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
    running: "bg-blue-500/20 text-blue-400 border-blue-500",
    complete: "bg-green-500/20 text-green-400 border-green-500",
    error: "bg-red-500/20 text-red-400 border-red-500",
    timeout: "bg-orange-500/20 text-orange-400 border-orange-500",
  };

  const labels: Record<BoutStatus, string> = {
    pending: "Waiting",
    running: "Live",
    complete: "Complete",
    error: "Error",
    timeout: "Timed Out",
  };

  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// Message card component
function MessageCard({
  message,
  color,
}: {
  message: BoutMessage;
  color: string;
}) {
  return (
    <div className="group relative">
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-full"
        style={{ backgroundColor: color }}
      />

      <div className="pl-6">
        {/* Agent name and turn */}
        <div className="mb-2 flex items-center gap-3">
          <span className="font-bold text-white">{message.agent_name}</span>
          {message.agent_role && (
            <span className="text-xs text-zinc-500">{message.agent_role}</span>
          )}
          <span className="text-xs text-zinc-600">Turn {message.turn_number}</span>
        </div>

        {/* Message content */}
        <div className="prose prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
