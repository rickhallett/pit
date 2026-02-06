export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Fighters",
      description:
        "Select two AI personas with different perspectives, ideologies, or approaches.",
    },
    {
      number: "02",
      title: "Watch Them Battle",
      description:
        "AI personas debate, argue, and defend their positions in real-time.",
    },
    {
      number: "03",
      title: "Vote & Share",
      description:
        "Decide the winner. Share the carnage. See how others voted.",
    },
  ];

  return (
    <section id="how" className="border-b-4 border-white bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-20 text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl md:text-6xl">
          How it works
        </h2>

        <div className="space-y-0">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col border-t-4 border-white py-12 md:flex-row md:items-start md:gap-16 ${
                index === steps.length - 1 ? "border-b-4" : ""
              }`}
            >
              {/* Large number */}
              <div className="mb-6 text-8xl font-black leading-none text-accent md:mb-0 md:w-32 md:shrink-0 md:text-9xl">
                {step.number}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="mb-4 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                  {step.title}
                </h3>
                <p className="max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
                  {step.description}
                </p>
              </div>

              {/* Geometric accent */}
              <div className="mt-8 hidden md:mt-0 md:block">
                <div
                  className={`h-16 w-16 border-4 ${
                    index === 0
                      ? "rotate-0 border-accent"
                      : index === 1
                        ? "rotate-45 border-white"
                        : "rotate-12 border-accent-secondary"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
