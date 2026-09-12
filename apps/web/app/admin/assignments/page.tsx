"use client";

import { useEffect, useState } from "react";
import {
  fetchMentors,
  fetchProjects,
  fetchMentorAssignments,
  fetchProjectAssignments,
  assignMentorToTeam,
  unassignMentorFromTeam,
  assignProjectToTeam,
  unassignProjectFromTeam,
  assignStudentToCohort,
} from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import {
  Mentor,
  Project,
  TeamMentorAssignment,
  TeamProjectAssignment,
} from "@/types/fellowship";
import {
  GitPullRequest,
  UsersRound,
  UserRound,
  FolderGit2,
  CheckCircle2,
  Trash2,
  Plus,
} from "lucide-react";

interface SimpleTeam {
  id: string;
  name: string;
  cohort_id: string;
}

interface SimpleCohort {
  id: string;
  name: string;
}

interface SimpleStudent {
  id: string;
  student_id: string;
  course?: string | null;
}

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<"mentors" | "projects" | "cohorts">("mentors");
  const [loading, setLoading] = useState(true);

  // Data
  const [teams, setTeams] = useState<SimpleTeam[]>([]);
  const [cohorts, setCohorts] = useState<SimpleCohort[]>([]);
  const [students, setStudents] = useState<SimpleStudent[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mentorAssignments, setMentorAssignments] = useState<TeamMentorAssignment[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<TeamProjectAssignment[]>([]);

  // Forms
  const [mentorForm, setMentorForm] = useState({ team_id: "", mentor_id: "", notes: "" });
  const [projectForm, setProjectForm] = useState({ team_id: "", project_id: "", notes: "" });
  const [cohortForm, setCohortForm] = useState({ student_id: "", cohort_id: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        teamsData,
        cohortsData,
        studentsData,
        mentorsData,
        projectsData,
        mAssignData,
        pAssignData,
      ] = await Promise.all([
        apiClient<SimpleTeam[]>("/teams"),
        apiClient<SimpleCohort[]>("/cohorts"),
        apiClient<SimpleStudent[]>("/students"),
        fetchMentors(),
        fetchProjects(),
        fetchMentorAssignments(),
        fetchProjectAssignments(),
      ]);

      setTeams(teamsData);
      setCohorts(cohortsData);
      setStudents(studentsData);
      setMentors(mentorsData);
      setProjects(projectsData);
      setMentorAssignments(mAssignData);
      setProjectAssignments(pAssignData);
    } catch (err) {
      console.error("Failed to load assignment data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignMentorToTeam({
        team_id: mentorForm.team_id,
        mentor_id: mentorForm.mentor_id,
        notes: mentorForm.notes || undefined,
      });
      setMentorForm({ team_id: "", mentor_id: "", notes: "" });
      loadData();
    } catch (err) {
      alert("Assignment failed: " + (err as Error).message);
    }
  };

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignProjectToTeam({
        team_id: projectForm.team_id,
        project_id: projectForm.project_id,
        notes: projectForm.notes || undefined,
      });
      setProjectForm({ team_id: "", project_id: "", notes: "" });
      loadData();
    } catch (err) {
      alert("Assignment failed: " + (err as Error).message);
    }
  };

  const handleAssignCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignStudentToCohort({
        student_id: cohortForm.student_id,
        cohort_id: cohortForm.cohort_id,
      });
      setCohortForm({ student_id: "", cohort_id: "" });
      alert("Student assigned to cohort successfully!");
    } catch (err) {
      alert("Assignment failed: " + (err as Error).message);
    }
  };

  const handleUnassignMentor = async (id: string) => {
    if (!confirm("Are you sure you want to retire this mentor assignment?")) return;
    try {
      await unassignMentorFromTeam(id);
      loadData();
    } catch (err) {
      alert("Failed to unassign: " + (err as Error).message);
    }
  };

  const handleUnassignProject = async (id: string) => {
    if (!confirm("Are you sure you want to drop this project assignment?")) return;
    try {
      await unassignProjectFromTeam(id);
      loadData();
    } catch (err) {
      alert("Failed to unassign: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Admin Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assignments Command Center
        </h1>
        <p className="text-sm text-slate-600">
          Configure multi-way pairings between Students, Cohorts, Teams, Mentors, and Company Projects.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex max-w-full overflow-x-auto border-b border-slate-200">
        <button
          onClick={() => setActiveTab("mentors")}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "mentors"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Team &rarr; Mentor Assignments
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "projects"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Team &rarr; Project & Company Assignments
        </button>
        <button
          onClick={() => setActiveTab("cohorts")}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "cohorts"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Student &rarr; Cohort Assignments
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading assignments...</div>
      ) : activeTab === "mentors" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Assignment Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Assign Mentor to Team
            </h2>
            <p className="text-xs text-slate-500">
              Rule: A team has exactly 1 active mentor. Any previous active assignment will be reassigned.
            </p>
            <form onSubmit={handleAssignMentor} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Select Team</label>
                <select
                  required
                  value={mentorForm.team_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, team_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Select Mentor</label>
                <select
                  required
                  value={mentorForm.mentor_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, mentor_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Mentor...</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.company_name || "Industry Expert"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AI Domain guidance"
                  value={mentorForm.notes}
                  onChange={(e) => setMentorForm({ ...mentorForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Assign Mentor
              </button>
            </form>
          </div>

          {/* Active Assignments Table */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Active Mentor Pairings</h2>
            {mentorAssignments.length === 0 ? (
              <p className="text-xs text-slate-500">No mentor assignments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="pb-2">Team</th>
                      <th className="pb-2">Mentor</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Assigned Date</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mentorAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-medium text-slate-900">{a.team_name || "Team"}</td>
                        <td className="py-2.5 text-slate-700">
                          {a.mentor_name || "Mentor"}
                          {a.mentor_company && (
                            <span className="text-slate-400 block text-[11px]">{a.mentor_company}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              a.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(a.assigned_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-right">
                          {a.status === "active" && (
                            <button
                              onClick={() => handleUnassignMentor(a.id)}
                              className="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Retire
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "projects" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Assignment Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="h-4 w-4" />
              Assign Project to Team
            </h2>
            <p className="text-xs text-slate-500">
              Rule: A team can tackle 1 active company project. Multiple teams can tackle the same project.
            </p>
            <form onSubmit={handleAssignProject} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Select Team</label>
                <select
                  required
                  value={projectForm.team_id}
                  onChange={(e) => setProjectForm({ ...projectForm, team_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Select Company Project</label>
                <select
                  required
                  value={projectForm.project_id}
                  onChange={(e) => setProjectForm({ ...projectForm, project_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Choose Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.company_name}) - Cap: {p.assigned_teams_count}/{p.max_teams}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary capstone allocation"
                  value={projectForm.notes}
                  onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Assign Project
              </button>
            </form>
          </div>

          {/* Active Assignments Table */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Active Project Allocations</h2>
            {projectAssignments.length === 0 ? (
              <p className="text-xs text-slate-500">No project assignments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="pb-2">Team</th>
                      <th className="pb-2">Project</th>
                      <th className="pb-2">Sponsoring Company</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-medium text-slate-900">{a.team_name || "Team"}</td>
                        <td className="py-2.5 text-slate-800">{a.project_title || "Project"}</td>
                        <td className="py-2.5 text-slate-600">{a.company_name || "Company"}</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              a.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {a.status === "active" && (
                            <button
                              onClick={() => handleUnassignProject(a.id)}
                              className="text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Drop
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Assign Student to Cohort
          </h2>
          <p className="text-xs text-slate-500">
            Enrolls an onboarded student into an active academic cohort.
          </p>
          <form onSubmit={handleAssignCohort} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-700">Select Student</label>
              <select
                required
                value={cohortForm.student_id}
                onChange={(e) => setCohortForm({ ...cohortForm, student_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="">Choose Student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} ({s.course || "Fellow"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Select Cohort</label>
              <select
                required
                value={cohortForm.cohort_id}
                onChange={(e) => setCohortForm({ ...cohortForm, cohort_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="">Choose Cohort...</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Assign to Cohort
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
