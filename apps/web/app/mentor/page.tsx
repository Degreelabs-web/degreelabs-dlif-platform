"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMentors, fetchMentorAssignments, fetchProjects } from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { getStoredUser } from "@/lib/api/auth";
import { Mentor, TeamMentorAssignment, Project } from "@/types/fellowship";
import { UsersRound, Users, FolderGit2, FileText, CheckCircle2, ArrowRight } from "lucide-react";

export default function MentorDashboard() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [assignments, setAssignments] = useState<TeamMentorAssignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      const [mList, pList] = await Promise.all([
        fetchMentors({ status: "active" }),
        fetchProjects(),
      ]);
      setMentors(mList);
      if (mList.length > 0) {
        const currentMentor = (user ? mList.find((m) => m.user_id === user.id) : null) || mList[0];
        setSelectedMentor(currentMentor);
        const mAssignments = await fetchMentorAssignments({ mentor_id: currentMentor.id, status: "active" });
        setAssignments(mAssignments);
      }
      setProjects(pList);
    } catch (err) {
      console.error("Failed to load mentor dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  const handleMentorChange = async (mentorId: string) => {
    const found = mentors.find((m) => m.id === mentorId) || null;
    setSelectedMentor(found);
    if (found) {
      const mAssignments = await fetchMentorAssignments({ mentor_id: found.id, status: "active" });
      setAssignments(mAssignments);
    }
  };

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

        {/* Mentor Switcher (Only visible to admin simulating/inspecting portals) */}
        {isAdmin && mentors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Viewing as:</span>
            <select
              value={selectedMentor?.id || ""}
              onChange={(e) => handleMentorChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
            >
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.company_name || "Mentor"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading mentor workspace...</div>
      ) : !selectedMentor ? (
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
              <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
              <p className="text-xs text-slate-500">Active fellowship pods</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Students Guided</span>
                <Users className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{assignments.length * 4}</p>
              <p className="text-xs text-slate-500">Across assigned teams</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Supervised Projects</span>
                <FolderGit2 className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
              <p className="text-xs text-slate-500">Active company briefs</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-medium uppercase tracking-wider">Pending Reviews</span>
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-amber-600">2</p>
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

            {assignments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No teams are currently assigned to your mentorship roster. Contact fellowship admin for allocations.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{a.team_name || "Team"}</h3>
                        <p className="text-xs text-slate-500">Assigned: {new Date(a.assigned_at).toLocaleDateString()}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {a.status}
                      </span>
                    </div>

                    {a.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {a.notes}
                      </p>
                    )}

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
