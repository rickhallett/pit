"use client";

import { useState } from "react";
import {
  Layout,
  Hero,
  HowItWorks,
  Countdown,
  PresetCard,
  BattleArena,
  ShareCard,
} from "@/components";
import { getFeaturedPresets, getLaunchHeroPreset } from "@/lib/presets";
import type { Preset } from "@/lib/types/preset";

export default function Home() {
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  
  const featuredPresets = getFeaturedPresets();
  const launchHero = getLaunchHeroPreset();

  const handlePresetClick = (preset: Preset) => {
    if (selectedPreset?.preset_id === preset.preset_id) {
      setSelectedPreset(null); // Deselect
    } else {
      setSelectedPreset(preset);
    }
  };

  return (
    <Layout>
      <Hero />
      <Countdown />
      <HowItWorks />

      {/* Preset Selection */}
      <section className="border-b-4 border-white bg-black py-20">
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
                Select a preset
              </p>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                to begin
              </p>
            </div>
          </div>

          {/* Launch Hero Callout */}
          {launchHero && (
            <div className="mb-12 border-l-4 border-accent bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
                🧬 Darwin Day Special — February 12th
              </p>
              <p className="text-lg text-white">
                {launchHero.name}: {launchHero.description}
              </p>
            </div>
          )}

          {/* Staggered layout — not a uniform grid */}
          <div className="space-y-0 divide-y divide-white/10">
            {featuredPresets.map((preset, index) => (
              <PresetCard
                key={preset.preset_id}
                preset={preset}
                index={index}
                selected={selectedPreset?.preset_id === preset.preset_id}
                onClick={() => handlePresetClick(preset)}
              />
            ))}
          </div>

          {/* Start Battle CTA */}
          {selectedPreset && (
            <div className="mt-12 flex justify-center">
              <button className="group relative bg-accent px-12 py-4 text-lg font-black uppercase tracking-widest text-black transition-all hover:bg-white">
                Start {selectedPreset.name}
                <span className="absolute -right-2 -top-2 h-4 w-4 bg-white group-hover:bg-accent transition-colors" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Battle Arena Demo */}
      {selectedPreset && (
        <BattleArena 
          fighter1={selectedPreset.agents[0]?.name ?? "Agent 1"} 
          fighter2={selectedPreset.agents[1]?.name ?? "Agent 2"} 
        />
      )}

      {/* Share Card Demo */}
      <section className="border-b-4 border-white bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Share Your Battle
          </h2>
          <ShareCard
            winner={selectedPreset?.agents[0]?.name ?? "The Optimist"}
            loser={selectedPreset?.agents[1]?.name ?? "The Skeptic"}
            topic={selectedPreset?.name ?? "The Future of AI"}
            voteCount={1337}
            winnerColor="accent"
          />
        </div>
      </section>
    </Layout>
  );
}
