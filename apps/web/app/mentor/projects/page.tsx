"use client";

import { useEffect, useState } from "react";
import { fetchMentors, fetchMentorAssignments, fetchProjectAssignments, fetchProjects } from "@/lib/api/fellowship";
import { Mentor, Project, TeamProjectAssignment } from "@/types/fellowship";
import { FolderGit2, Building2, Calendar, Target, CheckCircle2 } from "lucide-react";

export default function MentorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const mList = await fetchMentors({ status: "active" });
      if (mList.length > 0) {
        const [mAssigns, pAssigns, allProjects] = await Promise.all([
          fetchMentorAssignments({ mentor_id: mList[0].id, status: "active" }),
          fetchProjectAssignments({ status: "active" }),
          fetchProjects(),
        ]);

        const mentoredTeamIds = new Set(mAssigns.map((a) => a.team_id));
        const relevantProjectIds = new Set(
          pAssigns.filter((p) => mentoredTeamIds.has(p.team_id)).map((p) => p.project_id)
        );

        const mentoredProjects = allProjects.filter((p) => relevantProjectIds.has(p.id));
        setProjects(mentoredProjects.length > 0 ? mentoredProjects : allProjects);
      }
    } catch (err) {
      console.error("Failed to load mentor projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Supervised Projects
        </h1>
        <p className="text-sm text-slate-600">
          Industry partner problem statements undertaken by your advised fellowship teams.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No projects supervised yet</h3>
          <p className="mt-1 text-xs text-slate-500">Projects will appear once assigned to your teams.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{p.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{p.company_name || "Partner Company"}</span>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                  {p.difficulty}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p><strong>Description:</strong> {p.description}</p>
                <p><strong>Core Objectives:</strong> {p.objectives}</p>
                <p><strong>Expected Deliverables:</strong> {p.expected_deliverables}</p>
              </div>

              {(p.start_date || p.end_date) && (
                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Timeline: {p.start_date || "TBD"} &rarr; {p.end_date || "TBD"}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
