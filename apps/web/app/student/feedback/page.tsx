"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Star,
  UserCheck,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { fetchFeedback } from "@/lib/api/feedback";
import { Feedback } from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

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
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Evaluation &amp; Rubric
          </span>
        }
        title="Review Feedback"
        subtitle="Critique notes and rubric scores from your industry mentor and evaluators."
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading evaluation feedback…</span>
          </div>
        </div>
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          headline="No feedback recorded yet"
          description="Mentor evaluations and rubric scores will appear here after your team submits deliverables."
          action={
            <Link
              href="/student/submissions"
              className="btn-gradient-primary !py-2 !px-4 !text-xs"
            >
              <span>Go to Submissions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <SectionCard
              key={fb.id}
              footerAction={
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Submission #{fb.submission_id.slice(0, 8)}</span>
                  <Link
                    href="/student/submissions"
                    className="font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Deliverables</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              }
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Evaluator: {fb.reviewer_name || "Assigned Mentor"}</span>
                  {fb.reviewer_role && (
                    <StatusBadge variant="secondary" className="!py-0 !px-1.5 !text-[10px]">
                      {fb.reviewer_role}
                    </StatusBadge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {fb.score !== null && fb.score !== undefined && (
                    <StatusBadge variant="warning" icon={<Star className="h-3 w-3 fill-amber-400 text-amber-500" />}>
                      Score: {fb.score}/100
                    </StatusBadge>
                  )}

                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap border border-slate-100">
                {fb.feedback_text}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
