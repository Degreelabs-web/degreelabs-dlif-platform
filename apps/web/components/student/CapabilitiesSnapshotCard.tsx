"use client";

import { Award, TrendingUp, CheckCircle2 } from "lucide-react";
import { StudentDashboardCapability } from "@/types/student_dashboard";

interface Props {
  capabilities: StudentDashboardCapability[];
}

export function CapabilitiesSnapshotCard({ capabilities }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              5 Core Capabilities Snapshot
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Competency progression tracked toward UKM &amp; DLIF Certification across all 4 weeks.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <TrendingUp className="h-3.5 w-3.5" /> Tracked Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {capabilities.map((cap) => {
          return (
            <div
              key={cap.id}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex flex-col justify-between space-y-2 hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {cap.level}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                    {cap.score}%
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 min-h-[32px] flex items-center">
                  {cap.name}
                </h4>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mt-1">
                  {cap.description}
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/50">
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${cap.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {cap.benchmark}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
