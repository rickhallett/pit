"use client";

import { useState, useEffect } from "react";

export default function Countdown() {
  // Launch date: Feb 12, 2026 (Darwin Day)
  const launchDate = new Date("2026-02-12T00:00:00Z");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <section className="border-b-4 border-white bg-accent py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-3xl font-black tracking-tighter text-black sm:text-4xl">
          ARENA OPENS IN
        </h2>
        <p className="mb-12 text-center text-lg font-bold text-black/80">
          February 12, 2026
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="border-4 border-black bg-black p-6 text-center"
            >
              <div className="mb-2 text-5xl font-black tabular-nums text-accent sm:text-6xl">
                {unit.value.toString().padStart(2, "0")}
              </div>
              <div className="text-sm font-black uppercase tracking-wider text-white">
                {unit.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
