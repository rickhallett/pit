interface ShareCardProps {
  winner: string;
  loser: string;
  topic?: string;
  voteCount?: number;
  winnerColor?: "accent" | "accent-secondary";
}

export default function ShareCard({
  winner,
  loser,
  topic = "The Future of AI",
  voteCount = 1337,
  winnerColor = "accent",
}: ShareCardProps) {
  return (
    <div className="mx-auto max-w-2xl border-4 border-white bg-black p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b-4 border-white pb-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 border-2 border-accent bg-accent"></div>
          <span className="text-sm font-black uppercase tracking-tighter text-white">
            The Pit
          </span>
        </div>
        <div className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Battle Result
        </div>
      </div>

      {/* Topic */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">
          Topic
        </div>
        <div className="text-2xl font-black tracking-tight text-white">
          {topic}
        </div>
      </div>

      {/* Results */}
      <div className="mb-8 space-y-4">
        <div
          className={`border-4 ${
            winnerColor === "accent" ? "border-accent" : "border-accent-secondary"
          } bg-zinc-900 p-6`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-3xl font-black text-white">{winner}</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 ${
                  winnerColor === "accent" ? "bg-accent" : "bg-accent-secondary"
                }`}
              ></div>
              <span className="text-sm font-black uppercase tracking-wider text-zinc-400">
                Winner
              </span>
            </div>
          </div>
          <div className="text-sm font-bold text-zinc-400">
            {voteCount.toLocaleString()} votes
          </div>
        </div>

        <div className="border-4 border-zinc-700 bg-zinc-950 p-6 opacity-50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-3xl font-black text-white">{loser}</span>
            <span className="text-sm font-black uppercase tracking-wider text-zinc-600">
              Defeated
            </span>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-4">
        <button className="flex-1 border-4 border-white bg-white py-3 font-black uppercase tracking-wider text-black transition-all hover:bg-black hover:text-white">
          Share Result
        </button>
        <button className="border-4 border-white bg-black px-6 py-3 font-black uppercase text-white transition-all hover:bg-white hover:text-black">
          ↗
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs font-bold uppercase tracking-wider text-zinc-600">
        Only one idea survives
      </div>
    </div>
  );
}
