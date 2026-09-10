"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  UsersRound,
  UserRound,
  FolderGit2,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";
import { fetchStudents } from "@/lib/api/students";
import { fetchTeams } from "@/lib/api/teams";
import { fetchCohorts } from "@/lib/api/cohorts";
import { fetchSubmissions } from "@/lib/api/submissions";
import { fetchInstitutions } from "@/lib/api/institutions";
import {
  fetchMentors,
  fetchProjects,
  fetchMentorAssignments,
  fetchProjectAssignments,
} from "@/lib/api/fellowship";
import { Cohort, Institution } from "@/types/fellowship";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeams: 0,
    totalMentors: 0,
    totalProjects: 0,
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    mentorCoveragePct: 0,
    projectCoveragePct: 0,
    approvalRatePct: 0,
  });
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    async function loadReportMetrics() {
      try {
        setLoading(true);
        const [
          studentsRes,
          teamsRes,
          mentorsRes,
          projectsRes,
          submissionsRes,
          mentorAssignmentsRes,
          projectAssignmentsRes,
          cohortsRes,
          institutionsRes,
        ] = await Promise.allSettled([
          fetchStudents(),
          fetchTeams(),
          fetchMentors(),
          fetchProjects(),
          fetchSubmissions(),
          fetchMentorAssignments({ status: "active" }),
          fetchProjectAssignments({ status: "active" }),
          fetchCohorts(),
          fetchInstitutions(),
        ]);

        const students = studentsRes.status === "fulfilled" ? studentsRes.value : [];
        const teams = teamsRes.status === "fulfilled" ? teamsRes.value : [];
        const mentors = mentorsRes.status === "fulfilled" ? mentorsRes.value : [];
        const projects = projectsRes.status === "fulfilled" ? projectsRes.value : [];
        const submissions = submissionsRes.status === "fulfilled" ? submissionsRes.value : [];
        const mentorAssignments =
          mentorAssignmentsRes.status === "fulfilled" ? mentorAssignmentsRes.value : [];
        const projectAssignments =
          projectAssignmentsRes.status === "fulfilled" ? projectAssignmentsRes.value : [];
        const cohortsData = cohortsRes.status === "fulfilled" ? cohortsRes.value : [];
        const institutionsData =
          institutionsRes.status === "fulfilled" ? institutionsRes.value : [];

        const totalTeams = teams.length;
        const accepted = submissions.filter((s) => s.status === "accepted").length;

        const mentorCoverage =
          totalTeams > 0 ? Math.round((mentorAssignments.length / totalTeams) * 100) : 0;
        const projectCoverage =
          totalTeams > 0 ? Math.round((projectAssignments.length / totalTeams) * 100) : 0;
        const approvalRate =
          submissions.length > 0
            ? Math.round((accepted / submissions.length) * 100)
            : 0;

        setMetrics({
          totalStudents: students.length,
          totalTeams,
          totalMentors: mentors.length,
          totalProjects: projects.length,
          totalSubmissions: submissions.length,
          acceptedSubmissions: accepted,
          mentorCoveragePct: Math.min(mentorCoverage, 100),
          projectCoveragePct: Math.min(projectCoverage, 100),
          approvalRatePct: approvalRate,
        });

        setCohorts(cohortsData);
        setInstitutions(institutionsData);
      } catch (err) {
        console.error("Failed to load report metrics", err);
      } finally {
        setLoading(false);
      }
    }

    loadReportMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Executive Telemetry
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Fellowship Analytics & Reports
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Comprehensive health indicators across enrollment, team formation, mentorship coverage, and deliverable quality.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Computing fellowship health data...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Key Health KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Mentorship Coverage"
              value={`${metrics.mentorCoveragePct}%`}
              description="Active teams with paired industry mentor"
              progress={metrics.mentorCoveragePct}
              color="bg-indigo-600"
            />
            <KpiCard
              label="Project Allocation Rate"
              value={`${metrics.projectCoveragePct}%`}
              description="Active squads with company sponsor project"
              progress={metrics.projectCoveragePct}
              color="bg-emerald-600"
            />
            <KpiCard
              label="Deliverable Approval Rate"
              value={`${metrics.approvalRatePct}%`}
              description="Submissions approved on first review"
              progress={metrics.approvalRatePct}
              color="bg-amber-600"
            />
          </div>

          {/* Aggregate Telemetry Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Fellowship Volume Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">
                Participation Volume
              </h3>
              <p className="text-xs text-slate-500">
                Active participants and resource entities
              </p>

              <div className="mt-6 space-y-4">
                <MetricRow
                  icon={Users}
                  label="Enrolled Students"
                  value={metrics.totalStudents}
                />
                <MetricRow
                  icon={UsersRound}
                  label="Formed Squads / Teams"
                  value={metrics.totalTeams}
                />
                <MetricRow
                  icon={UserRound}
                  label="Registered Industry Mentors"
                  value={metrics.totalMentors}
                />
                <MetricRow
                  icon={FolderGit2}
                  label="Sponsor Company Projects"
                  value={metrics.totalProjects}
                />
                <MetricRow
                  icon={FileCheck2}
                  label="Total Deliverables Submitted"
                  value={metrics.totalSubmissions}
                />
              </div>
            </div>

            {/* Quality & Velocity Progress */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">
                Quality & Review Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of deliverable evaluation outcomes
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approved / Accepted
                    </span>
                    <span>{metrics.acceptedSubmissions}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${metrics.approvalRatePct}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1 text-indigo-700">
                      <Clock className="h-3.5 w-3.5" /> Pending / In Review
                    </span>
                    <span>{metrics.totalSubmissions - metrics.acceptedSubmissions}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${100 - metrics.approvalRatePct}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cohort Overview Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Cohorts Health Summary
            </h3>
            <p className="text-xs text-slate-500">
              Batch progress across university partners
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Cohort</th>
                    <th className="px-6 py-3.5">Partner Institution</th>
                    <th className="px-6 py-3.5">Academic Year</th>
                    <th className="px-6 py-3.5">Timeline</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cohorts.map((c) => {
                    const inst = institutions.find((i) => i.id === c.institution_id);
                    return (
                      <tr key={c.id} className="transition hover:bg-slate-50/75">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {c.name}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {inst ? inst.name : "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {c.academic_year}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(c.start_date).toLocaleDateString()} —{" "}
                          {new Date(c.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              c.status === "active"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  description,
  progress,
  color,
}: {
  label: string;
  value: string;
  description: string;
  progress: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-base font-bold text-slate-900">{value}</span>
    </div>
  );
}
