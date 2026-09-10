"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  fetchSubmissions,
  updateSubmissionStatus,
  fetchSubmissionById,
} from "@/lib/api/submissions";
import { fetchTeams } from "@/lib/api/teams";
import { createFeedback } from "@/lib/api/feedback";
import { getStoredUser } from "@/lib/api/auth";
import { Submission, Team } from "@/types/fellowship";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  // Review Modal State
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(
    null
  );
  const [reviewStatus, setReviewStatus] = useState("accepted");
  const [feedbackText, setFeedbackText] = useState("");
  const [score, setScore] = useState(85);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [submissionsData, teamsData] = await Promise.all([
        fetchSubmissions({
          status: selectedStatus || undefined,
          team_id: selectedTeam || undefined,
        }),
        fetchTeams(),
      ]);
      setSubmissions(submissionsData);
      setTeams(teamsData);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedTeam]);

  async function handleOpenReview(sub: Submission) {
    try {
      const detailed = await fetchSubmissionById(sub.id);
      setActiveSubmission(detailed);
      setReviewStatus(detailed.status === "submitted" ? "accepted" : detailed.status);
      setFeedbackText("");
      setReviewError(null);
      setReviewSuccess(null);
    } catch (err) {
      setActiveSubmission(sub);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSubmission) return;
    setReviewError(null);
    setReviewSuccess(null);
    setSubmittingReview(true);

    try {
      const user = getStoredUser();
      const reviewerId = user?.id || "00000000-0000-0000-0000-000000000000";

      // 1. Update status
      await updateSubmissionStatus(activeSubmission.id, reviewStatus);

      // 2. Attach feedback if provided
      if (feedbackText.trim()) {
        await createFeedback({
          submission_id: activeSubmission.id,
          reviewer_id: reviewerId,
          feedback_text: feedbackText.trim(),
          score: Number(score),
        });
      }

      setReviewSuccess("Evaluation and feedback recorded!");
      setTimeout(() => {
        setActiveSubmission(null);
        setReviewSuccess(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setReviewError(err.message || "Failed to record review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Evaluation & Feedback
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Submissions Queue
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review student team deliverables, inspect version history, and provide rubric feedback.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Review Statuses</option>
          <option value="submitted">Submitted (Pending)</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="changes_requested">Changes Requested</option>
        </select>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submissions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium">Loading submissions queue...</span>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              No submissions recorded
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Student team project deliverables and session task artifacts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Deliverable ID</th>
                  <th className="px-6 py-3.5">Team</th>
                  <th className="px-6 py-3.5">Version</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const team = teams.find((t) => t.id === sub.team_id);
                  return (
                    <tr key={sub.id} className="transition hover:bg-slate-50/75">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                        #{sub.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {team ? team.name : `Team #${sub.team_id.slice(0, 6)}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          v{sub.latest_version?.version_number || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            sub.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                              : sub.status === "changes_requested"
                              ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                              : "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                          }`}
                        >
                          {sub.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenReview(sub)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                        >
                          Review & Grade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Review Deliverable #{activeSubmission.id.slice(0, 8)}
                </h2>
                <p className="text-xs text-slate-500">
                  Assess submitted artifact and assign rubric evaluation.
                </p>
              </div>
              <button
                onClick={() => setActiveSubmission(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            {/* Artifact Content Preview */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">Submission Notes & Artifacts:</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {activeSubmission.latest_version?.content || "No textual notes provided."}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Decision Status *
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="accepted">Accepted (Approved)</option>
                    <option value="changes_requested">Changes Requested</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Rubric Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Evaluator Feedback & Guidance
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback, suggestions for iteration, or commendations..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
