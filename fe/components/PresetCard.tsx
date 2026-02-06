interface PresetCardProps {
  name: string;
  description: string;
  stance: string;
  index: number;
  selected?: boolean;
  onClick?: () => void;
}

export default function PresetCard({
  name,
  description,
  stance,
  index,
  selected = false,
  onClick,
}: PresetCardProps) {
  // Alternate styling based on index for asymmetry
  const isEven = index % 2 === 0;
  const isFirst = index === 0;
  const isLast = index === 3; // Assuming 4 presets for now

  return (
    <button
      onClick={onClick}
      className={`group relative w-full p-8 text-left transition-all ${
        selected ? "bg-white/10" : "bg-transparent hover:bg-white/5"
      } ${isEven ? "md:pr-16" : "md:pl-16"}`}
    >
      {/* Partial border — brutalist asymmetry */}
      <div
        className={`absolute ${
          isEven
            ? "left-0 top-0 h-full w-1 bg-accent"
            : "right-0 top-0 h-full w-1 bg-accent-secondary"
        }`}
      />
      <div
        className={`absolute ${
          isFirst
            ? "left-0 top-0 h-1 w-24 bg-accent"
            : isLast
              ? "bottom-0 right-0 h-1 w-24 bg-accent-secondary"
              : isEven
                ? "left-0 top-0 h-1 w-16 bg-white/30"
                : "right-0 bottom-0 h-1 w-16 bg-white/30"
        }`}
      />

      <div className={`flex flex-col ${isEven ? "" : "md:items-end md:text-right"}`}>
        {/* Index number */}
        <div
          className={`mb-4 text-6xl font-black leading-none ${
            isEven ? "text-accent" : "text-accent-secondary"
          } ${selected ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <h3 className="mb-2 text-2xl font-black uppercase tracking-tight text-white">
          {name}
        </h3>

        <p
          className={`mb-4 text-sm font-bold uppercase tracking-widest ${
            isEven ? "text-accent" : "text-accent-secondary"
          }`}
        >
          {stance}
        </p>

        <p className="max-w-md text-base leading-relaxed text-zinc-400">
          {description}
        </p>

        {/* Selection indicator */}
        {selected && (
          <div className="mt-6 flex items-center gap-3">
            <div
              className={`h-3 w-3 ${isEven ? "bg-accent" : "bg-accent-secondary"}`}
            />
            <span className="text-xs font-black uppercase tracking-widest text-white">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* Geometric accent on hover */}
      <div
        className={`absolute opacity-0 transition-opacity group-hover:opacity-100 ${
          isEven ? "right-8 top-8" : "left-8 bottom-8"
        }`}
      >
        <div
          className={`h-8 w-8 rotate-45 border-2 ${
            isEven ? "border-accent" : "border-accent-secondary"
          }`}
        />
      </div>
    </button>
  );
}
