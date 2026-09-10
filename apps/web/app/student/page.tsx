"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import {
  UsersRound,
  UserRound,
  Building2,
  FolderGit2,
  CheckCircle2,
  Calendar,
  ArrowRight,
  School,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

const JOURNEY_STAGES = [
  { id: "institution", label: "Institution" },
  { id: "enrolled", label: "Enrolled" },
  { id: "onboarded", label: "Onboarded" },
  { id: "profile", label: "Profile Created" },
  { id: "portal", label: "Portal Access" },
  { id: "cohort", label: "Cohort Assigned" },
  { id: "team", label: "Team Assigned" },
  { id: "mentor", label: "Mentor Assigned" },
  { id: "company", label: "Company Assigned" },
  { id: "project", label: "Project Assigned" },
  { id: "work", label: "Project Active" },
];

export default function StudentDashboard() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentContext() {
      try {
        setLoading(true);
        const user = getStoredUser();
        const data = await fetchStudentPortalContext(user?.id);
        setContext(data);
      } catch (err) {
        console.error("Failed to load student context", err);
        setContext(null);
      } finally {
        setLoading(false);
      }
    }
    loadStudentContext();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span>Loading fellowship dashboard...</span>
        </div>
      </div>
    );
  }

  const storedUser = getStoredUser();
  const studentName = context?.student?.full_name || storedUser?.full_name || "Fellow";
  const institutionName = context?.student?.institution_name || "Institution Partner Pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Student Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {studentName} 👋
          </h1>
          <p className="text-sm text-slate-600">
            DegreeLabs Impact Fellowship &bull; {institutionName}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/50">
          <Sparkles className="h-3.5 w-3.5" />
          Active Fellow
        </div>
      </div>

      {/* 11-Stage Student Journey Progress Stepper */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Fellowship Journey Progression</h2>
          <span className="text-xs font-semibold text-slate-500">Stage: Project Execution Active</span>
        </div>

        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] justify-between">
            {JOURNEY_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex flex-col items-center text-center relative flex-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold ring-4 ring-slate-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="mt-2 text-[11px] font-semibold text-slate-800 line-clamp-1">
                  {stage.label}
                </span>
                <span className="text-[9px] text-slate-400">Step {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3-Column Fellowship Entity Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. My Team & Cohort */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">My Team</h3>
            </div>
            <Link href="/student/team" className="text-xs text-blue-600 font-medium hover:underline">
              View &rarr;
            </Link>
          </div>

          {context?.team ? (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-extrabold text-slate-900">{context.team.name}</p>
                <p className="text-xs text-slate-500">
                  Cohort: <strong>{context.cohort?.name || "Fellowship Cohort"}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-slate-500">Teammates ({context.team.members.length}):</p>
                {context.team.members.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50">
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">You have not been assigned to a team yet.</p>
          )}
        </div>

        {/* 2. Assigned Mentor */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">Assigned Mentor</h3>
            </div>
            <Link href="/student/mentor" className="text-xs text-blue-600 font-medium hover:underline">
              View &rarr;
            </Link>
          </div>

          {context?.mentor ? (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-extrabold text-slate-900">{context.mentor.full_name}</p>
                <p className="text-xs text-slate-600 font-medium">
                  {context.mentor.designation || "Senior Advisor"} &bull; {context.mentor.company_name}
                </p>
              </div>

              {context.mentor.expertise && (
                <div className="flex flex-wrap gap-1">
                  {context.mentor.expertise.map((skill, idx) => (
                    <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{context.mentor.email}</span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                  Weekly Sync
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Your team will be assigned an industry mentor shortly.</p>
          )}
        </div>

        {/* 3. Assigned Company & Project */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">Assigned Project</h3>
            </div>
            <Link href="/student/project" className="text-xs text-blue-600 font-medium hover:underline">
              View &rarr;
            </Link>
          </div>

          {context?.project ? (
            <div className="space-y-3">
              <div>
                <p className="text-base font-extrabold text-slate-900 line-clamp-1">{context.project.title}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>{context.company?.name || "Sponsoring Company"}</span>
                  <span className="text-slate-400">&bull; {context.company?.industry}</span>
                </p>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{context.project.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Timeline: {context.project.start_date} &rarr; {context.project.end_date}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                  {context.project.difficulty}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Company project assignment pending.</p>
          )}
        </div>
      </div>

      {/* Progress & Activity Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Sessions Attended</p>
            <p className="text-xl font-bold text-slate-900">{context?.stats?.sessions_attended || 0} Sessions</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Project Submissions</p>
            <p className="text-xl font-bold text-slate-900">{context?.stats?.submissions_count || 0} Delivered</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <School className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Institution & Graduation</p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {context?.student?.graduation_year ? `Class of ${context.student.graduation_year}` : "Pending Assignment"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}