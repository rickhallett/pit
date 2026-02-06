"use client";

import { useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface CalculationResult {
  equity: number;
  tieEquity: number;
  combinedEquity: number;
  engine: string;
  meta: {
    calculationTimeMs: number;
    iterationsRun?: number;
    confidenceInterval?: number;
  };
}

type CalculationState =
  | { status: "idle" }
  | { status: "calculating" }
  | { status: "success"; result: CalculationResult }
  | { status: "error"; message: string };

// ============================================================================
// Card Input Component
// ============================================================================

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const SUITS = [
  { symbol: "♠", code: "s", color: "text-white" },
  { symbol: "♥", code: "h", color: "text-red-500" },
  { symbol: "♦", code: "d", color: "text-red-500" },
  { symbol: "♣", code: "c", color: "text-white" },
];

interface CardInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

function CardInput({ value, onChange, label, disabled }: CardInputProps) {
  const [rank, setRank] = useState(value?.[0] || "");
  const [suit, setSuit] = useState(value?.[1] || "");

  const handleRankChange = (r: string) => {
    setRank(r);
    if (suit) onChange(`${r}${suit}`);
  };

  const handleSuitChange = (s: string) => {
    setSuit(s);
    if (rank) onChange(`${rank}${s}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="flex gap-1">
        <select
          value={rank}
          onChange={(e) => handleRankChange(e.target.value)}
          disabled={disabled}
          className="w-14 border-2 border-white bg-black px-2 py-2 font-mono text-lg text-white focus:border-accent focus:outline-none disabled:opacity-50"
        >
          <option value="">-</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {SUITS.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => handleSuitChange(s.code)}
              disabled={disabled}
              className={`w-10 border-2 py-2 text-lg transition-all ${
                suit === s.code
                  ? "border-accent bg-accent text-black"
                  : "border-white bg-black hover:bg-zinc-900"
              } ${s.color} disabled:opacity-50`}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Range Input Component
// ============================================================================

interface RangeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PRESET_RANGES = [
  { label: "Random", value: "random" },
  { label: "Top 10%", value: "AA,KK,QQ,JJ,TT,AKs,AQs,AJs,KQs,AKo" },
  { label: "Top 20%", value: "AA,KK,QQ,JJ,TT,99,88,AKs,AQs,AJs,ATs,KQs,KJs,QJs,AKo,AQo" },
  { label: "Pairs", value: "22-AA" },
];

function RangeInput({ value, onChange, disabled }: RangeInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        Opponent Range
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="AA,KK,AKs or 'random'"
        disabled={disabled}
        className="w-full border-2 border-white bg-black px-4 py-2 font-mono text-white placeholder-zinc-600 focus:border-accent focus:outline-none disabled:opacity-50"
      />
      <div className="flex flex-wrap gap-2">
        {PRESET_RANGES.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className="border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Result Display Component
// ============================================================================

interface ResultDisplayProps {
  state: CalculationState;
}

function ResultDisplay({ state }: ResultDisplayProps) {
  if (state.status === "idle") {
    return (
      <div className="flex h-48 items-center justify-center border-2 border-dashed border-zinc-800 bg-zinc-950">
        <p className="text-zinc-600">Enter cards and calculate</p>
      </div>
    );
  }

  if (state.status === "calculating") {
    return (
      <div className="flex h-48 items-center justify-center border-2 border-accent bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin border-2 border-accent border-t-transparent"></div>
          <p className="font-bold uppercase tracking-wider text-accent">
            Calculating...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-48 items-center justify-center border-2 border-red-500 bg-zinc-950">
        <p className="text-red-500">{state.message}</p>
      </div>
    );
  }

  const { result } = state;
  const equityPercent = (result.equity * 100).toFixed(1);
  const tiePercent = (result.tieEquity * 100).toFixed(1);
  const combinedPercent = (result.combinedEquity * 100).toFixed(1);

  return (
    <div className="border-2 border-accent bg-zinc-950 p-6">
      <div className="mb-6 text-center">
        <div className="text-6xl font-black text-accent">{combinedPercent}%</div>
        <div className="text-sm font-bold uppercase tracking-wider text-zinc-500">
          Combined Equity
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{equityPercent}%</div>
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Win
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{tiePercent}%</div>
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Tie
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4 text-center text-xs text-zinc-600">
        {result.meta.iterationsRun?.toLocaleString()} iterations •{" "}
        {result.meta.calculationTimeMs}ms •{" "}
        {result.meta.confidenceInterval && `±${result.meta.confidenceInterval}%`}
      </div>
    </div>
  );
}

// ============================================================================
// Main Calculator Component
// ============================================================================

export default function PokerCalculator() {
  const [card1, setCard1] = useState("");
  const [card2, setCard2] = useState("");
  const [board, setBoard] = useState("");
  const [opponentRange, setOpponentRange] = useState("random");
  const [state, setState] = useState<CalculationState>({ status: "idle" });

  const canCalculate = card1.length === 2 && card2.length === 2 && opponentRange;

  const handleCalculate = async () => {
    if (!canCalculate) return;

    setState({ status: "calculating" });

    try {
      const response = await fetch("/api/poker/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hand: `${card1}${card2}`,
          board: board || undefined,
          opponents: [{ range: opponentRange }],
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setState({ status: "error", message: data.error.message });
        return;
      }

      setState({ status: "success", result: data.data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Calculation failed",
      });
    }
  };

  const handleReset = () => {
    setCard1("");
    setCard2("");
    setBoard("");
    setOpponentRange("random");
    setState({ status: "idle" });
  };

  return (
    <section className="border-b-4 border-white bg-black py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">
            Equity Calculator
          </h2>
          <p className="text-zinc-500">
            Calculate your hand equity against opponent ranges
          </p>
        </div>

        <div className="mb-8 space-y-6">
          {/* Hero Hand */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Your Hand
            </h3>
            <div className="flex gap-6">
              <CardInput
                value={card1}
                onChange={setCard1}
                label="Card 1"
                disabled={state.status === "calculating"}
              />
              <CardInput
                value={card2}
                onChange={setCard2}
                label="Card 2"
                disabled={state.status === "calculating"}
              />
            </div>
          </div>

          {/* Board (optional) */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Board{" "}
              <span className="font-normal text-zinc-600">(optional)</span>
            </h3>
            <input
              type="text"
              value={board}
              onChange={(e) => setBoard(e.target.value.toUpperCase())}
              placeholder="e.g., AhKd7c"
              disabled={state.status === "calculating"}
              className="w-full border-2 border-white bg-black px-4 py-2 font-mono text-white placeholder-zinc-600 focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Opponent Range */}
          <RangeInput
            value={opponentRange}
            onChange={setOpponentRange}
            disabled={state.status === "calculating"}
          />
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleCalculate}
            disabled={!canCalculate || state.status === "calculating"}
            className="flex-1 border-4 border-white bg-accent px-8 py-4 font-black uppercase tracking-wider text-black transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Calculate
          </button>
          <button
            onClick={handleReset}
            disabled={state.status === "calculating"}
            className="border-4 border-zinc-700 bg-black px-8 py-4 font-black uppercase tracking-wider text-zinc-400 transition-all hover:border-white hover:text-white disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {/* Results */}
        <ResultDisplay state={state} />
      </div>
    </section>
  );
}
