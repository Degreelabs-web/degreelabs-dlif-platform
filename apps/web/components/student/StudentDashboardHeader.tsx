"use client";

import Link from "next/link";
import { FileText, Users, Sparkles } from "lucide-react";
import { StudentDashboardData } from "@/types/student_dashboard";

interface Props {
  data: StudentDashboardData;
}

export function StudentDashboardHeader({ data }: Props) {
  const currentWeek = data.team.current_week || 1;
  const currentSession = data.team.current_session || 1;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-200/80">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white shadow-sm">
            <Sparkles className="h-3 w-3 text-sky-400" />
            Week {currentWeek} of 4
          </span>
          <span className="text-sm font-medium text-slate-500">
            &bull; {data.team.name}
          </span>
          <span className="text-sm font-medium text-slate-400">
            &bull; Session {currentSession} of 12
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Welcome back, {data.student.full_name} 👋
        </h1>
        <p className="mt-1.5 text-base text-slate-600 max-w-3xl leading-relaxed">
          Track your team&apos;s Discover progress, weekly deliverables, upcoming sessions, and mentor engagements.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={`/student/deliverables?week=${currentWeek}`}
          className="btn-gradient-primary"
        >
          <FileText className="h-4 w-4" />
          <span>Week {currentWeek} Deliverable</span>
        </Link>
        <Link
          href="/student/team"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all"
        >
          <Users className="h-4 w-4 text-slate-500" />
          <span>Team Workspace</span>
        </Link>
      </div>
    </div>
  );
}
