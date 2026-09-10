"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UsersRound,
  Target,
  FileText,
  UserRound,
  Briefcase,
  FolderGit2,
  CalendarDays,
  ArrowRight,
  PlusCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { fetchStudents } from "@/lib/api/students";
import { fetchTeams } from "@/lib/api/teams";
import { fetchChallenges } from "@/lib/api/challenges";
import { fetchSubmissions } from "@/lib/api/submissions";
import { fetchCohorts } from "@/lib/api/cohorts";
import { fetchMentors, fetchCompanies, fetchProjects } from "@/lib/api/fellowship";
import { Cohort, Student, Submission } from "@/types/fellowship";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    teams: 0,
    challenges: 0,
    submissions: 0,
    mentors: 0,
    companies: 0,
    projects: 0,
  });
  const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          studentsRes,
          teamsRes,
          challengesRes,
          submissionsRes,
          cohortsRes,
          mentorsRes,
          companiesRes,
          projectsRes,
        ] = await Promise.allSettled([
          fetchStudents(),
          fetchTeams(),
          fetchChallenges(),
          fetchSubmissions(),
          fetchCohorts(),
          fetchMentors(),
          fetchCompanies(),
          fetchProjects(),
        ]);

        const students = studentsRes.status === "fulfilled" ? studentsRes.value : [];
        const teams = teamsRes.status === "fulfilled" ? teamsRes.value : [];
        const challenges = challengesRes.status === "fulfilled" ? challengesRes.value : [];
        const submissions = submissionsRes.status === "fulfilled" ? submissionsRes.value : [];
        const cohorts = cohortsRes.status === "fulfilled" ? cohortsRes.value : [];
        const mentors = mentorsRes.status === "fulfilled" ? mentorsRes.value : [];
        const companies = companiesRes.status === "fulfilled" ? companiesRes.value : [];
        const projects = projectsRes.status === "fulfilled" ? projectsRes.value : [];

        setStats({
          students: students.length,
          teams: teams.length,
          challenges: challenges.length,
          submissions: submissions.length,
          mentors: mentors.length,
          companies: companies.length,
          projects: projects.length,
        });

        const active = cohorts.find((c) => c.status === "active") || cohorts[0] || null;
        setActiveCohort(active);
        setRecentStudents(students.slice(0, 5));
        setRecentSubmissions(submissions.slice(0, 5));
      } catch (err) {
        console.error("Failed to load admin telemetry", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Admin Telemetry & Command Center
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Fellowship Operations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time control over students, cohorts, teams, mentors, partner companies, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/assignments"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Assignments Center
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading fellowship metrics...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Students"
              value={stats.students}
              description="Provisioned in fellowship"
              href="/admin/students"
            />
            <StatCard
              icon={UsersRound}
              label="Active Teams"
              value={stats.teams}
              description="Formed project squads"
              href="/admin/teams"
            />
            <StatCard
              icon={Target}
              label="Challenges"
              value={stats.challenges}
              description="Industry problem tracks"
              href="/admin/challenges"
            />
            <StatCard
              icon={FileText}
              label="Submissions"
              value={stats.submissions}
              description="Deliverables turned in"
              href="/admin/submissions"
            />
          </div>

          {/* Secondary Telemetry */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SecondaryMetricCard
              icon={UserRound}
              label="Mentors Roster"
              count={stats.mentors}
              href="/admin/mentors"
            />
            <SecondaryMetricCard
              icon={Briefcase}
              label="Partner Companies"
              count={stats.companies}
              href="/admin/companies"
            />
            <SecondaryMetricCard
              icon={FolderGit2}
              label="Industry Projects"
              count={stats.projects}
              href="/admin/projects"
            />
          </div>

          {/* Active Cohort Status */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  {activeCohort ? "Active Cohort" : "Cohort Status"}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {activeCohort ? activeCohort.name : "No active cohort detected"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeCohort
                    ? `Academic Year: ${activeCohort.academic_year} | Running from ${new Date(
                        activeCohort.start_date
                      ).toLocaleDateString()} to ${new Date(
                        activeCohort.end_date
                      ).toLocaleDateString()}`
                    : "Create a cohort to begin enrolling students and scheduling sessions."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/cohorts"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <BookOpen className="h-4 w-4" />
                  Manage Cohorts
                </Link>
                <Link
                  href="/admin/sessions"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <CalendarDays className="h-4 w-4" />
                  Cohort Sessions
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Command Actions */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Operational Workflows
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Instant navigation
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ActionCard
                title="Provision Students"
                description="Enroll university candidates, setup auth credentials, and manage profiles."
                href="/admin/students"
                badge="Students"
              />
              <ActionCard
                title="Team Management"
                description="Create student squads, allocate team leaders, and manage roster seats."
                href="/admin/teams"
                badge="Squads"
              />
              <ActionCard
                title="Assignments Matrix"
                description="Pair teams with mentors and sponsor company projects with validation."
                href="/admin/assignments"
                badge="Workflow"
              />
              <ActionCard
                title="Curriculum & Sessions"
                description="Generate AI discover curriculum, schedule weekly workshops and tasks."
                href="/admin/sessions"
                badge="Education"
              />
              <ActionCard
                title="Industry Challenges"
                description="Curate company problem statements, expected deliverables, and rubrics."
                href="/admin/challenges"
                badge="Tracks"
              />
              <ActionCard
                title="Executive Reports"
                description="Analyze fellowship health, team completion velocity, and mentor reviews."
                href="/admin/reports"
                badge="Analytics"
              />
            </div>
          </section>

          {/* Recent Activity Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Newly Provisioned Students */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Students
                </h3>
                <Link
                  href="/admin/students"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentStudents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No students provisioned yet.
                  </p>
                ) : (
                  recentStudents.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {s.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {s.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Submissions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Deliverables
                </h3>
                <Link
                  href="/admin/submissions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentSubmissions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No submissions recorded yet.
                  </p>
                ) : (
                  recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Submission #{sub.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Status: {sub.status}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-700 ring-1 ring-inset ring-slate-200 group-hover:bg-slate-900 group-hover:text-white transition">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </Link>
  );
}

function SecondaryMetricCard({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-slate-900">{count}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {badge}
        </span>
        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </Link>
  );
}