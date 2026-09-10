"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Route,
  CheckCircle2,
  Clock,
  Building2,
  BookOpen,
  UsersRound,
  UserRound,
  Briefcase,
  FolderGit2,
  PlayCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { StudentPortalContext } from "@/types/fellowship";

const JOURNEY_STEPS = [
  {
    step: 1,
    id: "institution",
    title: "Partner Institution",
    description: "University partnership established with DegreeLabs Impact Fellowship.",
  },
  {
    step: 2,
    id: "enrolled",
    title: "Student Enrolled",
    description: "Nominated and admitted into the fellowship program.",
  },
  {
    step: 3,
    id: "onboarded",
    title: "Authentication Provisioned",
    description: "Portal identity credentials and platform security access provisioned.",
  },
  {
    step: 4,
    id: "profile",
    title: "Student Profile Created",
    description: "Academic profile, course, branch, and graduation details recorded.",
  },
  {
    step: 5,
    id: "portal_access",
    title: "Student Gets Portal Access",
    description: "Access unlocked to workspace, sessions schedule, and problem tracks.",
  },
  {
    step: 6,
    id: "cohort",
    title: "Assigned To Cohort",
    description: "Assigned to a university fellowship learning batch and calendar.",
  },
  {
    step: 7,
    id: "team",
    title: "Assigned To Team",
    description: "Placed into a specialized multidisciplinary project squad.",
  },
  {
    step: 8,
    id: "mentor",
    title: "Team Assigned Mentor",
    description: "Paired with a senior industry technology architect for 1:1 guidance.",
  },
  {
    step: 9,
    id: "company",
    title: "Team Assigned Company",
    description: "Matched with an industry enterprise sponsor partner.",
  },
  {
    step: 10,
    id: "project",
    title: "Company Assigned Project",
    description: "Project scope, technical deliverables, and roadmap assigned.",
  },
  {
    step: 11,
    id: "working",
    title: "Student Works On Project",
    description: "Active sprint execution, weekly session milestones, and deliverables reviews.",
  },
];

export default function StudentJourneyPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJourney() {
      try {
        setLoading(true);
        const user = getStoredUser();
        if (user) {
          const data = await fetchStudentPortalContext(user.id);
          setContext(data);
        }
      } catch (err) {
        console.error("Failed to load student journey context", err);
      } finally {
        setLoading(false);
      }
    }

    loadJourney();
  }, []);

  function getStepState(index: number) {
    if (!context) return "completed"; // Default fallback
    if (index < 5) return "completed";
    if (index === 5) return context.cohort ? "completed" : "active";
    if (index === 6) {
      if (!context.cohort) return "pending";
      return context.team ? "completed" : "active";
    }
    if (index === 7) {
      if (!context.team) return "pending";
      return context.mentor ? "completed" : "active";
    }
    if (index === 8) {
      if (!context.team) return "pending";
      return context.company ? "completed" : "active";
    }
    if (index === 9) {
      if (!context.company) return "pending";
      return context.project ? "completed" : "active";
    }
    if (index === 10) {
      if (!context.project) return "pending";
      return "active";
    }
    return "pending";
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Fellowship Roadmap
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Fellowship Journey
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your progress through all 11 milestone stages from initial enrollment to industry project execution.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Verifying journey milestones...</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Stepper Vertical Track */}
          <div className="space-y-6">
            {JOURNEY_STEPS.map((step, idx) => {
              const state = getStepState(idx);
              const isDone = state === "completed";
              const isActive = state === "active";

              return (
                <div
                  key={step.id}
                  className={`relative flex items-start gap-4 rounded-2xl border p-5 transition-all ${
                    isActive
                      ? "border-slate-900 bg-white shadow-md ring-2 ring-slate-900/10"
                      : isDone
                      ? "border-slate-200 bg-white shadow-sm"
                      : "border-slate-200/60 bg-slate-50/50 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isActive
                        ? "bg-slate-900 text-white animate-pulse"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : step.step}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {step.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isDone
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : isActive
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isDone ? "Completed" : isActive ? "Current Stage" : "Upcoming"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      {step.description}
                    </p>

                    {/* Stage dynamic metadata */}
                    {idx === 0 && context?.student.institution_name && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Institution: {context.student.institution_name}
                      </p>
                    )}
                    {idx === 5 && context?.cohort && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Cohort: {context.cohort.name} ({context.cohort.academic_year})
                      </p>
                    )}
                    {idx === 6 && context?.team && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Squad: {context.team.name} • Role: {context.team.role}
                      </p>
                    )}
                    {idx === 7 && context?.mentor && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Assigned Mentor: {context.mentor.full_name} ({context.mentor.company_name})
                      </p>
                    )}
                    {idx === 8 && context?.company && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Sponsor Partner: {context.company.name} ({context.company.industry})
                      </p>
                    )}
                    {idx === 9 && context?.project && (
                      <p className="mt-2 text-xs font-semibold text-slate-900">
                        Project: {context.project.title}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
