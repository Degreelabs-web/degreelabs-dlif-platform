"use client";

import { Award, CheckCircle2, TrendingUp } from "lucide-react";
import { StudentDashboardCapability } from "@/types/student_dashboard";

interface Props {
  capabilities: StudentDashboardCapability[];
}

const capabilityPalettes = [
  {
    card: "border-violet-200 bg-violet-50/70 hover:border-violet-300",
    badge: "border-violet-200 bg-violet-100 text-violet-700",
    icon: "bg-violet-100 text-violet-700",
    detail: "text-violet-700",
  },
  {
    card: "border-orange-200 bg-orange-50/70 hover:border-orange-300",
    badge: "border-orange-200 bg-orange-100 text-orange-700",
    icon: "bg-orange-100 text-orange-700",
    detail: "text-orange-700",
  },
  {
    card: "border-teal-200 bg-teal-50/70 hover:border-teal-300",
    badge: "border-teal-200 bg-teal-100 text-teal-700",
    icon: "bg-teal-100 text-teal-700",
    detail: "text-teal-700",
  },
  {
    card: "border-rose-200 bg-rose-50/70 hover:border-rose-300",
    badge: "border-rose-200 bg-rose-100 text-rose-700",
    icon: "bg-rose-100 text-rose-700",
    detail: "text-rose-700",
  },
  {
    card: "border-indigo-200 bg-indigo-50/70 hover:border-indigo-300",
    badge: "border-indigo-200 bg-indigo-100 text-indigo-700",
    icon: "bg-indigo-100 text-indigo-700",
    detail: "text-indigo-700",
  },
];

export function CapabilitiesSnapshotCard({ capabilities }: Props) {
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">
              Capability Snapshot
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            A clear view of the capabilities you are strengthening through the Discover programme.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 self-start sm:self-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
          <TrendingUp className="h-3.5 w-3.5" /> Tracked Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {capabilities.map((cap, index) => {
          const palette = capabilityPalettes[index % capabilityPalettes.length];

          return (
            <article
              key={cap.id}
              className={`flex min-h-[208px] flex-col rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${palette.card}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${palette.badge}`}>
                    {cap.level}
                  </span>
                  <span className={`text-xs font-extrabold tracking-wider ${palette.detail}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h4 className="min-h-[42px] text-sm font-extrabold leading-snug text-slate-950">
                  {cap.name}
                </h4>

                <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-600">
                  {cap.description}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${palette.icon}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="truncate text-[11px] font-semibold text-slate-600" title={cap.benchmark}>
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
