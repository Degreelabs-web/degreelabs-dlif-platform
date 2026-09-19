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
  ArrowRight,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchSubmissions, submitTask } from "@/lib/api/submissions";
import { fetchSessions, fetchSessionTasks } from "@/lib/api/sessions";
import {
  SessionTask,
  Submission,
  StudentPortalContext,
} from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

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
          const sessionsData = await fetchSessions();
          const taskGroups = await Promise.all(
            sessionsData.map((session) => fetchSessionTasks(session.id))
          );
          const allTasks = taskGroups.flat();
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
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sprint Deliverables
          </span>
        }
        title="Team Submissions"
        subtitle="Turn in milestone evidence packs and inspect evaluator review outcomes."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={!context?.team}
            className="btn-gradient-primary disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Deliverable</span>
          </button>
        }
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading deliverables history…</span>
          </div>
        </div>
      ) : !context?.team ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          headline="No Team Assigned"
          description="Deliverables are submitted cooperatively as a squad once your team is formed."
        />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          headline="No submissions turned in yet"
          description="Ready to share your squad's milestone? Submit your first deliverable for mentor feedback."
          action={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn-gradient-primary !py-2 !px-4 !text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Submit Deliverable</span>
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <SectionCard
              key={sub.id}
              footerAction={
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Squad: {context.team?.name}</span>
                  <Link
                    href="/student/feedback"
                    className="font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Feedback</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              }
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    #{sub.id.slice(0, 8)}
                  </span>
                  <StatusBadge variant="secondary">
                    v{sub.latest_version?.version_number || 1}
                  </StatusBadge>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge
                    variant={
                      sub.status === "accepted"
                        ? "success"
                        : sub.status === "changes_requested"
                          ? "warning"
                          : "primary"
                    }
                  >
                    {sub.status.replace("_", " ")}
                  </StatusBadge>

                  <span className="text-xs text-slate-400">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {sub.latest_version?.content && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {sub.latest_version.content}
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      {/* Submit Deliverable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Submit Project Deliverable
                </h2>
                <p className="text-xs text-slate-500">
                  Provide repository URLs, working artifacts, and notes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDeliverable} className="mt-4 space-y-4">
              {tasks.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Associated Milestone Task *
                  </label>
                  <select
                    required
                    value={formData.task_id}
                    onChange={(e) =>
                      setFormData({ ...formData, task_id: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Artifact Deliverable &amp; Links *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide repository URL, document link, and sprint evidence summary…"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient-primary !py-2 !px-4 !text-xs disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Turn in Deliverable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
