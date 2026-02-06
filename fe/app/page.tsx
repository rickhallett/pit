"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Hero,
  HowItWorks,
  Countdown,
  PresetCard,
  BattleArena,
  ShareCard,
} from "@/components";
import { getPresets, createBout, Preset, ApiError } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [selectedFighters, setSelectedFighters] = useState<{
    fighter1: string | null;
    fighter2: string | null;
  }>({
    fighter1: null,
    fighter2: null,
  });

  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingBout, setCreatingBout] = useState(false);

  // Fetch presets on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        setLoading(true);
        const data = await getPresets();
        setPresets(data.presets);
        setError(null);
      } catch (err) {
        console.error("Failed to load presets:", err);
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load presets. Is the backend running?"
        );
        // Fallback to mock data if API fails
        setPresets([
          {
            id: "optimist",
            name: "The Optimist",
            description: "Progress Above All",
            category: "debate",
            agent_count: 1,
            featured: true,
            sort_order: 0,
            requires_input: false,
            premise: "Progress Above All",
            tone: "Believes in the power of innovation, risk-taking, and forward momentum. Change is opportunity.",
          },
          {
            id: "skeptic",
            name: "The Skeptic",
            description: "Question Everything",
            category: "debate",
            agent_count: 1,
            featured: true,
            sort_order: 1,
            requires_input: false,
            premise: "Question Everything",
            tone: "Champions critical thinking, evidence-based reasoning, and cautious evaluation before action.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadPresets();
  }, []);

  // Handle bout creation when both fighters are selected
  const handleStartBout = async () => {
    if (!selectedFighters.fighter1 || !selectedFighters.fighter2) {
      return;
    }

    try {
      setCreatingBout(true);
      
      // For now, we'll use the first selected fighter's preset
      // In a real implementation, you might want to create a custom preset
      // that includes both fighters as agents
      const response = await createBout(selectedFighters.fighter1);
      
      console.log("Bout created:", response);
      
      // Navigate to bout view
      router.push(`/bout/${response.bout_id}`);
      
    } catch (err) {
      console.error("Failed to create bout:", err);
      alert(
        err instanceof ApiError
          ? `Error: ${err.message}`
          : "Failed to create bout"
      );
    } finally {
      setCreatingBout(false);
    }
  };

  return (
    <Layout>
      <Hero />
      <Countdown />
      <HowItWorks />

      {/* Fighter Selection */}
      <section className="border-b-4 border-white bg-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl md:text-6xl">
                Choose Your
                <br />
                Fighters
              </h2>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Select two
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                to battle
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-8 rounded-lg border-2 border-red-500 bg-red-950/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-lg text-zinc-400">Loading fighters...</p>
            </div>
          )}

          {/* Presets grid */}
          {!loading && (
            <div className="space-y-0 divide-y divide-white/10">
              {presets.map((preset, index) => (
                <PresetCard
                  key={preset.id}
                  name={preset.name}
                  description={preset.tone || preset.premise || preset.description}
                  stance={preset.premise || preset.description}
                  index={index}
                  selected={
                    selectedFighters.fighter1 === preset.id ||
                    selectedFighters.fighter2 === preset.id
                  }
                  onClick={() => {
                    if (!selectedFighters.fighter1) {
                      setSelectedFighters({
                        ...selectedFighters,
                        fighter1: preset.id,
                      });
                    } else if (
                      !selectedFighters.fighter2 &&
                      selectedFighters.fighter1 !== preset.id
                    ) {
                      setSelectedFighters({
                        ...selectedFighters,
                        fighter2: preset.id,
                      });
                    } else {
                      // Reset selection
                      setSelectedFighters({ fighter1: null, fighter2: null });
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Start Bout Button */}
          {selectedFighters.fighter1 && selectedFighters.fighter2 && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={handleStartBout}
                disabled={creatingBout}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-black uppercase tracking-wider text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingBout ? "Starting Bout..." : "Start the Battle"}
              </button>
            </div>
          )}
        </div>
      </section>

      <BattleArena fighter1="The Optimist" fighter2="The Skeptic" />

      {/* Share Card Demo */}
      <section className="border-b-4 border-white bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Share Your Battle
          </h2>
          <ShareCard
            winner="The Optimist"
            loser="The Skeptic"
            topic="The Future of AI"
            voteCount={1337}
            winnerColor="accent"
          />
        </div>
      </section>
    </Layout>
  );
}
