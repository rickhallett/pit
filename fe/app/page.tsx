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
  WaitlistForm,
} from "@/components";
import { getPresets, createBout, Preset, ApiError } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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
            id: "first-contact",
            name: "First Contact",
            description: "Earth diplomat meets alien who learned English from reality TV.",
            category: "comedy",
            agent_count: 2,
            featured: true,
            sort_order: 0,
            requires_input: false,
            premise: "Comedy duo. Earth diplomat meets alien who learned English from reality TV.",
            tone: "Comedy",
          },
          {
            id: "roast-battle",
            name: "Roast Battle",
            description: "Two comedians trade insults until one cracks.",
            category: "comedy",
            agent_count: 2,
            featured: true,
            sort_order: 1,
            requires_input: false,
            premise: "Two comedians trade insults until one cracks.",
            tone: "Comedy roast",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadPresets();
  }, []);

  // Handle bout creation when a preset is selected
  const handleStartBout = async (presetId: string) => {
    try {
      setCreatingBout(true);
      setSelectedPreset(presetId);
      
      const response = await createBout(presetId);
      
      console.log("Bout created:", response);
      
      // Navigate to bout view
      router.push(`/bout/${response.bout_id}`);
      
    } catch (err) {
      console.error("Failed to create bout:", err);
      const errorMessage = err instanceof ApiError
        ? err.message
        : "Failed to create bout";
      setError(errorMessage);
      setSelectedPreset(null);
    } finally {
      setCreatingBout(false);
    }
  };

  return (
    <Layout>
      <Hero />
      
      {/* Early Waitlist CTA */}
      <section className="border-b-4 border-white bg-zinc-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-8">
            <p className="text-lg font-bold uppercase tracking-wider text-zinc-400">
              Be first in the arena
            </p>
            <WaitlistForm source="hero" />
          </div>
        </div>
      </section>

      <Countdown />
      <HowItWorks />

      {/* Preset Selection */}
      <section id="fighters" className="border-b-4 border-white bg-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl md:text-6xl">
                Choose Your
                <br />
                Battle
              </h2>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Pick a scenario
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Watch the chaos
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
              <p className="text-lg text-zinc-400">Loading scenarios...</p>
            </div>
          )}

          {/* Darwin Special Hero Callout */}
          {!loading && presets.find(p => p.launch_day_hero) && (
            <div className="mb-12">
              {(() => {
                const heroPreset = presets.find(p => p.launch_day_hero)!;
                return (
                  <div className="relative overflow-hidden border-4 border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-black p-8">
                    <div className="absolute -right-8 -top-8 text-[120px] opacity-10">🦴</div>
                    <div className="relative z-10">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="bg-yellow-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-black">
                          Darwin Day Special
                        </span>
                        <span className="text-yellow-500 text-sm font-bold">
                          February 12, 2026
                        </span>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        {heroPreset.name}
                      </h3>
                      <p className="mt-2 text-lg text-zinc-400">
                        {heroPreset.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {heroPreset.agents?.map((agent) => (
                          <span
                            key={agent.name}
                            className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm text-zinc-300"
                          >
                            <span>{agent.avatar}</span>
                            <span>{agent.name}</span>
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleStartBout(heroPreset.id)}
                        disabled={creatingBout}
                        className="mt-6 border-4 border-yellow-500 bg-yellow-500 px-8 py-3 text-lg font-black uppercase tracking-tight text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
                      >
                        {creatingBout && selectedPreset === heroPreset.id
                          ? "Starting..."
                          : "⚡ Launch This Battle"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Presets grid */}
          {!loading && (
            <div className="space-y-0 divide-y divide-white/10">
              {presets
                .filter(p => !p.launch_day_hero)
                .map((preset, index) => (
                  <PresetCard
                    key={preset.id}
                    name={preset.name}
                    description={preset.tone || preset.premise || preset.description}
                    stance={preset.premise || preset.description}
                    index={index}
                    selected={selectedPreset === preset.id}
                    onClick={() => handleStartBout(preset.id)}
                    disabled={creatingBout}
                  />
                ))}
            </div>
          )}

          {/* Loading indicator when creating bout */}
          {creatingBout && (
            <div className="mt-12 flex justify-center">
              <p className="text-lg font-bold uppercase tracking-wider text-accent animate-pulse">
                Starting battle...
              </p>
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

      {/* Waitlist Section */}
      <section className="border-b-4 border-white bg-black py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">
              Don&apos;t Miss the Launch
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Darwin Day — February 12, 2026
            </p>
            <p className="mt-2 text-zinc-500">
              Get notified when the arena opens.
            </p>
            <div className="mt-8 flex justify-center">
              <WaitlistForm source="landing-bottom" />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
