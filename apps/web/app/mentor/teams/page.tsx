"use client";

import { useEffect, useState } from "react";
import { fetchMentors, fetchMentorAssignments, fetchProjectAssignments } from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { Mentor, TeamMentorAssignment, TeamProjectAssignment } from "@/types/fellowship";
import { UsersRound, Building2, FolderGit2, CheckCircle2 } from "lucide-react";

export default function MentorTeamsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [assignments, setAssignments] = useState<TeamMentorAssignment[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<TeamProjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const mList = await fetchMentors({ status: "active" });
      setMentors(mList);
      if (mList.length > 0) {
        setSelectedMentor(mList[0]);
        const [mAssigns, pAssigns] = await Promise.all([
          fetchMentorAssignments({ mentor_id: mList[0].id, status: "active" }),
          fetchProjectAssignments({ status: "active" }),
        ]);
        setAssignments(mAssigns);
        setProjectAssignments(pAssigns);
      }
    } catch (err) {
      console.error("Failed to load mentor teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMentorChange = async (mentorId: string) => {
    const found = mentors.find((m) => m.id === mentorId) || null;
    setSelectedMentor(found);
    if (found) {
      const mAssigns = await fetchMentorAssignments({ mentor_id: found.id, status: "active" });
      setAssignments(mAssigns);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assigned Teams</h1>
          <p className="text-sm text-slate-600">
            Deep dive into the teams you are currently advising.
          </p>
        </div>

        {mentors.length > 0 && (
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
        <div className="p-8 text-center text-slate-500 text-sm">Loading teams...</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UsersRound className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No teams assigned yet</h3>
          <p className="mt-1 text-xs text-slate-500">You will be notified when teams are assigned to your roster.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {assignments.map((a) => {
            const teamProject = projectAssignments.find((p) => p.team_id === a.team_id);
            return (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{a.team_name || "Fellowship Team"}</h2>
                    <p className="text-xs text-slate-500">Mentorship Active since {new Date(a.assigned_at).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Active
                  </span>
                </div>

                {/* Assigned Project Card */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <FolderGit2 className="h-4 w-4 text-slate-500" />
                    <span>Company Project:</span>
                  </div>
                  {teamProject ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{teamProject.project_title}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{teamProject.company_name || "Partner Company"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No company project assigned yet.</p>
                  )}
                </div>

                {a.notes && (
                  <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60">
                    <strong>Mentorship Focus:</strong> {a.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
