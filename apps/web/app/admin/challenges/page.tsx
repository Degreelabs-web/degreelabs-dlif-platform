"use client";

import { useEffect, useState } from "react";
import {
  Target,
  PlusCircle,
  Search,
  Building2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { fetchChallenges, createChallenge } from "@/lib/api/challenges";
import { Challenge } from "@/types/fellowship";

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    problem_statement: "",
    expected_outcome: "",
    difficulty: "standard",
    status: "active",
  });

  async function loadData() {
    try {
      setLoading(true);
      const data = await fetchChallenges({
        search: search || undefined,
        difficulty: selectedDifficulty || undefined,
        status: selectedStatus || undefined,
      });
      setChallenges(data);
    } catch (err) {
      console.error("Failed to load challenges", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedDifficulty, selectedStatus]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  async function handleCreateChallenge(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await createChallenge(formData);
      setFormSuccess("Challenge successfully created!");
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        setFormData({
          title: "",
          company_name: "",
          description: "",
          problem_statement: "",
          expected_outcome: "",
          difficulty: "standard",
          status: "active",
        });
        loadData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Failed to create challenge.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Problem Bank
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Industry Challenges
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Design, curate, and assign real-world technical problems submitted by partner companies.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Create Challenge
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search problem title or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Challenges Grid */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading challenge bank...</span>
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
          <Target className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            No challenges found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Publish challenge statements with expected deliverables for fellowship teams.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create Challenge
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                      c.difficulty === "advanced"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        : c.difficulty === "standard"
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {c.difficulty}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {c.title}
                </h3>

                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{c.company_name}</span>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600">
                  {c.problem_statement}
                </p>

                {c.expected_outcome && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Deliverable: </span>
                    <span className="line-clamp-2">{c.expected_outcome}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-3 text-right">
                <span className="text-xs text-slate-400">
                  Created {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Challenge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Industry Challenge
                </h2>
                <p className="text-xs text-slate-500">
                  Define a project track, problem statement, and expected outcome.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Challenge Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Anomaly Detection Pipeline"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Sponsoring Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="High-level overview of the challenge context..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Problem Statement *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed breakdown of the problem requirements and technical criteria..."
                  value={formData.problem_statement}
                  onChange={(e) =>
                    setFormData({ ...formData, problem_statement: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Expected Deliverables
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. GitHub Repository, REST API, Documentation, Demo Video..."
                  value={formData.expected_outcome}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_outcome: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
