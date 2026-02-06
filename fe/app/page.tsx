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

export default function Home() {
  const [selectedFighters, setSelectedFighters] = useState<{
    fighter1: string | null;
    fighter2: string | null;
  }>({
    fighter1: null,
    fighter2: null,
  });

  const presets = [
    {
      id: "optimist",
      name: "The Optimist",
      stance: "Progress Above All",
      description:
        "Believes in the power of innovation, risk-taking, and forward momentum. Change is opportunity.",
    },
    {
      id: "skeptic",
      name: "The Skeptic",
      stance: "Question Everything",
      description:
        "Champions critical thinking, evidence-based reasoning, and cautious evaluation before action.",
    },
    {
      id: "idealist",
      name: "The Idealist",
      stance: "Principles First",
      description:
        "Driven by values, ethics, and the vision of what should be. Refuses to compromise on core beliefs.",
    },
    {
      id: "pragmatist",
      name: "The Pragmatist",
      stance: "Results Matter",
      description:
        "Focused on what works in practice. Values outcomes over ideologies and adapts to reality.",
    },
  ];

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

          {/* Staggered layout — not a uniform grid */}
          <div className="space-y-0 divide-y divide-white/10">
            {presets.map((preset, index) => (
              <PresetCard
                key={preset.id}
                name={preset.name}
                description={preset.description}
                stance={preset.stance}
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
