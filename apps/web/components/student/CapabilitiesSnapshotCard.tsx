"use client";

import { Award, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { StudentDashboardCapability } from "@/types/student_dashboard";

interface Props {
  capabilities: StudentDashboardCapability[];
}

export function CapabilitiesSnapshotCard({ capabilities }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_rgba(15,41,77,0.08)] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />
      <div className="relative flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-200">
              <Award className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700">
                Capability passport
              </p>
              <h3 className="font-extrabold text-slate-950 text-lg leading-tight">
                Core capability journey
              </h3>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Your evidence-led growth journey toward UKM and DLIF certification.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <TrendingUp className="h-3.5 w-3.5" />
          Live progress
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {capabilities.map((cap, index) => {
          const isAdvanced = /proficient|advanced|expert/i.test(cap.level);
          return (
            <article
              key={cap.id}
              className="group relative flex min-h-[218px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/75 p-4 transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_14px_28px_rgba(37,99,235,0.12)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-70" />
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <span className={`h-1.5 w-1.5 rounded-full ${isAdvanced ? "bg-emerald-500" : "bg-sky-500"}`} />
                  {cap.level}
                </span>
                <span className="grid h-6 min-w-6 place-items-center rounded-lg bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                  0{index + 1}
                </span>
              </div>

              <h4 className="mt-4 min-h-[44px] text-[15px] font-extrabold leading-snug text-slate-950">
                {cap.name}
              </h4>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                {cap.description}
              </p>

              <div className="mt-auto border-t border-slate-200/80 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <Sparkles className="h-3 w-3 text-sky-500" /> Evidence signal
                  </span>
                  <CheckCircle2 className={`h-4 w-4 ${isAdvanced ? "text-emerald-500" : "text-sky-500"}`} />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90" aria-label={`${cap.name}: ${cap.level}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 transition-all duration-700"
                    style={{ width: `${cap.score}%` }}
                  />
                </div>
                <p className="mt-2 truncate text-[11px] font-medium text-slate-500" title={cap.benchmark}>
                  {cap.benchmark}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
