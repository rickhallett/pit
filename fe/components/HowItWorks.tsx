export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose Your Fighters",
      description:
        "Select two AI personas with different perspectives, ideologies, or approaches.",
      icon: "⚔️",
    },
    {
      number: "02",
      title: "Watch Them Battle",
      description:
        "AI personas debate, argue, and defend their positions in real-time conversation.",
      icon: "👁️",
    },
    {
      number: "03",
      title: "Vote & Share",
      description:
        "Decide the winner, share the battle, and see how others voted on the showdown.",
      icon: "🏆",
    },
  ];

  return (
    <section id="how" className="border-b-4 border-white bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-16 text-center text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-6xl">
          How it works
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border-4 border-white bg-black p-8 transition-all hover:bg-zinc-900"
            >
              <div className="mb-6 text-6xl">{step.icon}</div>
              <div className="mb-4 text-5xl font-black text-accent">
                {step.number}
              </div>
              <h3 className="mb-4 text-2xl font-black tracking-tight text-white">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
