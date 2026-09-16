"use client";

import { useEffect, useState } from "react";
import {
  assignMentorToProject,
  assignProjectToTeam,
  fetchMentors,
  fetchProjectAssignments,
  fetchProjects,
  unassignMentorFromProject,
  unassignProjectFromTeam,
} from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { Mentor, Project, TeamProjectAssignment } from "@/types/fellowship";
import { FolderGit2, Link2, Trash2, UserRound } from "lucide-react";

interface SimpleTeam {
  id: string;
  name: string;
}

type AssignmentTab = "projects" | "mentors";

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<AssignmentTab>("projects");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<SimpleTeam[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<TeamProjectAssignment[]>([]);
  const [projectForm, setProjectForm] = useState({ team_id: "", project_id: "", notes: "" });
  const [mentorForm, setMentorForm] = useState({ project_id: "", mentor_id: "" });
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [teamsData, mentorsData, projectsData, assignmentsData] = await Promise.all([
        apiClient<SimpleTeam[]>("/teams"),
        fetchMentors(),
        fetchProjects(),
        fetchProjectAssignments(),
      ]);
      setTeams(teamsData);
      setMentors(mentorsData);
      setProjects(projectsData);
      setProjectAssignments(assignmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assignment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleAssignProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await assignProjectToTeam({
        team_id: projectForm.team_id,
        project_id: projectForm.project_id,
        notes: projectForm.notes || undefined,
      });
      setProjectForm({ team_id: "", project_id: "", notes: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the project.");
    }
  };

  const handleAssignMentor = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await assignMentorToProject(mentorForm.project_id, mentorForm.mentor_id);
      setMentorForm({ project_id: "", mentor_id: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the mentor.");
    }
  };

  const handleUnassignProject = async (assignmentId: string) => {
    if (!window.confirm("Remove this project from the team? The project-derived mentor assignment will also be removed.")) return;
    try {
      setError("");
      await unassignProjectFromTeam(assignmentId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the project assignment.");
    }
  };

  const handleUnassignMentor = async (project: Project) => {
    if (!window.confirm(`Remove ${project.mentor_name || "the mentor"} from ${project.title}?`)) return;
    try {
      setError("");
      await unassignMentorFromProject(project.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the project mentor.");
    }
  };

  const projectFor = (projectId: string) => projects.find((project) => project.id === projectId);
  const teamFor = (teamId: string) => teams.find((team) => team.id === teamId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Admin Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments Command Center</h1>
        <p className="text-sm text-slate-600">
          Assign a team to a project first, then assign the project mentor. The mentor is automatically linked to every active team on that project.
        </p>
      </div>

      <div className="flex max-w-full overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setActiveTab("projects")}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "projects" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Team &rarr; Project Assignments
        </button>
        <button
          onClick={() => setActiveTab("mentors")}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "mentors" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Mentor &rarr; Project Assignments
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading assignments...</div>
      ) : activeTab === "projects" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><FolderGit2 className="h-4 w-4" />Assign Project to Team</h2>
            <p className="text-xs text-slate-500">A project mentor, if already selected, is automatically assigned to this team.</p>
            <form onSubmit={handleAssignProject} className="space-y-3 text-sm">
              <label className="block text-xs font-medium text-slate-700">Select Team
                <select required value={projectForm.team_id} onChange={(e) => setProjectForm({ ...projectForm, team_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none">
                  <option value="">Choose Team...</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">Select Project
                <select required value={projectForm.project_id} onChange={(e) => setProjectForm({ ...projectForm, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none">
                  <option value="">Choose Project...</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}{project.mentor_name ? ` — ${project.mentor_name}` : " — no mentor"}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">Notes (optional)
                <textarea value={projectForm.notes} onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none" />
              </label>
              <button className="w-full rounded-lg bg-slate-900 px-3 py-2.5 font-semibold text-white hover:bg-slate-800">Assign Project</button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">Active Team Projects</h2></div>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Team</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Project mentor</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
              {projectAssignments.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No active project assignments.</td></tr> : projectAssignments.map((assignment) => {
                const project = projectFor(assignment.project_id); const team = teamFor(assignment.team_id);
                return <tr key={assignment.id}><td className="px-4 py-3 font-medium text-slate-900">{team?.name || "Unknown team"}</td><td className="px-4 py-3">{project?.title || "Unknown project"}</td><td className="px-4 py-3">{project?.company_name || "—"}</td><td className="px-4 py-3">{project?.mentor_name || <span className="text-slate-400">Not assigned</span>}</td><td className="px-4 py-3 text-right"><button onClick={() => void handleUnassignProject(assignment.id)} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" />Remove</button></td></tr>;
              })}
            </tbody></table></div>
          </section>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><UserRound className="h-4 w-4" />Assign Mentor to Project</h2>
            <p className="text-xs text-slate-500">Saving updates the mentor for every active team on the selected project.</p>
            <form onSubmit={handleAssignMentor} className="space-y-3 text-sm">
              <label className="block text-xs font-medium text-slate-700">Select Project
                <select required value={mentorForm.project_id} onChange={(e) => setMentorForm({ ...mentorForm, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none">
                  <option value="">Choose Project...</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}{project.mentor_name ? ` — currently ${project.mentor_name}` : ""}</option>)}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-700">Select Mentor
                <select required value={mentorForm.mentor_id} onChange={(e) => setMentorForm({ ...mentorForm, mentor_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none">
                  <option value="">Choose Mentor...</option>
                  {mentors.filter((mentor) => mentor.status === "active").map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.full_name} ({mentor.company_name || "Industry expert"})</option>)}
                </select>
              </label>
              <button className="w-full rounded-lg bg-slate-900 px-3 py-2.5 font-semibold text-white hover:bg-slate-800">Assign Mentor to Project</button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-base font-semibold text-slate-900">Project Mentor Directory</h2></div>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Project</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Mentor</th><th className="px-4 py-3">Linked teams</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No projects available.</td></tr> : projects.map((project) => {
                const linkedTeamCount = projectAssignments.filter((assignment) => assignment.project_id === project.id).length;
                return <tr key={project.id}><td className="px-4 py-3 font-medium text-slate-900">{project.title}</td><td className="px-4 py-3">{project.company_name || "—"}</td><td className="px-4 py-3">{project.mentor_name || <span className="text-slate-400">Not assigned</span>}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1"><Link2 className="h-4 w-4 text-slate-400" />{linkedTeamCount}</span></td><td className="px-4 py-3 text-right">{project.mentor_id && <button onClick={() => void handleUnassignMentor(project)} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" />Remove</button>}</td></tr>;
              })}
            </tbody></table></div>
          </section>
        </div>
      )}
    </div>
  );
}
