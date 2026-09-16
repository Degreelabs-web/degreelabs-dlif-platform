"use client";

import { useEffect, useState } from "react";
import { fetchMentorPortalContext } from "@/lib/api/fellowship";
import { MentorPortalContext } from "@/types/fellowship";
import { Users } from "lucide-react";

export default function MentorStudentsPage() {
  const [context, setContext] = useState<MentorPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        setContext(await fetchMentorPortalContext());
      } catch (error) {
        console.error("Failed to load assigned student roster", error);
      } finally {
        setLoading(false);
      }
    }

    void loadStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assigned Students Roster</h1>
        <p className="text-sm text-slate-600">Fellows across the teams assigned to your guidance.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading your roster...</div>
      ) : !context || context.teams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No students under guidance</h2>
          <p className="mt-1 text-xs text-slate-500">Students will appear once a team is assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
            You currently guide <strong>{context.stats.students_count}</strong> fellow{context.stats.students_count === 1 ? "" : "s"} across your assigned teams.
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {context.teams.map((team) => (
              <article key={team.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{team.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{team.cohort_name || "Fellowship cohort"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {team.members_count} member{team.members_count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-600">Individual fellow contact details are available only within authorized team workspaces.</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
