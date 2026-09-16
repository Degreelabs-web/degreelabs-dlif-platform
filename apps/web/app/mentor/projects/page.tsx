"use client";

import { useEffect, useState } from "react";
import { fetchMentorPortalContext } from "@/lib/api/fellowship";
import { MentorPortalContext } from "@/types/fellowship";
import { Building2, FolderGit2, UsersRound } from "lucide-react";

export default function MentorProjectsPage() {
  const [context, setContext] = useState<MentorPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setContext(await fetchMentorPortalContext());
      } catch (error) {
        console.error("Failed to load supervised projects", error);
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  const projects = (context?.teams ?? []).flatMap((team) =>
    team.project ? [{ ...team.project, teamName: team.name, cohortName: team.cohort_name }] : []
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Supervised Projects</h1>
        <p className="text-sm text-slate-600">Company projects undertaken by your assigned fellowship teams.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading your projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-3 text-sm font-semibold text-slate-900">No projects supervised yet</h2>
          <p className="mt-1 text-xs text-slate-500">Projects will appear after a brief is assigned to one of your teams.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project) => (
            <article key={`${project.id}-${project.teamName}`} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{project.teamName}{project.cohortName ? ` · ${project.cohortName}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
                {project.company_name || "Partner company pending"}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
