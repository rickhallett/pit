interface PresetCardProps {
  name: string;
  description: string;
  stance: string;
  color: "accent" | "accent-secondary";
  selected?: boolean;
  onClick?: () => void;
}

export default function PresetCard({
  name,
  description,
  stance,
  color,
  selected = false,
  onClick,
}: PresetCardProps) {
  const colorClasses = {
    accent: "border-accent bg-accent/10 hover:bg-accent/20",
    "accent-secondary":
      "border-accent-secondary bg-accent-secondary/10 hover:bg-accent-secondary/20",
  };

  const selectedClasses = {
    accent: "bg-accent/30",
    "accent-secondary": "bg-accent-secondary/30",
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full border-4 p-6 text-left transition-all ${
        selected
          ? `${selectedClasses[color]} scale-105`
          : colorClasses[color]
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight text-white">
          {name}
        </h3>
        {selected && (
          <div
            className={`h-6 w-6 ${
              color === "accent" ? "bg-accent" : "bg-accent-secondary"
            }`}
          ></div>
        )}
      </div>

      <p className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
        {stance}
      </p>

      <p className="text-base leading-relaxed text-zinc-300">{description}</p>

      <div className="mt-6 flex items-center gap-2">
        <div
          className={`h-2 w-2 ${
            color === "accent" ? "bg-accent" : "bg-accent-secondary"
          }`}
        ></div>
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Ready to fight
        </span>
      </div>
    </button>
  );
}
