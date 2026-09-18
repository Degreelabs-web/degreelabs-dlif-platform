"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Lock,
  AlertOctagon,
  ListCheck,
  Briefcase,
  Users,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Target,
  BarChart3,
  CheckSquare,
  Square,
  ArrowRight,
  Info,
  HelpCircle,
  Clock,
  Layers,
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";

export default function StudentProjectDetailPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Interactive state for questions to investigate checklist
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ctxRes, dashRes] = await Promise.allSettled([
          fetchStudentPortalContext(),
          fetchStudentDashboard(),
        ]);
        if (ctxRes.status === "fulfilled") setContext(ctxRes.value);
        if (dashRes.status === "fulfilled") setDashboardData(dashRes.value);
      } catch (err) {
        console.error("Failed to load project details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleQuestion = (idx: number) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2E5AA8] border-t-transparent" />
          <span className="font-medium text-slate-700">Loading Assigned Challenge...</span>
        </div>
      </div>
    );
  }

  const project = context?.project;
  const company = context?.company;
  const mentor = context?.mentor || dashboardData?.mentor;
  const team = context?.team || dashboardData?.team;

  // All data from backend — no hardcoded fallbacks
  const title = project?.title ?? "";
  const code = project?.code ?? "";
  const challengeArea = project?.challenge_area ?? "";
  const companyName = company?.name ?? "";
  const challengeOwner = project?.company_challenge_owner || company?.founder_sponsor || "";

  const challengeStatement = project?.challenge_statement || project?.description || "";
  const whyItMatters = project?.why_it_matters || "";
  const questionsToInvestigate = project?.questions_to_investigate || [];
  const projectBoundaries = project?.project_boundaries || [];
  const northStarMetric = project?.north_star_metric || "";
  const supportingMeasures = project?.supporting_measures || [];
  const contextFigures = project?.related_context_figures || {};

  // Parse discover_timeline from backend format { week_1: { focus, output }, ... }
  const rawTimeline = project?.discover_timeline || {};
  const timelineSteps = Object.entries(rawTimeline).map(([key, value]) => {
    const weekNum = parseInt(key.replace("week_", ""), 10) || 0;
    const v = value as { focus?: string; output?: string };
    return {
      week: weekNum,
      name: `Week ${weekNum}`,
      focus: v?.focus || "",
      deliverable: v?.output || "",
    };
  }).sort((a, b) => a.week - b.week);

  // If no project data is available, show an empty state
  if (!project) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Project Assigned</h2>
          <p className="text-sm text-slate-500">
            You have not been assigned a company challenge yet. Please check back later or contact your program coordinator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (Matching DL_DISCOVER design language) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              Assigned Company Project
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ED1C24]" />
              {challengeArea}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Lock className="h-3 w-3" />
              Non-Elective Assignment
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
              {code}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Live enterprise challenge sponsored by{" "}
            <strong className="text-slate-900">{companyName}</strong>. Fellowship squads conduct a rigorous 4-week Discover investigation to formulate an executive proposal.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/company"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Building2 className="h-4 w-4 text-[#2E5AA8]" />
            <span>Sponsoring Company</span>
          </Link>
          <Link
            href="/student/submissions"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5AA8] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#234582] transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Submit Milestone</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Context Figures Banner (Company-Provided Estimates) */}
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#2E5AA8]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E5AA8]">
              Operational Baseline Figures (Company Context Estimates)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Estimated benchmarks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {contextFigures.vil_requests_per_month}
            </div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">
              VIL Requests / Month
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {contextFigures.patients_obtaining_visas_per_month}
            </div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">
              Visas Issued / Month
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-center">
            <div className="text-lg sm:text-xl font-extrabold text-[#ED1C24]">
              {contextFigures.known_tracked_arrivals}
            </div>
            <div className="text-[10px] font-bold text-red-800 mt-0.5">
              Known Tracked Arrivals
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {contextFigures.hospital_network}
            </div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">
              Partner Hospitals
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center">
            <div className="text-lg sm:text-xl font-extrabold text-slate-900">
              {contextFigures.bangladesh_patient_share}
            </div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">
              Bangladesh Patient Share
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Left 8 cols + Right 4 cols */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Challenge Statement */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertOctagon className="h-5 w-5 text-[#ED1C24]" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Core Challenge Statement
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-[#ED1C24]">
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold">
                &ldquo;{challengeStatement}&rdquo;
              </p>
            </div>
          </div>

          {/* Card 2: Why It Matters (Commercial Stakes) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="h-5 w-5 text-[#39B54A]" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Why It Matters (Commercial &amp; Care Impact)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {whyItMatters}
            </p>
          </div>

          {/* Card 3: Questions to Investigate (Interactive Checklist Style) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListCheck className="h-5 w-5 text-[#2E5AA8]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Key Questions to Investigate
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Squad Discovery Checklist
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Fellows should gather validated evidence across primary and secondary sources to answer each strategic inquiry:
            </p>

            <div className="space-y-2.5">
              {questionsToInvestigate.map((question, idx) => {
                const isChecked = Boolean(checkedQuestions[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleQuestion(idx)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                        : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    <span className={`text-xs font-medium leading-relaxed ${isChecked ? "line-through text-slate-500" : ""}`}>
                      {question}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Project Boundaries (HARD CONSTRAINTS - Flagged Clearly) */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-extrabold text-amber-950 text-base">
                  Project Boundaries (Hard Constraints)
                </h3>
              </div>
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                Non-Negotiable
              </span>
            </div>

            <div className="rounded-xl bg-white border border-amber-200 p-3 text-xs text-amber-900 font-medium leading-relaxed">
              ⚠️ <strong>Critical Guideline:</strong> The following boundaries are hard constraints established by company leadership and fellowship governance. Proposals violating these boundaries will fail Quality Gate reviews.
            </div>

            <div className="space-y-2">
              {projectBoundaries.map((boundary, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200/60 bg-white text-xs font-medium text-slate-800"
                >
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[#ED1C24] font-bold text-[10px]">
                    ✕
                  </span>
                  <span className="leading-relaxed">{boundary}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: 4-Week Discover Horizontal Stepper & Gates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#2E5AA8]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  4-Week Discover Gate Stepper
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Weekly Gate Sequence
              </span>
            </div>

            {/* Horizontal Timeline Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {timelineSteps.map((step) => (
                <div
                  key={step.week}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E5AA8]">
                        {step.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                        {step.focus}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 leading-snug">
                      {step.deliverable}
                    </h5>
                  </div>
                  {project?.gate_schedule?.[`week_${step.week}_gate`] && (
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
                      <strong>Quality Gate:</strong> {project.gate_schedule[`week_${step.week}_gate`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Right Card 1: North Star & Supporting Measures */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Target className="h-5 w-5 text-[#ED1C24]" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                North Star &amp; Supporting Measures
              </h3>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                North Star Metric
              </span>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                  {northStarMetric}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                5 Supporting Health Measures
              </span>
              <div className="space-y-1.5">
                {supportingMeasures.map((measure, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2E5AA8]/10 text-[#2E5AA8] font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{measure}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Card 2: Enterprise Sponsor & Stakeholders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#2E5AA8]" />
                <span>Sponsoring Company</span>
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Matched
              </span>
            </div>

            <div className="flex items-center gap-3">
              {company?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_url}
                  alt={companyName}
                  className="h-12 w-12 rounded-xl object-contain border border-slate-200 p-1 shadow-2xs"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base">
                  {companyName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{companyName}</h4>
                <p className="text-xs text-slate-500 truncate">
                  {company?.category || ""}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Challenge Sponsor:</span>
                <span className="font-bold text-slate-900">{challengeOwner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Accreditation:</span>
                <span className="font-semibold text-emerald-700">
                  {company?.accreditation || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="font-semibold text-slate-800">
                  {team?.name || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cohort Kickoff:</span>
                <span className="font-semibold text-slate-800">{project?.cohort_date || "—"}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/student/company"
                className="inline-flex items-center justify-center w-full gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <span>View Company Profile</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Right Card 3: Dedicated Team Mentor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#39B54A]" />
                <span>Dedicated Team Mentor</span>
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Assigned
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E5AA8] text-white font-bold text-sm shadow-2xs">
                {mentor?.full_name ? mentor.full_name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  {mentor?.full_name || "—"}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {mentor?.designation || "—"}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Available for squad guidance, weekly quality gate critiques, and strategic reasoning reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
