"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Layers,
  Loader2,
} from "lucide-react";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { fetchSubmissions } from "@/lib/api/submissions";
import { StudentDashboardData } from "@/types/student_dashboard";
import { Submission } from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge } from "@/components/student/ui";

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
    <div className="page-container">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-semibold text-brand-600">Weekly Deliverables</span>
          </div>
        }
        title="Weekly Deliverables & Quality Gates"
        subtitle="Track weekly milestones and submit output packs for committee review."
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/student/templates?week=${selectedWeekNum || currentWeek}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Layers className="h-4 w-4 text-slate-500" />
              <span>Templates</span>
            </Link>
            <Link
              href="/student/submissions"
              className="btn-gradient-primary !py-2 !px-3.5 !text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Pack</span>
            </Link>
          </div>
        }
      />

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
              className={`card-custom flex flex-col justify-between !p-4 transition-all ${
                isSelected
                  ? "border-brand-500 ring-2 ring-brand-500/20 shadow-xs bg-brand-50/20"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Week {wnum} of 4
                </span>
                <StatusBadge
                  variant={
                    isPassed
                      ? "success"
                      : isRevision
                        ? "warning"
                        : isCurrent
                          ? "primary"
                          : "secondary"
                  }
                >
                  {isPassed
                    ? "Passed"
                    : isRevision
                      ? "Revisions"
                      : isCurrent
                        ? "Active"
                        : "Upcoming"}
                </StatusBadge>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                {w?.output_title || `Week ${wnum} Output Pack`}
              </h3>
            </Link>
          );
        })}
      </div>

      {/* ── Active Week Detailed Pack View ── */}
      {activeWeekObj && (
        <SectionCard
          title={activeWeekObj.output_title}
          badge={
            <StatusBadge variant="primary">
              Week {activeWeekObj.week_number} Deliverable
            </StatusBadge>
          }
          headerAction={
            <div className="flex items-center gap-2">
              <Link
                href={`/student/templates?week=${activeWeekObj.week_number}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Layers className="h-3.5 w-3.5 text-brand-600" />
                <span>Templates</span>
              </Link>
              <Link
                href={`/student/submissions?week=${activeWeekObj.week_number}`}
                className="btn-gradient-primary !py-1.5 !px-3 !text-xs"
              >
                <Send className="h-3 w-3" />
                <span>Submit to Gate</span>
              </Link>
            </div>
          }
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500 italic mb-1">
                &ldquo;{activeWeekObj.strategic_question}&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {activeWeekObj.output_description ||
                  "Ensure primary evidence, stakeholder analyses, and strategic artifacts are consolidated for this milestone."}
              </p>
            </div>

            {/* Quality Gate Rule Card */}
            {activeWeekObj.quality_gate && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-900 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-slate-900">
                    {activeWeekObj.quality_gate.name}
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Progression Rule:</strong> {activeWeekObj.quality_gate.rule}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Evaluator: {activeWeekObj.quality_gate.evaluator || "Review Committee"}
                  </p>
                </div>
              </div>
            )}

            {/* Sessions & Evidence Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Component Evidence Sprints
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {activeWeekObj.sessions?.map((sess) => (
                  <div
                    key={sess.session_number}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>SESSION 0{sess.session_number}</span>
                        <span className="capitalize">{sess.session_type.replace("_", " ")}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1">{sess.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{sess.focus}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
                      <span className="font-semibold text-slate-900">Required: </span>
                      <span className="text-slate-600">{sess.required_working_evidence}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default function StudentDeliverablesPage() {
  return (
    <Suspense
      fallback={
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading Deliverables…</span>
          </div>
        </div>
      }
    >
      <DeliverablesContent />
    </Suspense>
  );
}
