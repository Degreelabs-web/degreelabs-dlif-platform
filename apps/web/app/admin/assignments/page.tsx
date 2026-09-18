"use client";

import { useEffect, useState } from "react";
import {
  assignCompanyToTeam,
  assignMentorToProject,
  assignProjectToTeam,
  fetchCompanies,
  fetchMentors,
  fetchProjectAssignments,
  fetchProjects,
  unassignMentorFromProject,
  unassignProjectFromTeam,
} from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { Company, Mentor, Project, TeamProjectAssignment } from "@/types/fellowship";
import { Building2, FolderGit2, Trash2, UserRound, Link2, Sparkles } from "lucide-react";

interface SimpleTeam {
  id: string;
  name: string;
  cohort_id: string;
  company_id?: string | null;
  company_name?: string | null;
}

type AssignmentTab = "team_company" | "mentor_project" | "team_project";

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<AssignmentTab>("team_company");
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<SimpleTeam[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<TeamProjectAssignment[]>([]);

  // Forms
  const [companyForm, setCompanyForm] = useState({ team_id: "", company_id: "" });
  const [mentorProjectForm, setMentorProjectForm] = useState({ project_id: "", mentor_id: "" });
  const [teamProjectForm, setTeamProjectForm] = useState({ team_id: "", project_id: "", notes: "" });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [teamsData, companiesData, mentorsData, projectsData, projectAssigns] = await Promise.all([
        apiClient<SimpleTeam[]>("/teams"),
        fetchCompanies(),
        fetchMentors(),
        fetchProjects(),
        fetchProjectAssignments({ status: "active" }),
      ]);
      setTeams(teamsData);
      setCompanies(companiesData);
      setMentors(mentorsData);
      setProjects(projectsData);
      setProjectAssignments(projectAssigns.filter((a) => a.status === "active"));
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

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // ================= 1. Team -> Company Handlers =================

  const handleAssignCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await assignCompanyToTeam(companyForm.team_id, companyForm.company_id);
      setCompanyForm({ team_id: "", company_id: "" });
      flashSuccess("Company assigned to team successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the company.");
    }
  };

  const handleUnassignCompany = async (team: SimpleTeam) => {
    if (!window.confirm(`Remove company assignment from "${team.name}"?`)) return;
    try {
      setError("");
      await assignCompanyToTeam(team.id, null);
      flashSuccess("Company unassigned from team.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove company assignment.");
    }
  };

  // ================= 2. Mentor -> Project Handlers =================

  const handleAssignMentorToProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await assignMentorToProject(mentorProjectForm.project_id, mentorProjectForm.mentor_id);
      setMentorProjectForm({ project_id: "", mentor_id: "" });
      flashSuccess("Mentor assigned to project. Any teams assigned to this project will inherit this mentor.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the mentor to the project.");
    }
  };

  const handleUnassignMentorFromProject = async (project: Project) => {
    if (!window.confirm(`Remove ${project.mentor_name || "the mentor"} from project "${project.title}"?`)) return;
    try {
      setError("");
      await unassignMentorFromProject(project.id);
      flashSuccess("Mentor removed from project.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove mentor from project.");
    }
  };

  // ================= 3. Team -> Project Handlers =================

  const handleAssignProjectToTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      await assignProjectToTeam({
        team_id: teamProjectForm.team_id,
        project_id: teamProjectForm.project_id,
        notes: teamProjectForm.notes || undefined,
      });
      setTeamProjectForm({ team_id: "", project_id: "", notes: "" });
      flashSuccess("Project assigned to team. Team has automatically inherited the project's mentor.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the project.");
    }
  };

  const handleUnassignProjectFromTeam = async (assignmentId: string) => {
    if (!window.confirm("Remove this project from the team? The team's project-derived mentor will also be unassigned.")) return;
    try {
      setError("");
      await unassignProjectFromTeam(assignmentId);
      flashSuccess("Project removed from team.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the project assignment.");
    }
  };

  const projectFor = (projectId: string) => projects.find((p) => p.id === projectId);
  const teamFor = (teamId: string) => teams.find((t) => t.id === teamId);
  const companyFor = (companyId?: string | null) => companies.find((c) => c.id === companyId);

  // Filter projects by team's assigned company (prioritizes matching company)
  const selectedTeam = teams.find((t) => t.id === teamProjectForm.team_id);
  const filteredProjects = selectedTeam?.company_id
    ? [
        ...projects.filter((p) => p.company_id === selectedTeam.company_id),
        ...projects.filter((p) => p.company_id !== selectedTeam.company_id),
      ]
    : projects;

  const selectedProjectBrief = projects.find((p) => p.id === teamProjectForm.project_id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Admin Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments Command Center</h1>
        <p className="text-sm text-slate-600">
          Streamlined fellowship workflow: pair teams with sponsor companies, assign mentors to projects, and assign projects to teams. Team &amp; mentor assignment happens via the project.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex max-w-full overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setActiveTab("team_company")}
          className={`shrink-0 border-b-2 px-5 py-3 text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "team_company"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4" />
          1. Team &rarr; Company
        </button>

        <button
          onClick={() => setActiveTab("mentor_project")}
          className={`shrink-0 border-b-2 px-5 py-3 text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "mentor_project"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserRound className="h-4 w-4" />
          2. Mentor &rarr; Project
        </button>

        <button
          onClick={() => setActiveTab("team_project")}
          className={`shrink-0 border-b-2 px-5 py-3 text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "team_project"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          3. Team &rarr; Project
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading assignments...</div>
      ) : activeTab === "team_company" ? (
        /* ==================== TAB 1: TEAM -> COMPANY ==================== */
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Building2 className="h-4 w-4 text-slate-700" />
              Assign Company to Team
            </h2>
            <p className="text-xs text-slate-500">
              Link each fellowship team to their sponsoring partner company.
            </p>
            <form onSubmit={handleAssignCompany} className="space-y-3 text-sm">
              <label className="block text-xs font-medium text-slate-700">
                Select Team
                <select
                  required
                  value={companyForm.team_id}
                  onChange={(e) => setCompanyForm({ ...companyForm, team_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.company_name ? `(Current: ${team.company_name})` : "(Unassigned)"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700">
                Select Sponsoring Company
                <select
                  required
                  value={companyForm.company_id}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.industry || "Partner"})
                    </option>
                  ))}
                </select>
              </label>

              <button className="w-full rounded-lg bg-slate-900 px-3 py-2.5 font-semibold text-white hover:bg-slate-800 transition">
                Assign Company
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Active Team Sponsor Companies</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Sponsor Company</th>
                    <th className="px-4 py-3">Industry</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No teams found.
                      </td>
                    </tr>
                  ) : (
                    teams.map((team) => {
                      const comp = companyFor(team.company_id);
                      return (
                        <tr key={team.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{team.name}</td>
                          <td className="px-4 py-3">
                            {comp ? (
                              <span className="font-medium text-slate-800">{comp.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">No company assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{comp?.industry || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            {team.company_id && (
                              <button
                                onClick={() => void handleUnassignCompany(team)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : activeTab === "mentor_project" ? (
        /* ==================== TAB 2: MENTOR -> PROJECT ==================== */
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <UserRound className="h-4 w-4 text-slate-700" />
              Assign Mentor to Project
            </h2>
            <p className="text-xs text-slate-500">
              Pair an industry specialist to supervise a specific project brief. Teams assigned to this project will automatically inherit this mentor.
            </p>
            <form onSubmit={handleAssignMentorToProject} className="space-y-3 text-sm">
              <label className="block text-xs font-medium text-slate-700">
                Select Project Brief
                <select
                  required
                  value={mentorProjectForm.project_id}
                  onChange={(e) => setMentorProjectForm({ ...mentorProjectForm, project_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} ({project.company_name || "Company"}{project.mentor_name ? ` — Current: ${project.mentor_name}` : " — No mentor"})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium text-slate-700">
                Select Industry Mentor
                <select
                  required
                  value={mentorProjectForm.mentor_id}
                  onChange={(e) => setMentorProjectForm({ ...mentorProjectForm, mentor_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Mentor...</option>
                  {mentors
                    .filter((mentor) => mentor.status === "active")
                    .map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.full_name} ({mentor.company_name || "Industry Specialist"})
                      </option>
                    ))}
                </select>
              </label>

              <button className="w-full rounded-lg bg-slate-900 px-3 py-2.5 font-semibold text-white hover:bg-slate-800 transition">
                Assign Mentor to Project
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Project Mentor Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Project Brief</th>
                    <th className="px-4 py-3">Sponsoring Company</th>
                    <th className="px-4 py-3">Assigned Mentor</th>
                    <th className="px-4 py-3">Linked Teams</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No projects available.
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      const linkedTeamCount = projectAssignments.filter(
                        (a) => a.project_id === project.id && a.status === "active"
                      ).length;
                      return (
                        <tr key={project.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{project.title}</td>
                          <td className="px-4 py-3 text-slate-600">{project.company_name || "—"}</td>
                          <td className="px-4 py-3">
                            {project.mentor_name ? (
                              <span className="font-medium text-slate-800">{project.mentor_name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Link2 className="h-4 w-4 text-slate-400" />
                              {linkedTeamCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {project.mentor_id && (
                              <button
                                onClick={() => void handleUnassignMentorFromProject(project)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* ==================== TAB 3: TEAM -> PROJECT ==================== */
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <FolderGit2 className="h-4 w-4 text-slate-700" />
              Assign Project to Team
            </h2>
            <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-start gap-1.5 border border-emerald-100">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Automatic Mentor Inheritance:</strong> The team will automatically receive the dedicated mentor assigned to this project.
              </span>
            </div>

            <form onSubmit={handleAssignProjectToTeam} className="space-y-3 text-sm">
              <label className="block text-xs font-medium text-slate-700">
                Select Team
                <select
                  required
                  value={teamProjectForm.team_id}
                  onChange={(e) => setTeamProjectForm({ ...teamProjectForm, team_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.company_name ? `(${team.company_name})` : "(No sponsor)"}
                    </option>
                  ))}
                </select>
              </label>

              {selectedTeam?.company_name && (
                <div className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Team Sponsor: <strong>{selectedTeam.company_name}</strong></span>
                </div>
              )}

              <label className="block text-xs font-medium text-slate-700">
                Select Project Brief
                <select
                  required
                  value={teamProjectForm.project_id}
                  onChange={(e) => setTeamProjectForm({ ...teamProjectForm, project_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Project...</option>
                  {filteredProjects.map((project) => {
                    const isMatchedCompany = selectedTeam?.company_id === project.company_id;
                    const mentorText = project.mentor_name ? ` | Mentor: ${project.mentor_name}` : " | No mentor";
                    return (
                      <option key={project.id} value={project.id}>
                        {isMatchedCompany ? "★ " : ""}{project.title} ({project.company_name || "Company"}{mentorText})
                      </option>
                    );
                  })}
                </select>
              </label>

              {selectedProjectBrief && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                  <div className="font-semibold text-slate-800">{selectedProjectBrief.title}</div>
                  <div className="text-slate-600">Company: {selectedProjectBrief.company_name || "—"}</div>
                  <div className="text-slate-600">
                    Project Mentor:{" "}
                    {selectedProjectBrief.mentor_name ? (
                      <span className="font-medium text-emerald-700">{selectedProjectBrief.mentor_name}</span>
                    ) : (
                      <span className="text-amber-600 font-medium">None (assign in Step 2 if needed)</span>
                    )}
                  </div>
                </div>
              )}

              <label className="block text-xs font-medium text-slate-700">
                Notes (optional)
                <textarea
                  value={teamProjectForm.notes}
                  onChange={(e) => setTeamProjectForm({ ...teamProjectForm, notes: e.target.value })}
                  placeholder="Milestone goals or track details..."
                  className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-2 focus:border-slate-900 focus:outline-none"
                />
              </label>

              <button className="w-full rounded-lg bg-slate-900 px-3 py-2.5 font-semibold text-white hover:bg-slate-800 transition">
                Assign Project to Team
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Active Team Projects</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Inherited Project Mentor</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No active project assignments.
                      </td>
                    </tr>
                  ) : (
                    projectAssignments.map((assignment) => {
                      const project = projectFor(assignment.project_id);
                      const team = teamFor(assignment.team_id);
                      return (
                        <tr key={assignment.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{team?.name || "Unknown team"}</td>
                          <td className="px-4 py-3">{project?.title || "Unknown project"}</td>
                          <td className="px-4 py-3">{project?.company_name || "—"}</td>
                          <td className="px-4 py-3">
                            {project?.mentor_name ? (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                <UserRound className="h-3.5 w-3.5 text-emerald-600" />
                                {project.mentor_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => void handleUnassignProjectFromTeam(assignment.id)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
