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
      ? "border-fuchsia-400/80 bg-gradient-to-r from-fuchsia-50/90 via-violet-50/40 to-white"
      : "border-[#f0653d]/80 bg-gradient-to-r from-[#fde7de]/90 via-orange-50/30 to-white";

  const iconBg = isWarning
    ? "bg-amber-600 text-white"
    : isGate
      ? "bg-fuchsia-600 text-white"
      : "bg-[#f0653d] text-white";

  const badgeText = isWarning
    ? "Action Required • Quality Gate Revision"
    : isGate
      ? "Quality Gate Milestone • Formal Review Ahead"
      : "Recommended Next Action";

  const badgeClass = isWarning
    ? "bg-amber-100 text-amber-900 border-amber-300"
    : isGate
      ? "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300"
      : "bg-[#fde7de] text-[#9a3412] border-[#fbd0bc]";

  const buttonClass = isWarning
    ? "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-colors bg-amber-600 hover:bg-amber-500 text-white"
    : isGate
      ? "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm transition-colors bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
      : "btn-gradient-primary";

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
          {isWarning || isGate ? (
            <Link
              href={action.link}
              className={buttonClass}
            >
              <span>{action.btn_text}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href={action.link} className={buttonClass}>
              <span>{action.btn_text}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
