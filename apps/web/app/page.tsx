"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Sparkles,
} from "lucide-react";

const phases = [
  {
    label: "Phase 1",
    title: "Discover",
    tagline: "Learn & explore",
    description: "Learn through real industry challenges.",
    background:
      "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #1d4ed8 100%)",
    indicator: "bg-blue-400",
  },
  {
    label: "Phase 2",
    title: "Validate",
    tagline: "Build & test",
    description: "Build and refine your solution with expert mentors.",
    background:
      "linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #059669 100%)",
    indicator: "bg-emerald-400",
  },
  {
    label: "Phase 3",
    title: "Grow",
    tagline: "Deliver & grow",
    description: "Turn your proof of work into real opportunity.",
    background:
      "linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #7c3aed 100%)",
    indicator: "bg-violet-400",
  },
];

const AUTO_ADVANCE_MS = 4000;

export default function Home() {
  const [activePhase, setActivePhase] = useState(0);

  const goToPhase = (index: number) => {
    setActivePhase((index + phases.length) % phases.length);
  };

  // Auto-advance the carousel; restarts whenever activePhase changes,
  // so a manual click resets the timer instead of fighting it.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePhase((prev) => (prev + 1) % phases.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [activePhase]);

  const phase = phases[activePhase];

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/degreelabs-logo.png"
              alt="DegreeLabs — Learn. Solve. Grow."
              width={220}
              height={64}
              priority
              className="h-11 w-auto"
            />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-20 pt-20 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          DegreeLabs Impact Fellowship
        </div>

        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Learn by solving{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            what matters.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">
          A fellowship where students take on real company challenges, build
          solutions with mentor guidance, and turn proof of work into
          opportunity.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* About */}
      <section className="mx-auto max-w-3xl px-4 pb-20 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-indigo-400">
          About DegreeLabs
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          What DegreeLabs is
        </h2>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <p className="text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
            DegreeLabs connects students with real companies and real
            problems to solve. Instead of theory alone, you work in a small
            team, guided by an industry mentor, to understand a business
            challenge and build something a company can actually use —
            turning what you learn into proof you can show.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-indigo-400">How it works</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          Three simple phases
        </h2>

        <div
          className="relative mt-6 overflow-hidden rounded-2xl border border-white/20 p-8 shadow-xl transition-all duration-700 sm:p-10"
          style={{ background: phase.background }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
            {phase.label}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {phase.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-indigo-200/80">
            {phase.tagline}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-400">
            {phase.description}
          </p>

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              {phases.map((p, index) => (
                <button
                  key={p.title}
                  onClick={() => goToPhase(index)}
                  aria-label={`Go to ${p.title}`}
                  aria-current={index === activePhase}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === activePhase
                      ? `w-8 ${p.indicator}`
                      : `w-3 ${p.indicator} opacity-30 hover:opacity-60`
                    }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => goToPhase(activePhase - 1)}
                aria-label="Previous phase"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPhase(activePhase + 1)}
                aria-label="Next phase"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Image
            src="/brand/degreelabs-logo.png"
            alt="DegreeLabs — Learn. Solve. Grow."
            width={150}
            height={38}
            className="h-8 w-auto opacity-90"
          />
          <p className="text-xs text-slate-500">
            © 2026 DegreeLabs. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}