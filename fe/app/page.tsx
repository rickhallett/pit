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
      color: "accent" as const,
    },
    {
      id: "skeptic",
      name: "The Skeptic",
      stance: "Question Everything",
      description:
        "Champions critical thinking, evidence-based reasoning, and cautious evaluation before action.",
      color: "accent-secondary" as const,
    },
    {
      id: "idealist",
      name: "The Idealist",
      stance: "Principles First",
      description:
        "Driven by values, ethics, and the vision of what should be. Refuses to compromise on core beliefs.",
      color: "accent" as const,
    },
    {
      id: "pragmatist",
      name: "The Pragmatist",
      stance: "Results Matter",
      description:
        "Focused on what works in practice. Values outcomes over ideologies and adapts to reality.",
      color: "accent-secondary" as const,
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
          <h2 className="mb-4 text-center text-4xl font-black tracking-tighter text-white sm:text-5xl">
            Choose Your Fighters
          </h2>
          <p className="mb-12 text-center text-lg text-zinc-400">
            Select two personas to battle it out
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                name={preset.name}
                description={preset.description}
                stance={preset.stance}
                color={preset.color}
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
