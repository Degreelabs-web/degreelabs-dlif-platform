"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Building2,
  Briefcase,
  Target,
  Sparkles,
  CalendarCheck,
  FileCheck2,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { StudentDashboardChallenge, StudentDashboardMetrics, StudentDashboardData } from "@/types/student_dashboard";

interface Props {
  challenge: StudentDashboardChallenge;
  metrics: StudentDashboardMetrics;
  mentor: StudentDashboardData["mentor"];
}

export function AssignedChallengeCard({ challenge, metrics, mentor }: Props) {
  const [mentorImgError, setMentorImgError] = useState(false);

  // Compute initials for clean avatar fallback if photo fails
  const mentorInitials = mentor?.full_name
    ? mentor.full_name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "DL";

  // Resolve mentor headshot: use direct local asset for Samatha or mentor.headshot_url
  const resolvedMentorPhoto =
    mentor?.full_name?.toLowerCase().includes("samatha") ||
    mentor?.full_name?.toLowerCase().includes("manchala")
      ? "/students/samatha_photo.jpeg"
      : mentor?.headshot_url || "/students/samatha_photo.jpeg";

  return (
    <div className="card-custom flex flex-col justify-between h-full space-y-4 !p-5 sm:!p-6 bg-gradient-to-b from-white via-slate-50/30 to-white shadow-xs hover:shadow-md transition-all relative overflow-hidden">
      {/* Top subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600" />

      <div>
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-xs">
              <Briefcase className="h-3.5 w-3.5 text-sky-400" />
              Assigned Industry Challenge
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
              <ShieldAlert className="h-3 w-3 text-amber-600" />
              Non-Elective
            </span>
          </div>

          <Link
            href={`/student/project?id=${challenge.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-all shadow-2xs group"
          >
            <span>Full Problem Spec</span>
            <ExternalLink className="h-3.5 w-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Challenge Company & Title Hero */}
        <div className="flex items-start gap-4 pt-4">
          {challenge.logo_url ? (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={challenge.logo_url}
                alt={challenge.company_name}
                className="h-16 w-16 rounded-2xl border-2 border-slate-200 object-contain p-1 bg-white shadow-xs"
              />
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"
                title="Verified Industry Sponsor"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-black text-xl shadow-sm shrink-0">
              <Building2 className="h-8 w-8 text-sky-200" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href="/student/company"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Building2 className="h-3 w-3 text-sky-300" />
                {challenge.company_name}
              </Link>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {challenge.industry}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Live Fellowship Challenge
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug tracking-tight">
              {challenge.title}
            </h3>

            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="text-slate-400">Industry Sponsor &amp; Owner:</span>
              <strong className="text-slate-800">{challenge.challenge_owner}</strong>
            </p>
          </div>
        </div>

        {/* Company Problem Statement Context Block */}
        <div className="mt-4 rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/30 p-4 space-y-2.5 shadow-2xs border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-sky-600" />
              Problem Statement &amp; Context
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-200">
              Core Friction
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium line-clamp-4">
            {challenge.problem_statement}
          </p>

          {challenge.expected_outcome && (
            <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-start gap-1.5 text-xs">
              <span className="shrink-0 font-extrabold text-emerald-800 flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Target Outcome:
              </span>
              <span className="text-slate-700 font-medium leading-relaxed">
                {challenge.expected_outcome}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Perfectly Aligned Metric Tiles (Moved down with generous spacing) */}
      <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-200/70">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tile 1: Sessions Done */}
          <div className="h-full min-h-[102px] rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-white p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Sessions Done
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                <CalendarCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-1.5 flex items-baseline">
              <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metrics.completed_sessions}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">
                / {metrics.total_sessions}
              </span>
            </div>

            <p className="text-[11px] text-sky-700 font-semibold truncate pt-1 border-t border-sky-100/60">
              12 Structured Workshops
            </p>
          </div>

          {/* Tile 2: Outputs Logged */}
          <div className="h-full min-h-[102px] rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-white p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Outputs Logged
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <FileCheck2 className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-1.5 flex items-baseline">
              <span className="text-2xl font-black text-emerald-700 tracking-tight leading-none">
                {metrics.completed_outputs}
              </span>
              <span className="text-xs text-slate-400 font-bold ml-1">
                / {metrics.total_outputs}
              </span>
            </div>

            <p className="text-[11px] text-emerald-700 font-semibold truncate pt-1 border-t border-emerald-100/60">
              4 Quality Gate Dossiers
            </p>
          </div>

          {/* Tile 3: Assigned Mentor */}
          <div className="h-full min-h-[102px] rounded-xl border border-purple-200/90 bg-gradient-to-br from-purple-50/90 via-white to-white p-3.5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Assigned Mentor
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="my-1.5 flex items-center gap-2.5 min-w-0">
              {!mentorImgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedMentorPhoto}
                  alt={mentor?.full_name || "Assigned Mentor"}
                  onError={() => setMentorImgError(true)}
                  className="h-8 w-8 shrink-0 rounded-full object-cover border-2 border-purple-300 shadow-xs"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-[11px] font-black text-white shadow-2xs">
                  {mentorInitials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-black text-slate-900 truncate leading-tight"
                  title={mentor?.full_name || "Assigned Mentor"}
                >
                  {mentor?.full_name || "Manchala Samatha"}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-purple-700 font-semibold truncate pt-1 border-t border-purple-100/60">
              {mentor?.company_name || "DLIF Specialist Mentor"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Links Row */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          href="/student/company"
          className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-sky-700 transition-colors"
        >
          <span>About {challenge.company_name}</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href={`/student/project?id=${challenge.id}`}
          className="inline-flex items-center gap-1 font-extrabold text-sky-700 hover:text-sky-900 hover:underline"
        >
          <span>View Challenge Boundaries &amp; Metrics</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
