"use client";

import { useEffect, useState } from "react";
import { fetchProjects, fetchCompanies, createProject } from "@/lib/api/fellowship";
import { Project, Company } from "@/types/fellowship";
import { FolderGit2, Plus, Building2, Calendar, Target, Users } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    company_id: "",
    title: "",
    description: "",
    objectives: "",
    expected_deliverables: "",
    difficulty: "intermediate",
    max_teams: 3,
    start_date: "",
    end_date: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, compData] = await Promise.all([
        fetchProjects({ search: search || undefined }),
        fetchCompanies(),
      ]);
      setProjects(projData);
      setCompanies(compData);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert("Please select a sponsoring partner company");
      return;
    }
    try {
      await createProject({
        company_id: formData.company_id,
        title: formData.title,
        description: formData.description,
        objectives: formData.objectives,
        expected_deliverables: formData.expected_deliverables,
        difficulty: formData.difficulty,
        max_teams: Number(formData.max_teams),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
      setShowModal(false);
      setFormData({
        company_id: "",
        title: "",
        description: "",
        objectives: "",
        expected_deliverables: "",
        difficulty: "intermediate",
        max_teams: 3,
        start_date: "",
        end_date: "",
      });
      loadData();
    } catch (err) {
      alert("Failed to create project: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fellowship Projects
          </h1>
          <p className="text-sm text-slate-600">
            Real-world problem statements sponsored by partner companies.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by project title or objectives..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No projects found</h3>
          <p className="mt-1 text-xs text-slate-500">Create a project sponsored by an industry partner.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{project.company_name || "Partner Company"}</span>
                  </div>
                </div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                  {project.difficulty}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3">{project.description}</p>

              <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{project.objectives}</span>
                </div>
                {(project.start_date || project.end_date) && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {project.start_date || "TBD"} &rarr; {project.end_date || "TBD"}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Teams: <strong className="text-slate-900">{project.assigned_teams_count}</strong> / {project.max_teams}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">Create Fellowship Project</h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Sponsoring Partner Company</label>
                <select
                  required
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Select a company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telemetry Anomaly Detection Platform"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Description</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Core Objectives</label>
                <textarea
                  required
                  rows={2}
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Expected Deliverables</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. GitHub Repository, Documentation, Demo Video"
                  value={formData.expected_deliverables}
                  onChange={(e) => setFormData({ ...formData, expected_deliverables: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Max Teams Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.max_teams}
                    onChange={(e) => setFormData({ ...formData, max_teams: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
