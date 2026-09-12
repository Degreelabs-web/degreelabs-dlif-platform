"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchSubmissions, submitTask } from "@/lib/api/submissions";
import { fetchSessions } from "@/lib/api/sessions";
import {
  Session,
  SessionTask,
  Submission,
  StudentPortalContext,
} from "@/types/fellowship";

export default function StudentSubmissionsPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<SessionTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    task_id: "",
    content: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const user = getStoredUser();
      if (user) {
        const ctx = await fetchStudentPortalContext(user.id);
        setContext(ctx);

        if (ctx.team?.id) {
          const subs = await fetchSubmissions({ team_id: ctx.team.id });
          setSubmissions(subs);
        }

        if (ctx.cohort?.id) {
          const sessionsData = await fetchSessions({ cohort_id: ctx.cohort.id });
          const allTasks: SessionTask[] = [];
          sessionsData.forEach((s) => {
            if (s.tasks) allTasks.push(...s.tasks);
          });
          setTasks(allTasks);
          if (allTasks.length > 0 && !formData.task_id) {
            setFormData((prev) => ({ ...prev, task_id: allTasks[0].id }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load student submissions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmitDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!context?.team?.id) {
      setFormError("You must be assigned to an active team to submit deliverables.");
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      const user = getStoredUser();
      const submittedBy = user?.id || "00000000-0000-0000-0000-000000000000";

      // If no session task exists yet, use a fallback task ID
      let taskId = formData.task_id;
      if (!taskId) {
        if (tasks.length > 0) {
          taskId = tasks[0].id;
        } else {
          throw new Error("No tasks are currently available for submission in your cohort.");
        }
      }

      await submitTask({
        task_id: taskId,
        team_id: context.team.id,
        submitted_by: submittedBy,
        content: formData.content,
      });

      setFormSuccess("Deliverable successfully submitted for evaluation!");
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        setFormData((prev) => ({ ...prev, content: "" }));
        loadData();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit deliverable.");
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
            Sprint Deliverables
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Team Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Turn in project milestones, code repositories, architecture artifacts, and review evaluations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!context?.team}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Deliverable
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading deliverables history...</span>
          </div>
        </div>
      ) : !context?.team ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No Team Assigned
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Deliverables are submitted cooperatively as a squad once your team is formed.
          </p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No submissions turned in yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Ready to share your squad's milestone? Submit your first deliverable for mentor feedback.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Submit First Deliverable
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    #{sub.id.slice(0, 8)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    Version {sub.latest_version?.version_number || 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
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

                  <span className="text-xs text-slate-400">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {sub.latest_version?.content && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {sub.latest_version.content}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  Squad: {context.team?.name}
                </span>

                <Link
                  href="/student/feedback"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  View Review Feedback →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Deliverable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Submit Project Deliverable
                </h2>
                <p className="text-xs text-slate-500">
                  Turn in your squad&apos;s code repo, demo links, and documentation.
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

            <form onSubmit={handleSubmitDeliverable} className="mt-4 space-y-4">
              {tasks.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Associated Milestone Task *
                  </label>
                  <select
                    required
                    value={formData.task_id}
                    onChange={(e) =>
                      setFormData({ ...formData, task_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Artifact Deliverable & Links *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide your GitHub repository URL, hosted demo link, architecture diagram URL, and sprint reflection notes..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
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
                  Turn in Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
