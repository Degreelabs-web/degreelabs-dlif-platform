"use client";

import Link from "next/link";
import { FileCheck, Download, ArrowUpRight, FolderLock } from "lucide-react";
import { StudentDashboardTemplate } from "@/types/student_dashboard";

interface Props {
  templates: StudentDashboardTemplate[];
  ongoingDeliverables: Array<{ id: string; name: string; scope: string }>;
  currentWeekNumber: number;
}

export function DeliverableChecklistCard({
  templates,
  ongoingDeliverables,
  currentWeekNumber,
}: Props) {
  return (
    <div className="card-custom space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              Week {currentWeekNumber} Deliverable Templates &amp; Dossiers
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Official DLIF student templates required for this week&apos;s working evidence and quality gate.
          </p>
        </div>
        <Link
          href={`/student/templates?week=${currentWeekNumber}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
        >
          <span>All 12 Core Templates</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 flex flex-col justify-between hover:bg-white hover:border-sky-300 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {tpl.type}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {tpl.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {tpl.name}
              </h4>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-200/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">PDF / Sheet Spec</span>
              <button
                type="button"
                onClick={() => alert(`Opening template: ${tpl.name}`)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800"
              >
                <Download className="h-3 w-3" />
                <span>Open</span>
              </button>
            </div>
          </div>
        ))}

        {/* Master Ongoing Deliverable Tile */}
        {ongoingDeliverables.map((od) => (
          <div
            key={od.id}
            className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Living Master
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Continuous
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                {od.name}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">{od.scope}</p>
            </div>

            <div className="pt-3 mt-2 border-t border-indigo-200/60 flex items-center justify-between">
              <span className="text-[10px] text-indigo-600 font-medium">Weeks 1–4</span>
              <Link
                href="/student/deliverables"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
              >
                <span>Access</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
