"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  PartyPopper,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { StudentPortalContext } from "@/types/fellowship";
import { PageHeader, StatusBadge } from "@/components/student/ui";

const ONBOARDING_STEPS = [
  { step: 1, title: "Partner institution", desc: "Your college partnered with the fellowship program." },
  { step: 2, title: "You were enrolled", desc: "You were nominated and admitted into the fellowship." },
  { step: 3, title: "Login access set up", desc: "Your portal username and password were created." },
  { step: 4, title: "Profile completed", desc: "Your academic and personal details were recorded." },
  { step: 5, title: "Portal unlocked", desc: "You got access to your student workspace." },
];

// ── Live-phase steps, in the REAL order they unlock in the backend ──
// Each `key` maps to a field on StudentPortalContext. A step can only be
// "completed" once every step ABOVE it in this list is also completed —
// this is what drives the sequential lock/unlock logic below.
const FELLOWSHIP_STEPS = [
  {
    step: 6,
    key: "company",
    title: "Enterprise sponsor",
    desc: "A real company signs on to sponsor the problem your squad will work on.",
    ctaLabel: "View sponsor",
    ctaHref: "/student/company",
  },
  {
    step: 7,
    key: "project",
    title: "Project assignment",
    desc: "You receive the specific business problem, its scope, and how it will be graded.",
    ctaLabel: "View my project",
    ctaHref: "/student/project",
  },
  {
    step: 8,
    key: "mentor",
    title: "Mentor pairing",
    desc: "An industry professional is assigned to guide your team through the program.",
    ctaLabel: "View my mentor",
    ctaHref: "/student/mentor",
  },
  {
    step: 9,
    key: "team",
    title: "Squad formation",
    desc: "You're grouped into a small team with students from different disciplines.",
    ctaLabel: "Meet my squad",
    ctaHref: "/student/team",
  },
  {
    step: 10,
    key: "cohort",
    title: "Cohort placement",
    desc: "You're placed into a batch of fellows who move through the program together.",
    ctaLabel: "View my cohort",
    ctaHref: "/student",
  },
  {
    step: 11,
    key: "working",
    title: "Active sprint execution",
    desc: "This is the main work phase — your squad researches, builds, and submits weekly deliverables that get reviewed at quality gates.",
    ctaLabel: "Go to deliverables",
    ctaHref: "/student/deliverables",
  },
];

type StepStatus = "completed" | "active" | "pending";

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

  // Live boolean for each backend-driven step, in the real unlock order.
  // "working" has no direct field — it's true once every step above it is done.
  function getFieldDone(key: string): boolean {
    if (!context) return false;
    switch (key) {
      case "company":
        return !!context.company;
      case "project":
        return !!context.project;
      case "mentor":
        return !!context.mentor;
      case "team":
        return !!context.team;
      case "cohort":
        return !!context.cohort;
      default:
        return false;
    }
  }

  function getFellowshipStepStatus(key: string): StepStatus {
    if (!context) return "pending";

    const dependencyKeys = FELLOWSHIP_STEPS.filter((s) => s.key !== "working").map((s) => s.key);
    const idx = dependencyKeys.indexOf(key);

    if (key === "working") {
      const allDone = dependencyKeys.every((k) => getFieldDone(k));
      return allDone ? "active" : "pending";
    }

    const priorKeys = dependencyKeys.slice(0, idx);
    const priorDone = priorKeys.every((k) => getFieldDone(k));
    const ownDone = getFieldDone(key);

    if (ownDone && priorDone) return "completed";
    if (priorDone) return "active";
    return "pending";
  }

  const stepStatuses = FELLOWSHIP_STEPS.map((s) => getFellowshipStepStatus(s.key));
  const completedCount = stepStatuses.filter((s) => s === "completed").length;
  const totalSteps = ONBOARDING_STEPS.length + FELLOWSHIP_STEPS.length;
  const overallCompleted = ONBOARDING_STEPS.length + completedCount;
  const progressPct = Math.round((overallCompleted / totalSteps) * 100);
  const activeStep = FELLOWSHIP_STEPS.find((s) => getFellowshipStepStatus(s.key) === "active");
  const isAllComplete = !activeStep;

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fellowship Roadmap
          </span>
        }
        title="My Fellowship Journey"
        subtitle="A simple map of where you've been and what happens next — no guesswork required."
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
          {/* ───────── Progress Overview Hero ───────── */}
          <div className="card-custom !p-0 overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-800 via-brand-600 to-fuchsia-500 px-6 py-7 sm:px-8 sm:py-8">
              <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full bg-white/10" />
              <div className="absolute right-40 top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur">
                    {isAllComplete ? (
                      <PartyPopper className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isAllComplete ? "Fully Onboarded" : "You are here"}
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {isAllComplete
                      ? "You're all set up and in active sprint execution."
                      : `You're on step ${activeStep!.step} of ${totalSteps}: ${activeStep!.title}.`}
                  </h2>
                  <p className="max-w-md text-sm font-medium text-white/80">
                    {isAllComplete
                      ? "Everything's in place — keep an eye on your weekly deliverables and quality gates."
                      : activeStep?.desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="text-4xl font-extrabold text-white sm:text-5xl">{progressPct}%</span>
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-white/20 sm:w-48">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-white/70">
                    {overallCompleted} of {totalSteps} steps done
                  </span>
                </div>
              </div>
            </div>

            {/* What's next strip */}
            {activeStep && (
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-brand-50/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {activeStep.step}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      What happens next
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{activeStep.title}</p>
                  </div>
                </div>
                <Link
                  href={activeStep.ctaHref}
                  className="btn-gradient-primary inline-flex shrink-0 items-center gap-1.5 !py-2 !px-4 !text-xs"
                >
                  <span>{activeStep.ctaLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ───────── Connected Vertical Timeline ───────── */}
          <div className="card-custom">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your fellowship, step by step</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Each step unlocks the next. Completed steps are locked in — you can't lose progress.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {completedCount} of {FELLOWSHIP_STEPS.length} live-phase steps done
              </span>
            </div>

            <ol className="relative space-y-0">
              {FELLOWSHIP_STEPS.map((step, idx) => {
                const status = getFellowshipStepStatus(step.key);
                const isDone = status === "completed";
                const isActive = status === "active";
                const isPending = status === "pending";
                const isLast = idx === FELLOWSHIP_STEPS.length - 1;

                const detail =
                  step.key === "company"
                    ? context?.company?.name
                    : step.key === "project"
                      ? context?.project?.title
                      : step.key === "mentor"
                        ? context?.mentor
                          ? `${context.mentor.full_name} · ${context.mentor.company_name}`
                          : undefined
                        : step.key === "team"
                          ? context?.team?.name
                          : step.key === "cohort"
                            ? context?.cohort?.name
                            : undefined;

                return (
                  <li key={step.step} className="relative flex gap-4 pb-8 last:pb-0">
                    {/* Connector line */}
                    {!isLast && (
                      <span
                        className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${isDone ? "bg-emerald-300" : "bg-slate-200"
                          }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Node */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-md shadow-brand-600/30 ring-4 ring-brand-100"
                            : "bg-white text-slate-400 ring-2 ring-slate-200"
                        }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isPending ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        step.step
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={`min-w-0 flex-1 rounded-2xl border p-4 transition-all sm:p-5 ${isActive
                          ? "border-brand-300 bg-brand-50/30 shadow-sm"
                          : isDone
                            ? "border-emerald-200/70 bg-emerald-50/20"
                            : "border-slate-200 bg-slate-50/40"
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold leading-snug text-slate-900">{step.title}</h3>
                        <StatusBadge variant={isDone ? "success" : isActive ? "primary" : "secondary"}>
                          {isDone ? "Done" : isActive ? "In progress" : "Locked"}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{step.desc}</p>

                      {isDone && detail && (
                        <p className="mt-2 truncate text-[11px] font-semibold text-emerald-700">
                          ✓ {detail}
                        </p>
                      )}

                      {isActive && (
                        <Link
                          href={step.ctaHref}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          <span>{step.ctaLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}

                      {isPending && (
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          Unlocks once the previous step is complete.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ───────── Onboarding Foundations (Progressive Disclosure) ───────── */}
          <div className="card-custom !p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOnboarding(!showOnboarding)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">
                    How you got here (steps 1–5)
                  </span>
                  <span className="block text-xs font-medium text-slate-400">
                    Already done before you logged in for the first time.
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
                {showOnboarding ? "Hide" : "Show"}
                {showOnboarding ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>

            {showOnboarding && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-5">
                  {ONBOARDING_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700">
                        <span>Step 0{s.step}</span>
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <h4 className="text-xs font-bold leading-snug text-slate-900">{s.title}</h4>
                      <p className="text-[11px] leading-relaxed text-slate-500">{s.desc}</p>
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