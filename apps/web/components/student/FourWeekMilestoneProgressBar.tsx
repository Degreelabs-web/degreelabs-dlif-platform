"use client";

import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Compass,
  Lightbulb,
  Layers,
  Trophy,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { StudentDashboardWeek } from "@/types/student_dashboard";

interface Props {
  weeks: StudentDashboardWeek[];
  cohortName: string;
}

const WEEK_CONFIGS = [
  {
    icon: Compass,
    phase: "DIAGNOSIS",
    gateLabel: "Gate 1: Problem Lock",
    cardGradient: "bg-gradient-to-b from-sky-50/90 via-blue-50/30 to-white",
    activeCardGradient: "bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white",
    topGradient: "from-sky-500 via-blue-600 to-indigo-600",
    stepperGradient: "from-sky-500 to-blue-600 text-white",
    badgeBg: "bg-gradient-to-r from-sky-600 to-blue-600 text-white",
    badgeLightBg: "bg-sky-100/80 text-sky-900 border border-sky-200",
    borderColor: "border-sky-300",
    iconBg: "bg-gradient-to-br from-sky-500 to-blue-600 text-white",
    questionGradient: "bg-gradient-to-r from-sky-100/70 via-sky-50/50 to-white border-sky-200/80",
    questionIcon: "text-sky-600",
    buttonGradient: "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sm",
  },
  {
    icon: Lightbulb,
    phase: "POSSIBILITIES",
    gateLabel: "Gate 2: Choice Lock",
    cardGradient: "bg-gradient-to-b from-purple-50/80 via-violet-50/20 to-white",
    activeCardGradient: "bg-gradient-to-b from-purple-100/70 via-purple-50/40 to-white",
    topGradient: "from-purple-500 via-violet-600 to-indigo-600",
    stepperGradient: "from-purple-500 to-violet-600 text-white",
    badgeBg: "bg-gradient-to-r from-purple-600 to-violet-600 text-white",
    badgeLightBg: "bg-purple-100/80 text-purple-900 border border-purple-200",
    borderColor: "border-purple-200",
    iconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
    questionGradient: "bg-gradient-to-r from-purple-100/60 via-purple-50/40 to-white border-purple-200/80",
    questionIcon: "text-purple-600",
    buttonGradient: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
  },
  {
    icon: Layers,
    phase: "ARCHITECTURE",
    gateLabel: "Gate 3: Strategy Lock",
    cardGradient: "bg-gradient-to-b from-indigo-50/80 via-blue-50/20 to-white",
    activeCardGradient: "bg-gradient-to-b from-indigo-100/70 via-indigo-50/40 to-white",
    topGradient: "from-indigo-500 via-blue-600 to-cyan-600",
    stepperGradient: "from-indigo-500 to-blue-600 text-white",
    badgeBg: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white",
    badgeLightBg: "bg-indigo-100/80 text-indigo-900 border border-indigo-200",
    borderColor: "border-indigo-200",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white",
    questionGradient: "bg-gradient-to-r from-indigo-100/60 via-indigo-50/40 to-white border-indigo-200/80",
    questionIcon: "text-indigo-600",
    buttonGradient: "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white",
  },
  {
    icon: Trophy,
    phase: "SYNTHESIS",
    gateLabel: "Gate 4: Final Cert",
    cardGradient: "bg-gradient-to-b from-emerald-50/80 via-teal-50/20 to-white",
    activeCardGradient: "bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-white",
    topGradient: "from-emerald-500 via-teal-600 to-sky-600",
    stepperGradient: "from-emerald-500 to-teal-600 text-white",
    badgeBg: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
    badgeLightBg: "bg-emerald-100/80 text-emerald-900 border border-emerald-200",
    borderColor: "border-emerald-200",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    questionGradient: "bg-gradient-to-r from-emerald-100/60 via-emerald-50/40 to-white border-emerald-200/80",
    questionIcon: "text-emerald-600",
    buttonGradient: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white",
  },
];

export function FourWeekMilestoneProgressBar({ weeks, cohortName }: Props) {
  const currentWeekObj = weeks.find((w) => w.is_current) || weeks[0];
  const currentWeekNumber = currentWeekObj?.week_number || 1;
  const totalCompletedSessions = weeks.reduce((sum, w) => sum + (w.sessions_completed || 0), 0);
  const totalSessions = 12;

  return (
    <div className="card-custom !p-4 sm:!p-5 space-y-4 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-white shadow-xs">
      {/* Top Multi-Stop Gradient Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-purple-500 via-indigo-500 to-emerald-500" />

      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-2xs">
              <Sparkles className="h-2.5 w-2.5 text-sky-400" />
              Discover Program
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 shadow-2xs">
              <Clock className="h-3 w-3" />
              Week {currentWeekNumber} of 4 Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            4-Week Program Progression
          </h2>
        </div>

        {/* Compact Momentum Pill */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-slate-200 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-right shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Momentum</span>
            <span className="text-xs font-black text-slate-800">
              {totalCompletedSessions} / {totalSessions} Sessions
            </span>
          </div>
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
            {cohortName || "Cohort 2026"}
          </span>
        </div>
      </div>

      {/* Sleek Connected Stepper Line with Phase Gradient Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {weeks.map((week, idx) => {
          const config = WEEK_CONFIGS[idx] || WEEK_CONFIGS[0];
          const Icon = config.icon;
          const isCurrent = week.is_current;
          const isPassed = week.gate_status === "passed" || week.is_completed;

          return (
            <div
              key={week.week_number}
              className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                isCurrent
                  ? `bg-white border-sky-400 shadow-xs ring-2 ring-sky-100`
                  : isPassed
                  ? `bg-gradient-to-r from-emerald-50/80 to-teal-50/40 border-emerald-200`
                  : `bg-slate-50/80 border-slate-200/90 opacity-70`
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold shadow-2xs ${
                  isCurrent
                    ? `bg-gradient-to-br ${config.topGradient} text-white`
                    : isPassed
                    ? `bg-gradient-to-br from-emerald-500 to-teal-600 text-white`
                    : `bg-slate-200 text-slate-600`
                }`}
              >
                {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  W{week.week_number}: {week.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4 Compact Milestone Cards with Dedicated Phase Gradients */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 pt-0.5">
        {weeks.map((week, idx) => {
          const config = WEEK_CONFIGS[idx] || WEEK_CONFIGS[0];
          const Icon = config.icon;
          const isCurrent = week.is_current;
          const isPassed = week.gate_status === "passed";
          const isRevision = week.gate_status === "revision_required";

          const cardBgGradient = isCurrent
            ? config.activeCardGradient
            : isPassed
            ? "bg-gradient-to-b from-emerald-50/50 via-teal-50/20 to-white"
            : isRevision
            ? "bg-gradient-to-b from-amber-50/60 via-orange-50/20 to-white"
            : config.cardGradient;

          const cardBorder = isCurrent
            ? "border-2 border-sky-400 shadow-md ring-2 ring-sky-100"
            : isPassed
            ? "border border-emerald-300 shadow-2xs"
            : isRevision
            ? "border-2 border-amber-300 shadow-2xs"
            : `border ${config.borderColor} shadow-2xs hover:shadow-xs`;

          const statusPill = isPassed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-2.5 w-2.5" /> Passed
            </span>
          ) : isRevision ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              <AlertCircle className="h-2.5 w-2.5" /> Revisions
            </span>
          ) : isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Upcoming
            </span>
          );

          return (
            <div
              key={week.week_number}
              className={`rounded-xl p-3.5 flex flex-col justify-between transition-all relative overflow-hidden ${cardBgGradient} ${cardBorder}`}
            >
              {/* Vibrant Top Gradient Header Strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.topGradient}`} />

              <div className="space-y-2.5">
                {/* 1. Top Row: Week badge + Phase + Status */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black shadow-2xs ${
                        isCurrent
                          ? config.badgeBg
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      W{week.week_number}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded shadow-2xs ${
                        isCurrent
                          ? config.badgeLightBg
                          : "bg-white/80 border border-slate-200 text-slate-600"
                      }`}
                    >
                      {config.phase}
                    </span>
                  </div>

                  {statusPill}
                </div>

                {/* 2. Title & Icon Row with Gradient Icon Badge */}
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg} shadow-xs`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3
                    className={`font-black text-slate-900 text-sm leading-snug line-clamp-1 ${
                      isCurrent ? "text-sky-950" : ""
                    }`}
                    title={week.title}
                  >
                    {week.title}
                  </h3>
                </div>

                {/* 3. Strategic Question Callout with Subtle Gradient */}
                <div className={`p-2 rounded-lg border shadow-2xs ${config.questionGradient}`}>
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    <HelpCircle className={`h-2.5 w-2.5 ${config.questionIcon}`} />
                    <span>Strategic Question</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 leading-snug italic line-clamp-2">
                    &ldquo;{week.strategic_question}&rdquo;
                  </p>
                </div>

                {/* 4. Key Gate Deliverable Strip (Crisp White Card with Gate Tag) */}
                <div className="p-2 rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 text-[9px]">
                      <FileText className="h-2.5 w-2.5 text-slate-400" />
                      Key Gate Output
                    </span>
                    <span className="font-bold text-emerald-700 flex items-center gap-0.5 text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                      {config.gateLabel}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2" title={week.output_title}>
                    {week.output_title}
                  </p>
                </div>

                {/* 5. Sessions Progress (Inline Gradient Pips) */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-bold text-slate-600">
                    Sessions ({week.sessions_completed}/3)
                  </span>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((snum) => {
                      const completed = snum <= week.sessions_completed;
                      const isGateSession = snum === 3;
                      const isNextToRun = isCurrent && snum === week.sessions_completed + 1;

                      return (
                        <span
                          key={snum}
                          title={`Session ${snum}: ${isGateSession ? "Quality Gate" : "Working Session"}`}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold leading-none shadow-2xs ${
                            completed
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                              : isNextToRun
                              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white animate-pulse"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {isGateSession ? "Gate" : `S${snum}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 6. Card Footer Action with Gradient Button for Active */}
              <div className="mt-3 pt-2 border-t border-slate-200/70">
                {isCurrent ? (
                  <Link
                    href={`/student/deliverables?week=${week.week_number}`}
                    className={`w-full inline-flex items-center justify-between rounded-lg py-1.5 px-2.5 text-xs font-bold transition-all ${config.buttonGradient}`}
                  >
                    <span>Work on Deliverable</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>
                ) : (
                  <Link
                    href={`/student/deliverables?week=${week.week_number}`}
                    className="inline-flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:text-sky-700 transition-all shadow-2xs"
                  >
                    <span>View Sessions &amp; Packs</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
