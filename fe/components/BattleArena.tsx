interface Message {
  id: string;
  speaker: string;
  text: string;
  color: "accent" | "accent-secondary";
}

interface BattleArenaProps {
  messages?: Message[];
  fighter1?: string;
  fighter2?: string;
}

const defaultMessages: Message[] = [
  {
    id: "1",
    speaker: "Optimist",
    text: "Every challenge is an opportunity for growth. We should embrace change and innovation.",
    color: "accent",
  },
  {
    id: "2",
    speaker: "Skeptic",
    text: "Not every change is progress. We need to critically evaluate the risks before rushing forward.",
    color: "accent-secondary",
  },
  {
    id: "3",
    speaker: "Optimist",
    text: "But waiting too long means missing opportunities. Fortune favors the bold.",
    color: "accent",
  },
  {
    id: "4",
    speaker: "Skeptic",
    text: "And recklessness leads to disaster. Caution isn't weakness—it's wisdom.",
    color: "accent-secondary",
  },
];

export default function BattleArena({
  messages = defaultMessages,
  fighter1 = "Fighter 1",
  fighter2 = "Fighter 2",
}: BattleArenaProps) {
  return (
    <section
      id="arena"
      className="border-b-4 border-white bg-black py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-4xl font-black tracking-tighter text-white sm:text-5xl">
          Battle Preview
        </h2>

        {/* Arena header */}
        <div className="mb-8 grid grid-cols-3 items-center gap-4 border-4 border-white bg-zinc-900 p-6">
          <div className="text-center">
            <div className="mb-2 text-2xl font-black text-accent">
              {fighter1}
            </div>
            <div className="h-2 w-full bg-accent"></div>
          </div>

          <div className="text-center text-4xl font-black text-white">VS</div>

          <div className="text-center">
            <div className="mb-2 text-2xl font-black text-accent-secondary">
              {fighter2}
            </div>
            <div className="h-2 w-full bg-accent-secondary"></div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 border-4 border-white bg-zinc-950 p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`border-l-4 p-4 ${
                message.color === "accent"
                  ? "border-accent bg-accent/5"
                  : "border-accent-secondary bg-accent-secondary/5"
              }`}
            >
              <div className="mb-2 text-sm font-black uppercase tracking-wider text-zinc-400">
                {message.speaker}
              </div>
              <p className="text-base leading-relaxed text-white">
                {message.text}
              </p>
            </div>
          ))}

          {/* Typing indicator */}
          <div className="flex items-center gap-2 border-l-4 border-accent p-4">
            <div className="flex gap-1">
              <div className="h-2 w-2 animate-pulse bg-accent"></div>
              <div className="h-2 w-2 animate-pulse bg-accent delay-75"></div>
              <div className="h-2 w-2 animate-pulse bg-accent delay-150"></div>
            </div>
            <span className="text-sm font-bold text-zinc-400">
              {fighter1} is thinking...
            </span>
          </div>
        </div>

        {/* Vote buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="border-4 border-accent bg-accent py-4 font-black uppercase tracking-wider text-black transition-all hover:bg-black hover:text-accent">
            Vote {fighter1}
          </button>
          <button className="border-4 border-accent-secondary bg-accent-secondary py-4 font-black uppercase tracking-wider text-black transition-all hover:bg-black hover:text-accent-secondary">
            Vote {fighter2}
          </button>
        </div>
      </div>
    </section>
  );
}
