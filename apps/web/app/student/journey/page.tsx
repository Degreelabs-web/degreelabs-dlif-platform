"use client";

import { useEffect, useState } from "react";
import {
  Route,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { StudentPortalContext } from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

const ONBOARDING_STEPS = [
  { step: 1, title: "Partner Institution", desc: "University partnership established." },
  { step: 2, title: "Student Enrolled", desc: "Nominated and admitted into fellowship." },
  { step: 3, title: "Authentication Provisioned", desc: "Portal credentials provisioned." },
  { step: 4, title: "Profile Created", desc: "Academic and cohort details recorded." },
  { step: 5, title: "Portal Access Unlocked", desc: "Workspace and problem tracks enabled." },
];

const FELLOWSHIP_STEPS = [
  { step: 6, key: "cohort", title: "Cohort Placement", desc: "Assigned to learning batch and sprint calendar." },
  { step: 7, key: "team", title: "Squad Formation", desc: "Matched into a multidisciplinary project squad." },
  { step: 8, key: "mentor", title: "Mentor Pairing", desc: "Paired with industry mentor for 1:1 guidance." },
  { step: 9, key: "company", title: "Enterprise Sponsor", desc: "Matched with corporate problem sponsor." },
  { step: 10, key: "project", title: "Project Assignment", desc: "Challenge scope and quality gates assigned." },
  { step: 11, key: "working", title: "Active Sprint Execution", desc: "Executing weekly deliverables and quality gates." },
];

export default function StudentJourneyPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  function getFellowshipStepStatus(key: string): "completed" | "active" | "pending" {
    if (!context) return "completed";
    if (key === "cohort") return context.cohort ? "completed" : "active";
    if (key === "team") return context.team ? "completed" : context.cohort ? "active" : "pending";
    if (key === "mentor") return context.mentor ? "completed" : context.team ? "active" : "pending";
    if (key === "company") return context.company ? "completed" : context.team ? "active" : "pending";
    if (key === "project") return context.project ? "completed" : context.company ? "active" : "pending";
    if (key === "working") return context.project ? "active" : "pending";
    return "pending";
  }

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fellowship Roadmap
          </span>
        }
        title="My Fellowship Journey"
        subtitle="Track your progression across admissions, team allocation, and live sprint execution."
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Verifying journey milestones…</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Fellowship Stages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="section-title">Program Milestones &amp; Squad Alignment</h2>
              <StatusBadge variant="primary" icon={<Sparkles className="h-3 w-3" />}>
                Live Sprint
              </StatusBadge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FELLOWSHIP_STEPS.map((step) => {
                const status = getFellowshipStepStatus(step.key);
                const isDone = status === "completed";
                const isActive = status === "active";

                return (
                  <SectionCard
                    key={step.step}
                    className={`h-full ${isActive ? "ring-2 ring-brand-500/30" : ""}`}
                    badge={
                      <StatusBadge
                        variant={isDone ? "success" : isActive ? "primary" : "secondary"}
                      >
                        {isDone ? "Completed" : isActive ? "Current" : "Upcoming"}
                      </StatusBadge>
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : isActive
                              ? "bg-brand-600 text-white animate-pulse"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {step.desc}
                        </p>

                        {step.key === "cohort" && context?.cohort && (
                          <p className="text-[11px] font-semibold text-brand-700 pt-1">
                            {context.cohort.name}
                          </p>
                        )}
                        {step.key === "team" && context?.team && (
                          <p className="text-[11px] font-semibold text-brand-700 pt-1">
                            {context.team.name}
                          </p>
                        )}
                        {step.key === "mentor" && context?.mentor && (
                          <p className="text-[11px] font-semibold text-brand-700 pt-1">
                            {context.mentor.full_name} ({context.mentor.company_name})
                          </p>
                        )}
                        {step.key === "company" && context?.company && (
                          <p className="text-[11px] font-semibold text-brand-700 pt-1">
                            {context.company.name}
                          </p>
                        )}
                        {step.key === "project" && context?.project && (
                          <p className="text-[11px] font-semibold text-brand-700 pt-1 truncate">
                            {context.project.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </div>

          {/* Collapsible Onboarding Foundations (Progressive Disclosure) */}
          <div className="card-custom !p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOnboarding(!showOnboarding)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Onboarding Foundations (Steps 1–5 Completed)</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                <span>{showOnboarding ? "Hide" : "Review"}</span>
                {showOnboarding ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {showOnboarding && (
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="grid gap-3 sm:grid-cols-5">
                  {ONBOARDING_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700">
                        <span>Step 0{s.step}</span>
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{s.title}</h4>
                      <p className="text-[11px] text-slate-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
