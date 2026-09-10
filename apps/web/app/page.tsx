import Link from "next/link";
import { ArrowRight, ShieldCheck, UsersRound, UserRound, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">DegreeLabs</h1>
            <p className="text-xs text-slate-500">Impact Fellowship</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
            DegreeLabs Impact Fellowship
          </p>

          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Identify Capability.
            <br />
            Build Proof.
            <br />
            Create Opportunity.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A structured platform for students, mentors, institutions, and industry
            partners to manage the complete fellowship capstone journey.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login?role=student"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <UsersRound className="h-4 w-4" />
              Student Portal
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login?role=mentor"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <UserRound className="h-4 w-4" />
              Mentor Portal
            </Link>

            <Link
              href="/login?role=admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}