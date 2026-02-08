"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Layout, BattleArena, ShareModal } from "@/components";
import { getBout, connectBoutStream, BoutDetail, ApiError } from "@/lib/api";

interface StreamMessage {
  agent_name: string;
  content: string;
  turn_number: number;
}

export default function BoutPage() {
  const params = useParams();
  const boutId = params.id as string;

  const [bout, setBout] = useState<BoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState<{
    agent_name: string;
    turn_number: number;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch initial bout data
  useEffect(() => {
    async function loadBout() {
      try {
        setLoading(true);
        const data = await getBout(boutId);
        setBout(data);
        setError(null);

        // If bout is complete, show messages
        if (data.status === "complete" && data.messages) {
          setStreamMessages(
            data.messages.map((m) => ({
              agent_name: m.agent_name,
              content: m.content,
              turn_number: m.turn_number,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load bout:", err);
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load bout"
        );
      } finally {
        setLoading(false);
      }
    }

    if (boutId) {
      loadBout();
    }
  }, [boutId]);

  // Connect to SSE stream if bout is pending or running
  useEffect(() => {
    if (!bout || bout.status === "complete" || bout.status === "error") {
      return;
    }

    setStreaming(true);
    const eventSource = connectBoutStream(boutId);

    eventSource.addEventListener("turn_start", (e) => {
      const data = JSON.parse(e.data);
      console.log("Turn start:", data);
      setCurrentTurn({
        agent_name: data.agent_name,
        turn_number: data.turn_number,
      });
    });

    eventSource.addEventListener("turn_end", (e) => {
      const data = JSON.parse(e.data);
      console.log("Turn end:", data);
      
      // Content now included in SSE event — no refetch needed
      setStreamMessages((prev) => [
        ...prev,
        {
          agent_name: data.agent_name,
          content: data.content,
          turn_number: data.turn_number,
        },
      ]);
      
      setCurrentTurn(null);
    });

    eventSource.addEventListener("bout_complete", (e) => {
      const data = JSON.parse(e.data);
      console.log("Bout complete:", data);
      setStreaming(false);
      setBout((prev) => prev ? { ...prev, status: "complete" } : null);
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      console.error("Stream error:", data);
      setError(data.message || "Stream error");
      setStreaming(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      console.error("EventSource failed");
      setStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [bout?.status, boutId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-2xl text-zinc-400">Loading bout...</p>
        </div>
      </Layout>
    );
  }

  if (error || !bout) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-2xl text-red-400">Error</p>
            <p className="mt-2 text-zinc-400">{error || "Bout not found"}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Get fighter names from the first two agents
  const fighter1 = bout.messages?.[0]?.agent_name || streamMessages?.[0]?.agent_name || "Fighter 1";
  const fighter2 = 
    bout.messages?.find((m) => m.agent_name !== fighter1)?.agent_name || 
    streamMessages.find((m) => m.agent_name !== fighter1)?.agent_name ||
    "Fighter 2";

  // Transform stream messages to BattleArena format
  const arenaMessages = streamMessages.map((msg, index) => ({
    id: `${msg.turn_number}-${index}`,
    speaker: msg.agent_name,
    text: msg.content,
    color: (msg.agent_name === fighter1 ? "accent" : "accent-secondary") as "accent" | "accent-secondary",
  }));

  return (
    <Layout>
      {/* Bout Header */}
      <section className="border-b-4 border-white bg-black py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">
              The Pit
            </h1>
            {bout.topic && (
              <p className="mt-4 text-xl text-zinc-400">Topic: {bout.topic}</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-4">
              <span className="text-lg font-bold text-purple-400">
                Status: {bout.status}
              </span>
              {streaming && (
                <span className="animate-pulse text-sm text-green-400">
                  ● Streaming
                </span>
              )}
            </div>
            {currentTurn && (
              <p className="mt-2 text-sm text-zinc-500">
                {currentTurn.agent_name} is thinking... (Turn {currentTurn.turn_number})
              </p>
            )}

            {/* Share Button - only show when bout is complete */}
            {bout.status === "complete" && (
              <button
                onClick={() => setShowShareModal(true)}
                className="mt-6 border-4 border-white bg-white px-8 py-3 text-lg font-black uppercase tracking-tight text-black transition-colors hover:bg-zinc-200"
              >
                ⚔️ Share the Carnage
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Share Modal */}
      <ShareModal
        boutId={boutId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Battle Arena with Messages */}
      <BattleArena 
        fighter1={fighter1} 
        fighter2={fighter2}
        messages={arenaMessages.length > 0 ? arenaMessages : undefined}
      />

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <section className="border-b-4 border-white bg-zinc-900 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <details className="text-xs text-zinc-500">
              <summary className="cursor-pointer font-bold">Debug Info</summary>
              <pre className="mt-4 overflow-auto">
                {JSON.stringify({ bout, streamMessages, currentTurn }, null, 2)}
              </pre>
            </details>
          </div>
        </section>
      )}
    </Layout>
  );
}
