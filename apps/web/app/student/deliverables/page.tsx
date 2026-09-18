"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { fetchSubmissions } from "@/lib/api/submissions";
import { StudentDashboardData } from "@/types/student_dashboard";
import { Submission } from "@/types/fellowship";

function DeliverablesContent() {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");
  const selectedWeekNum = weekParam ? Number(weekParam) : 1;

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchStudentDashboard();
        setDashboardData(data);
        if (data.team?.id) {
          const subs = await fetchSubmissions({ team_id: data.team.id });
          setSubmissions(subs);
        }
      } catch (err) {
        console.error("Failed to load deliverables context", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const team = dashboardData?.team;
  const currentWeek = team?.current_week || 1;
  const weeks = dashboardData?.weeks || [];

  const activeWeekObj = weeks.find((w) => w.week_number === (selectedWeekNum || currentWeek)) || weeks[0];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/student"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-semibold text-sky-600">Weekly Deliverables</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-sky-600" />
            Weekly Deliverables &amp; Quality Gates
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Track weekly milestones, review committee evaluations, and submit your squad&apos;s
            output packs to unlock subsequent fellowship stages.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/student/templates?week=${selectedWeekNum || currentWeek}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            <span>View Templates</span>
          </Link>
          <Link
            href="/student/submissions"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submissions History</span>
          </Link>
        </div>
      </div>

      {/* ── 4-Week Milestone Selector ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((wnum) => {
          const w = weeks.find((item) => item.week_number === wnum);
          const isSelected = (selectedWeekNum || currentWeek) === wnum;
          const isPassed = w?.gate_status === "passed";
          const isRevision = w?.gate_status === "revision_required";
          const isCurrent = wnum === currentWeek;

          return (
            <Link
              key={wnum}
              href={`/student/deliverables?week=${wnum}`}
              className={`rounded-2xl border p-4 transition-all ${
                isSelected
                  ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Week {wnum} of 4
                </span>
                {isPassed ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Passed
                  </span>
                ) : isRevision ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Revisions Due
                  </span>
                ) : isCurrent ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    Upcoming
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {w?.output_title || `Week ${wnum} Output Pack`}
              </h3>
            </Link>
          );
        })}
      </div>

      {/* ── Active Week Detailed Pack View ── */}
      {activeWeekObj && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                  Week {activeWeekObj.week_number} Deliverable
                </span>
                <span className="text-xs text-slate-500 italic">
                  &ldquo;{activeWeekObj.strategic_question}&rdquo;
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                {activeWeekObj.output_title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                {activeWeekObj.output_description ||
                  "Ensure all primary evidence, stakeholder analyses, and strategic artifacts are consolidated for this milestone."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/student/templates?week=${activeWeekObj.week_number}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <Layers className="h-4 w-4 text-sky-600" />
                <span>Open Week {activeWeekObj.week_number} Templates</span>
              </Link>
              <Link
                href="/student/submissions"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-500 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>Submit to Quality Gate</span>
              </Link>
            </div>
          </div>

          {/* Quality Gate Rule Card */}
          {activeWeekObj.quality_gate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-900 mb-0.5">
                  {activeWeekObj.quality_gate.name}
                </p>
                <p className="text-slate-700 leading-relaxed font-medium">
                  <strong>Progression Rule:</strong> {activeWeekObj.quality_gate.rule}
                </p>
                <p className="text-slate-500 mt-1 text-[11px]">
                  Evaluator: {activeWeekObj.quality_gate.evaluator || "Review Committee"}
                </p>
              </div>
            </div>
          )}

          {/* Sessions & Component Working Evidences */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
              Component Evidence Sprints
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {activeWeekObj.sessions?.map((sess) => (
                <div
                  key={sess.session_number}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>SESSION {sess.session_number}</span>
                      <span className="capitalize">{sess.session_type.replace("_", " ")}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{sess.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{sess.focus}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-700">
                    <span className="font-semibold block text-slate-900">Required:</span>
                    <span className="text-slate-600">{sess.required_working_evidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDeliverablesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
            <span className="font-medium text-slate-700">Loading Deliverables...</span>
          </div>
        </div>
      }
    >
      <DeliverablesContent />
    </Suspense>
  );
}
