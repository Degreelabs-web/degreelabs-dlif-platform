"use client";

import Link from "next/link";
import { FileText, Users, Sparkles, ArrowRight } from "lucide-react";
import { StudentDashboardData } from "@/types/student_dashboard";

interface Props {
  data: StudentDashboardData;
}

export function StudentDashboardHeader({ data }: Props) {
  const currentWeek = data.team.current_week || 1;
  const currentSession = data.team.current_session || 1;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200/80">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs">
            <Sparkles className="h-3 w-3 text-sky-400" />
            Week {currentWeek} of 4
          </span>
          <span className="text-xs font-medium text-slate-500">
            &bull; {data.team.name}
          </span>
          <span className="text-xs font-medium text-slate-400">
            &bull; Session {currentSession} of 12
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Welcome back, {data.student.full_name} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Track your team&apos;s Discover progress, weekly deliverables, upcoming sessions, and mentor engagements.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/student/deliverables?week=${currentWeek}`}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Week {currentWeek} Deliverable</span>
        </Link>
        <Link
          href="/student/team"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <Users className="h-4 w-4 text-slate-500" />
          <span>Team Workspace</span>
        </Link>
      </div>
    </div>
  );
}
