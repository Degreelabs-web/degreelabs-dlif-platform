"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMentorPortalContext } from "@/lib/api/fellowship";
import { MentorPortalContext } from "@/types/fellowship";
import { UsersRound, Users, FolderGit2, FileText, ArrowRight, Sparkles } from "lucide-react";

export default function MentorDashboard() {
  const [context, setContext] = useState<MentorPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setContext(await fetchMentorPortalContext());
    } catch (err) {
      console.error("Failed to load mentor dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-sm">
              <Sparkles className="h-3 w-3 text-sky-400" />
              Mentor Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Fellowship Guidance Dashboard
          </h1>
          <p className="mt-1.5 text-base text-slate-600 max-w-2xl leading-relaxed">
            Monitor assigned teams, track company project milestones, and review student deliverables.
          </p>
        </div>

        {context?.mentor && (
          <div className="card-custom !p-4 text-right shrink-0">
            <p className="font-bold text-slate-900 text-base">{context.mentor.full_name}</p>
            <p className="text-sm text-slate-500">{context.mentor.company_name || "DegreeLabs Mentor"}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading mentor workspace...</div>
      ) : !context ? (
        <div className="card-custom p-12 text-center border-dashed border-slate-300">
          <UsersRound className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No active mentors found</h3>
          <p className="mt-1 text-sm text-slate-500">Mentors can be provisioned in the Admin Portal.</p>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Assigned Teams",
                value: context.stats.teams_count,
                sub: "Active fellowship pods",
                icon: UsersRound,
                color: "text-sky-600",
                bg: "bg-sky-50",
              },
              {
                label: "Students Guided",
                value: context.stats.students_count,
                sub: "Across assigned teams",
                icon: Users,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Supervised Projects",
                value: context.teams.filter((t) => t.project).length,
                sub: "Active company briefs",
                icon: FolderGit2,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Pending Reviews",
                value: context.stats.pending_reviews_count,
                sub: "Submissions awaiting rubric",
                icon: FileText,
                color: "text-amber-600",
                bg: "bg-amber-50",
                highlight: true,
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, highlight }) => (
              <div key={label} className="card-custom space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-extrabold ${highlight ? "text-amber-600" : "text-slate-900"}`}>
                  {value}
                </p>
                <p className="text-sm text-slate-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Assigned Teams Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Assigned Teams</h2>
              <Link
                href="/mentor/teams"
                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-900 hover:underline"
              >
                View all teams <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {context.teams.length === 0 ? (
              <div className="card-custom p-8 text-center text-sm text-slate-500 border-dashed">
                No teams are currently assigned to your mentorship roster. Contact fellowship admin for allocations.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {context.teams.map((team) => (
                  <div
                    key={team.id}
                    className="card-custom space-y-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{team.name}</h3>
                        <p className="text-sm text-slate-500">{team.cohort_name || "Fellowship cohort"}</p>
                      </div>
                      <span className="status-pill badge-success">
                        {team.members_count} fellow{team.members_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <p className="text-sm font-semibold text-slate-700">Assigned project</p>
                      <p className="mt-1 text-sm text-slate-600">{team.project?.title || "Project assignment pending"}</p>
                      {team.project?.company_name && (
                        <p className="mt-1 text-xs text-slate-500 font-medium">{team.project.company_name}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href="/mentor/teams"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-sky-700 hover:underline"
                      >
                        Team Workspace <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/mentor/reviews"
                        className="text-sm font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        Review Submissions
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
