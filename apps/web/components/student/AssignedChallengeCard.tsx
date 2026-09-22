"use client";

import Link from "next/link";
import { ExternalLink, Building2, UserCheck, Briefcase } from "lucide-react";
import { StudentDashboardChallenge, StudentDashboardMetrics, StudentDashboardData } from "@/types/student_dashboard";

interface Props {
  challenge: StudentDashboardChallenge;
  metrics: StudentDashboardMetrics;
  mentor: StudentDashboardData["mentor"];
}

export function AssignedChallengeCard({ challenge, metrics, mentor }: Props) {
  return (
    <div className="card-custom flex flex-col justify-between h-full space-y-5">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0e9b8a] text-white">
              Live Fellowship Challenge
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">&bull; Non-elective assignment</span>
          </div>
          <Link
            href={`/student/project?id=${challenge.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline"
          >
            <span>Full Problem Spec</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Challenge Company & Title */}
        <div className="flex items-start gap-4 mt-4">
          {challenge.logo_url ? (
            <img
              src={challenge.logo_url}
              alt={challenge.company_name}
              className="h-14 w-14 rounded-xl border border-slate-200 object-cover shadow-xs shrink-0"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0653d] to-[#d6336c] text-white font-black text-xl shadow-sm shrink-0">
              <Building2 className="h-7 w-7 text-white/80" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
              {challenge.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                {challenge.company_name}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                {challenge.industry}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-800 border border-violet-200">
                <Briefcase className="h-3 w-3" />
                {challenge.challenge_owner}
              </span>
            </div>
          </div>
        </div>

        {/* Company Problem Statement Context */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Company Problem Statement &amp; Context:
          </p>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
            {challenge.problem_statement}
          </p>
          {challenge.expected_outcome && (() => {
            // Split "Week 1: Foo Pack Week 2: Bar Pack …" into individual entries
            const parts = challenge.expected_outcome
              .split(/(?=Week\s+\d+\s*:)/i)
              .map((s) => s.trim())
              .filter(Boolean);

            if (parts.length <= 1) {
              return (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                  <strong className="text-slate-700">Target Outcome:</strong>{" "}
                  {challenge.expected_outcome}
                </p>
              );
            }

            return (
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Outcomes
                </p>
                {parts.map((part, i) => {
                  const colonIdx = part.indexOf(":");
                  const label = colonIdx !== -1 ? part.slice(0, colonIdx).trim() : `Week ${i + 1}`;
                  const desc = colonIdx !== -1 ? part.slice(colonIdx + 1).trim() : part;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 inline-flex items-center rounded-md bg-brand-50 border border-brand-200 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 whitespace-nowrap">
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-600 leading-snug">{desc}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3 Metric Tiles (Matching DL_DISCOVER exactly) */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Sessions Done</p>
          <p className="text-lg font-extrabold text-slate-900 mt-0.5">
            {metrics.completed_sessions} <span className="text-xs text-slate-400 font-normal">/ {metrics.total_sessions}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">Outputs Logged</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
            {metrics.completed_outputs} <span className="text-xs text-slate-400 font-normal">/ {metrics.total_outputs}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-xs">
          <p className="text-[11px] font-medium text-slate-500">
            Assigned Mentor
          </p>

          {mentor ? (
            <>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                {mentor.headshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.headshot_url}
                    alt={mentor.full_name}
                    className="h-5 w-5 shrink-0 rounded-full border border-slate-200 object-cover"
                  />
                ) : null}

                <p
                  className="truncate text-sm font-bold text-violet-800"
                  title={mentor.full_name}
                >
                  {mentor.full_name}
                </p>
              </div>

              <p className="truncate text-[10px] text-slate-400">
                {mentor.company_name}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs font-medium text-slate-400">
              Not assigned yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
