export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              DegreeLabs
            </h1>
            <p className="text-xs text-slate-500">
              Impact Fellowship
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            DLIF Platform
          </span>
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
            A structured platform for students, mentors, institutions,
            and industry partners to manage the fellowship journey.
          </p>

          <div className="mt-10 flex gap-4">
            <button className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Student Portal
            </button>

            <button className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Admin Portal
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}