"use client";

import Link from "next/link";
import { FileText, Users, Sparkles } from "lucide-react";
import { StudentDashboardData } from "@/types/student_dashboard";

interface Props {
  data: StudentDashboardData;
}

export function StudentDashboardHeader({ data }: Props) {
  const currentWeek = data.team?.current_week ?? 1;
  const currentSession = data.team?.current_session ?? 1;
  const teamName = data.team?.name ?? "Team";
  return (
    <div
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl p-4 sm:p-6 md:flex-row md:items-center md:justify-between"
      style={{ background: "linear-gradient(120deg, #2a1454 0%, #4c1d95 45%, #7c2d12 100%)" }}
    >
      {/* Decorative accent circles */}
      <div
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(240,101,61,0.4), transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(14,155,138,0.3), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #7c3aed, #d6336c)" }}
          >
            <Sparkles className="h-3 w-3 text-white" />
            Week {currentWeek} of 4
          </span>
          <span className="text-sm font-medium text-violet-200/80">
            &bull; {teamName}
          </span>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #f0653d, #d6336c)" }}
          >
            Session {currentSession} of 12
          </span>
        </div>
        <h1 className="break-words text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          Welcome back, {data.student.full_name} 👋
        </h1>
        <p className="mt-1.5 text-base text-violet-100/80 max-w-3xl leading-relaxed">
          Track your team&apos;s Discover progress, weekly deliverables, upcoming sessions, and mentor engagements.
        </p>
      </div>

      <div className="relative flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:w-auto shrink-0">
        <Link
          href={`/student/deliverables?week=${currentWeek}`}
          className="btn-gradient-primary w-full justify-center sm:w-auto"
        >
          <FileText className="h-4 w-4" />
          <span>Week {currentWeek} Deliverable</span>
        </Link>
        <Link
          href="/student/team"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
        >
          <Users className="h-4 w-4 text-white" />
          <span>Team Workspace</span>
        </Link>
      </div>
    </div>
  );
}
