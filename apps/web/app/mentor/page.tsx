"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMentorPortalContext } from "@/lib/api/fellowship";
import { MentorPortalContext } from "@/types/fellowship";
import { UsersRound, Users, FolderGit2, FileText, ArrowRight } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fellowship Guidance Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Monitor assigned teams, track company project milestones, and review student deliverables.
          </p>
        </div>

        {context?.mentor && (
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-xs shadow-sm">
            <p className="font-semibold text-slate-900">{context.mentor.full_name}</p>
            <p className="text-slate-500">{context.mentor.company_name || "DegreeLabs Mentor"}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading mentor workspace...</div>
      ) : !context ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UsersRound className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No active mentors found</h3>
          <p className="mt-1 text-xs text-slate-500">Mentors can be provisioned in the Admin Portal.</p>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Assigned Teams</span>
                <UsersRound className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{context.stats.teams_count}</p>
              <p className="text-xs text-slate-500">Active fellowship pods</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Students Guided</span>
                <Users className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{context.stats.students_count}</p>
              <p className="text-xs text-slate-500">Across assigned teams</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Supervised Projects</span>
                <FolderGit2 className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{context.teams.filter((team) => team.project).length}</p>
              <p className="text-xs text-slate-500">Active company briefs</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Pending Reviews</span>
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{context.stats.pending_reviews_count}</p>
              <p className="text-xs text-slate-500">Submissions awaiting rubric</p>
            </div>
          </div>

          {/* Assigned Teams Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Your Assigned Teams</h2>
              <Link
                href="/mentor/teams"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                View all teams <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {context.teams.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No teams are currently assigned to your mentorship roster. Contact fellowship admin for allocations.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {context.teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{team.name}</h3>
                        <p className="text-xs text-slate-500">{team.cohort_name || "Fellowship cohort"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {team.members_count} fellow{team.members_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                      <p className="font-medium text-slate-700">Assigned project</p>
                      <p className="mt-1 text-slate-600">{team.project?.title || "Project assignment pending"}</p>
                      {team.project?.company_name && <p className="mt-1 text-slate-500">{team.project.company_name}</p>}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <Link
                        href={`/mentor/teams`}
                        className="text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        Team Workspace <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Link
                        href={`/mentor/reviews`}
                        className="text-blue-600 font-medium hover:underline"
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
