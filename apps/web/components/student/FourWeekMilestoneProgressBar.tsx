"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertCircle, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { StudentDashboardWeek } from "@/types/student_dashboard";

interface Props {
  weeks: StudentDashboardWeek[];
  cohortName: string;
}

// Distinct rainbow accent per week (1-indexed), used for the current week's
// border/badge/wash so all four cards read as a colorful set rather than a
// single repeated brand hue.
const weekAccents = [
  { border: "border-violet-400", ring: "ring-violet-400/25", wash: "bg-[#ede4fc]/50", badge: "bg-violet-600 text-white", title: "text-violet-900", pill: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500", link: "text-violet-700 hover:text-violet-900" },
  { border: "border-[#f0653d]", ring: "ring-[#f0653d]/25", wash: "bg-[#fde7de]/50", badge: "bg-[#f0653d] text-white", title: "text-[#7c2d12]", pill: "bg-[#fde7de] text-[#9a3412] border-[#fbd0bc]", dot: "bg-[#f0653d]", link: "text-[#c2410c] hover:text-[#7c2d12]" },
  { border: "border-[#0e9b8a]", ring: "ring-[#0e9b8a]/25", wash: "bg-[#daf4ee]/50", badge: "bg-[#0e9b8a] text-white", title: "text-[#0f4a42]", pill: "bg-[#daf4ee] text-[#0f4a42] border-[#bce8de]", dot: "bg-[#0e9b8a]", link: "text-[#0e9b8a] hover:text-[#0f4a42]" },
  { border: "border-[#d6336c]", ring: "ring-[#d6336c]/25", wash: "bg-[#fce3ec]/50", badge: "bg-[#d6336c] text-white", title: "text-[#7a1e42]", pill: "bg-[#fce3ec] text-[#7a1e42] border-[#f8c9dc]", dot: "bg-[#d6336c]", link: "text-[#d6336c] hover:text-[#7a1e42]" },
];

export function FourWeekMilestoneProgressBar({ weeks, cohortName }: Props) {
  return (
    <div className="card-custom space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Discover 4-Week Program Progression
          </h2>
          <p className="text-sm text-slate-500">
            8+ hours weekly output commitment required from each team member &bull; 3 sessions per week.
          </p>
        </div>
        <span className="inline-flex self-start sm:self-auto items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {cohortName || "Discover Cohort 2026"}
        </span>
      </div>

      {/* 4 Named Milestone Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {weeks.map((week) => {
          const isCurrent = week.is_current;
          const isPassed = week.gate_status === "passed";
          const isRevision = week.gate_status === "revision_required";
          const accent = weekAccents[(week.week_number - 1) % weekAccents.length];

          // Each week card carries its own rainbow accent; passed/revision
          // states still get their semantic emerald/amber treatment so
          // completion and blockers stay legible at a glance.
          const cardStyle = isPassed
            ? "border-emerald-300 bg-emerald-50/20"
            : isRevision
              ? "border-amber-400 bg-amber-50/30"
              : `${accent.border} ${accent.wash} ${isCurrent ? `ring-2 ${accent.ring} shadow-sm` : "opacity-90"}`;

          const badgeBg = isPassed
            ? "bg-emerald-600 text-white"
            : isRevision
              ? "bg-amber-600 text-white"
              : accent.badge;

          const statusPill = isPassed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Gate Passed
            </span>
          ) : isRevision ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
              <AlertCircle className="h-3 w-3" /> Revisions Due
            </span>
          ) : isCurrent ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border animate-pulse ${accent.pill}`}>
              <Clock className="h-3 w-3" /> Active Week
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
              Upcoming
            </span>
          );

          return (
            <div
              key={week.week_number}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-sm ${cardStyle}`}
            >
              <div>
                {/* Week number & status pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${badgeBg}`}>
                    Week {week.week_number}
                  </span>
                  {statusPill}
                </div>

                {/* Named week title */}
                <h3 className={`font-extrabold text-slate-900 text-base line-clamp-2 min-h-[40px] flex items-center ${isCurrent ? accent.title : ""
                  }`}>
                  {week.title}
                </h3>

                {/* Strategic Question */}
                <div className="my-2 p-2 rounded-lg bg-white/80 border border-slate-100 text-[11px] text-slate-700 italic">
                  <span className="font-bold text-slate-900 not-italic block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                    Strategic Question
                  </span>
                  &ldquo;{week.strategic_question}&rdquo;
                </div>

                {/* Output Title */}
                <div className="text-xs text-slate-600 space-y-1 mt-2">
                  <p className="font-semibold text-slate-800 line-clamp-2">
                    {week.output_title}
                  </p>
                </div>

                {/* Sessions Mini Progress */}
                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                    <span>Sessions Progress</span>
                    <span className="font-bold text-slate-800">
                      {week.sessions_completed} / 3
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((snum) => {
                      const completed = snum <= week.sessions_completed;
                      const isGateSession = snum === 3;
                      return (
                        <div
                          key={snum}
                          title={`Session ${snum}: ${isGateSession ? "Quality Gate Review" : "Learn/Work"}`}
                          className={`h-1.5 rounded-full ${completed
                              ? "bg-emerald-500"
                              : isCurrent && snum === week.sessions_completed + 1
                                ? `${accent.dot} animate-pulse`
                                : "bg-slate-200"
                            }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                    <span>Session 3 is Quality Gate</span>
                  </p>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-4 pt-3 border-t border-slate-200/70">
                <Link
                  href={`/student/deliverables?week=${week.week_number}`}
                  className={`inline-flex w-full items-center justify-between text-xs font-bold hover:underline ${accent.link}`}
                >
                  <span>View Sessions & Packs</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
