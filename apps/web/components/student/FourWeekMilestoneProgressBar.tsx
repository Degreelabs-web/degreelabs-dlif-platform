"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle2, AlertCircle, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { StudentDashboardWeek } from "@/types/student_dashboard";

interface Props {
  weeks: StudentDashboardWeek[];
  cohortName: string;
}

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

          // Card border and background styles matching DL_DISCOVER
          const cardStyle = isCurrent
            ? "border-sky-400 bg-[#e0f2fe]/40 ring-2 ring-sky-400/25 shadow-sm"
            : isPassed
            ? "border-emerald-300 bg-emerald-50/20"
            : isRevision
            ? "border-amber-400 bg-amber-50/30"
            : "border-slate-200 bg-slate-50/40 opacity-80";

          const badgeBg = isCurrent
            ? "bg-sky-600 text-white"
            : isPassed
            ? "bg-emerald-600 text-white"
            : isRevision
            ? "bg-amber-600 text-white"
            : "bg-slate-400 text-white";

          const statusPill = isPassed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Gate Passed
            </span>
          ) : isRevision ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
              <AlertCircle className="h-3 w-3" /> Revisions Due
            </span>
          ) : isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200 animate-pulse">
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
                <h3 className={`font-extrabold text-slate-900 text-base line-clamp-2 min-h-[40px] flex items-center ${
                  isCurrent ? "text-sky-900" : ""
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
                          className={`h-1.5 rounded-full ${
                            completed
                              ? "bg-emerald-500"
                              : isCurrent && snum === week.sessions_completed + 1
                              ? "bg-sky-500 animate-pulse"
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
                  className="inline-flex w-full items-center justify-between text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
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
