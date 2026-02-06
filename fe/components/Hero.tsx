"use client";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b-4 border-white bg-black py-20 md:py-32">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Arena visual - geometric shapes */}
          <div className="mb-12 flex items-center justify-center gap-8">
            <div className="h-16 w-16 rotate-45 border-4 border-accent bg-black sm:h-24 sm:w-24"></div>
            <div className="relative">
              <div className="h-24 w-24 border-4 border-white bg-black sm:h-32 sm:w-32"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-accent sm:text-6xl">
                  VS
                </span>
              </div>
            </div>
            <div className="h-16 w-16 rotate-45 border-4 border-accent-secondary bg-black sm:h-24 sm:w-24"></div>
          </div>

          {/* Headline */}
          <h1 className="mb-6 max-w-4xl text-5xl font-black leading-none tracking-tighter text-white sm:text-7xl md:text-8xl">
            Where ideas fight to the death.
          </h1>

          <p className="mb-10 max-w-2xl text-lg font-medium text-zinc-400 sm:text-xl">
            Watch AI personas battle it out in real-time. Vote for the winner.
            Shape the future of ideas.
          </p>

          {/* CTA */}
          <button className="group relative overflow-hidden border-4 border-white bg-accent px-12 py-4 font-black uppercase tracking-wider text-black transition-all hover:bg-white hover:text-black">
            <span className="relative z-10">Enter the Arena</span>
            <div className="absolute inset-0 -translate-x-full bg-white transition-transform group-hover:translate-x-0"></div>
          </button>
        </div>
      </div>
    </section>
  );
}
