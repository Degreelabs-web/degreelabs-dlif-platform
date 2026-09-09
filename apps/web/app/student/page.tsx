export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-sm font-medium text-slate-500">
          Student Dashboard
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back 👋
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Continue your DegreeLabs Impact Fellowship journey.
        </p>
      </div>

      {/* Current Journey */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Current Phase
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Discover
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Week 1 · Understand
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            In Progress
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">
              Overall Progress
            </span>

            <span className="font-semibold text-slate-900">
              8%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[8%] rounded-full bg-slate-900" />
          </div>
        </div>
      </section>

      {/* Next Action */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-slate-500">
          Next Action
        </p>

        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Session 1 — Enter the Problem
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Understand the company challenge, identify what you already
          know, and document what you still need to discover.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            Continue Session
          </button>

          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            View Challenge
          </button>
        </div>
      </section>

      {/* Quick Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Team</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Not assigned
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Challenge</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Pending
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Submissions</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            0
          </p>
        </div>
      </div>
    </div>
  );
}