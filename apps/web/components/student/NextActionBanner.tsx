"use client";

import Link from "next/link";
import { Zap, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { StudentDashboardNextAction } from "@/types/student_dashboard";

interface Props {
  action: StudentDashboardNextAction;
}

export function NextActionBanner({ action }: Props) {
  const isWarning = action.alert_level === "warning";
  const isGate = action.alert_level === "gate";

  // Dynamic color palettes matching DL_DISCOVER's styled card
  const containerStyle = isWarning
    ? "border-amber-400/80 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white"
    : isGate
    ? "border-indigo-400/80 bg-gradient-to-r from-indigo-50/90 via-sky-50/40 to-white"
    : "border-sky-400/80 bg-gradient-to-r from-sky-50/90 via-blue-50/30 to-white";

  const iconBg = isWarning
    ? "bg-amber-600 text-white"
    : isGate
    ? "bg-indigo-600 text-white"
    : "bg-sky-600 text-white";

  const badgeText = isWarning
    ? "Action Required • Quality Gate Revision"
    : isGate
    ? "Quality Gate Milestone • Formal Review Ahead"
    : "Recommended Next Action";

  const badgeClass = isWarning
    ? "bg-amber-100 text-amber-900 border-amber-300"
    : isGate
    ? "bg-indigo-100 text-indigo-900 border-indigo-300"
    : "bg-sky-100 text-sky-900 border-sky-300";

  const buttonClass = isWarning
    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/10"
    : isGate
    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/10"
    : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/10";

  return (
    <div className={`rounded-xl border-2 p-5 shadow-xs transition-all ${containerStyle}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs ${iconBg}`}
          >
            {isWarning ? (
              <AlertTriangle className="h-6 w-6" />
            ) : isGate ? (
              <ShieldAlert className="h-6 w-6" />
            ) : (
              <Zap className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1">
            <span
              className={`inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md border ${badgeClass}`}
            >
              {badgeText}
            </span>
            <h3 className="text-base font-bold text-slate-900">{action.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{action.desc}</p>
          </div>
        </div>

        <div className="shrink-0 pt-2 md:pt-0">
          <Link
            href={action.link}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-colors ${buttonClass}`}
          >
            <span>{action.btn_text}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
