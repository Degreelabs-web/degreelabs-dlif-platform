export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-slate-500">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Fellowship Overview
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Manage students, cohorts, teams, challenges, sessions and
          fellowship activity.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Students"
          value="0"
          description="Currently enrolled"
        />

        <StatCard
          label="Teams"
          value="0"
          description="Active teams"
        />

        <StatCard
          label="Challenges"
          value="0"
          description="Available challenges"
        />

        <StatCard
          label="Submissions"
          value="0"
          description="Total submissions"
        />
      </div>

      {/* Current Cohort */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Current Cohort
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              No active cohort
            </h2>
          </div>

          <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            Create Cohort
          </button>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Quick Actions
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Add Students"
            description="Import or add students to the fellowship."
          />

          <ActionCard
            title="Create Team"
            description="Create a team and assign students."
          />

          <ActionCard
            title="Assign Challenge"
            description="Assign an industry challenge to a team."
          />
        </div>
      </section>

      {/* Activity */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent Activity
        </h2>

        <div className="mt-6 rounded-lg bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            No activity yet.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-sm">
      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </button>
  );
}