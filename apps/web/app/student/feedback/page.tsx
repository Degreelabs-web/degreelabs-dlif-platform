"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Star,
  UserCheck,
  Calendar,
  Loader2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { fetchFeedback } from "@/lib/api/feedback";
import { Feedback } from "@/types/fellowship";

export default function StudentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeedbackData() {
      try {
        setLoading(true);
        const data = await fetchFeedback();
        setFeedbacks(data);
      } catch (err) {
        console.error("Failed to load student feedback", err);
      } finally {
        setLoading(false);
      }
    }

    loadFeedbackData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Evaluation & Critique
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Review Feedback
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review notes, code critiques, and rubric scores from your industry mentor and evaluators.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading evaluation feedback...</span>
          </div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No feedback recorded yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Once your team turns in milestone deliverables, mentor evaluations and rubric scores will appear here.
          </p>
          <Link
            href="/student/submissions"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go to Submissions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>
                    Evaluator: {fb.reviewer_name || "Assigned Mentor"}
                  </span>
                  {fb.reviewer_role && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 uppercase">
                      {fb.reviewer_role}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {fb.score !== null && fb.score !== undefined && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      Score: {fb.score}/100
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-100">
                {fb.feedback_text}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="font-mono">
                  Submission #{fb.submission_id.slice(0, 8)}
                </span>
                <Link
                  href="/student/submissions"
                  className="font-semibold text-slate-700 hover:text-slate-900"
                >
                  View Deliverable Artifacts →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
