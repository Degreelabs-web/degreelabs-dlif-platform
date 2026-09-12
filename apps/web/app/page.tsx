import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";

const journey = [
  {
    label: "Discover",
    description: "Learn through real industry challenges.",
  },
  {
    label: "Validate",
    description: "Build and refine with expert mentors.",
  },
  {
    label: "Grow",
    description: "Turn proof of work into opportunity.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-brand-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-500/15 blur-3xl" />

      <header className="relative z-20 border-b border-white/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center rounded-xl">
            <DegreeLabsLogo priority />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-950/10 hover:-translate-y-0.5 hover:bg-brand-600"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Build real capability before graduation
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-slate-900 sm:text-6xl lg:text-7xl">
            Learn by solving
            <span className="block bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
              what matters.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            One connected workspace for students, mentors, institutions, and
            industry partners to move from real-world challenges to credible
            proof of work.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/login?role=student"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-500/20 hover:-translate-y-0.5"
            >
              <UsersRound className="h-4 w-4" />
              Enter student portal
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login?role=mentor"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700"
            >
              <UserRound className="h-4 w-4" />
              Mentor portal
            </Link>

            <Link
              href="/login?role=admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin portal
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Mentor guided
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Industry validated
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Portfolio ready
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-5 rounded-[2.25rem] bg-gradient-to-br from-brand-300/30 to-brand-600/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-blue-950/25 sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
                  Your growth pathway
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Discover → Validate → Grow
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-300 ring-1 ring-white/10">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>

            <div className="relative mt-8 space-y-3">
              {journey.map((stage, index) => (
                <div
                  key={stage.label}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-extrabold text-white shadow-lg shadow-blue-950/20">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{stage.label}</h3>
                    <p className="mt-0.5 text-sm text-blue-100/65">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 p-[1px]">
              <div className="rounded-[15px] bg-slate-900/90 px-4 py-3 text-center text-sm font-semibold text-blue-50">
                Capability that can be seen, reviewed, and trusted.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
