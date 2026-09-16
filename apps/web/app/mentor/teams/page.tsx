"use client";

import { useEffect, useState } from "react";
import { fetchMentorPortalContext } from "@/lib/api/fellowship";
import { MentorPortalContext } from "@/types/fellowship";
import { Building2, FolderGit2, UsersRound } from "lucide-react";

export default function MentorTeamsPage() {
  const [context, setContext] = useState<MentorPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        setContext(await fetchMentorPortalContext());
      } catch (error) {
        console.error("Failed to load assigned teams", error);
      } finally {
        setLoading(false);
      }
    }

    void loadTeams();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assigned Teams</h1>
        <p className="text-sm text-slate-600">Teams currently assigned to your mentorship roster.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading your teams...</div>
      ) : !context || context.teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UsersRound className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No teams assigned yet</h2>
          <p className="mt-1 text-xs text-slate-500">You will be notified when a fellowship team is assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {context.teams.map((team) => (
            <article key={team.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{team.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{team.cohort_name || "Fellowship cohort"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {team.members_count} fellow{team.members_count === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <FolderGit2 className="h-4 w-4 text-slate-500" />
                  <span>Assigned project</span>
                </div>
                {team.project ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{team.project.title}</p>
                    {team.project.company_name && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        {team.project.company_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500">Project assignment pending.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
