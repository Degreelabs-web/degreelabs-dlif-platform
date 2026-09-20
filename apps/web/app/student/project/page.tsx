"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  AlertOctagon,
  ListCheck,
  Briefcase,
  Sparkles,
  AlertTriangle,
  Target,
  BarChart3,
  CheckSquare,
  Square,
  ArrowRight,
  Loader2,
  Users,
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

export default function StudentProjectDetailPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);

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
      <div className="card-custom flex min-h-[280px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="font-medium text-slate-700">Loading Assigned Challenge…</span>
        </div>
      </div>
    );
  }

  const project = context?.project;
  const company = context?.company;
  const mentor = context?.mentor || dashboardData?.mentor;
  const team = context?.team || dashboardData?.team;

  if (!project) {
    return (
      <div className="page-container">
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          headline="No Project Assigned"
          description="You have not been assigned a company challenge yet. Please check back later or contact your program coordinator."
        />
      </div>
    );
  }

  const title = project.title ?? "";
  const code = project.code ?? "";
  const challengeArea = project.challenge_area ?? "";
  const companyName = company?.name ?? "";
  const companyLogoUrl = company?.logo_url ?? "";
  const challengeOwner = project.company_challenge_owner || company?.founder_sponsor || "";
  const challengeStatement = project.challenge_statement || project.description || "";
  const whyItMatters = project.why_it_matters || "";
  const questionsToInvestigate = project.questions_to_investigate || [];
  const projectBoundaries = project.project_boundaries || [];
  const northStarMetric = project.north_star_metric || "";
  const supportingMeasures = project.supporting_measures || [];
  const contextFigures = project.related_context_figures || {};

  const baselineFigures = [
    { label: "VIL Requests/Mo", value: contextFigures.vil_requests_per_month, highlight: false },
    { label: "Visas Issued/Mo", value: contextFigures.patients_obtaining_visas_per_month, highlight: false },
    { label: "Tracked Arrivals", value: contextFigures.known_tracked_arrivals, highlight: false },
    { label: "Partner Hospitals", value: contextFigures.hospital_network, highlight: false },
    { label: "Bangladesh Share", value: contextFigures.bangladesh_patient_share, highlight: false },
  ];

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge variant="primary">Assigned Project</StatusBadge>
            {challengeArea && <StatusBadge variant="secondary">{challengeArea}</StatusBadge>}
            {code && <span className="font-mono text-xs text-slate-500 font-bold">{code}</span>}
          </div>
        }
        title={title}
        subtitle={`Live enterprise challenge sponsored by ${companyName}. 4-week Discover investigation.`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/student/company"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:!border-brand-300 hover:text-brand-700"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Company Dossier</span>
            </Link>
            <Link
              href="/student/submissions"
              className="btn-gradient-primary !py-2 !px-3.5 !text-xs"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Submit Milestone</span>
            </Link>
          </div>
        }
      />

      {/* Operational Baseline Figures Banner */}
      {Object.keys(contextFigures).length > 0 && (
        <div className="card-custom !p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-800 via-brand-600 to-fuchsia-500" />
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Operational Baseline Figures (Estimates)
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Context benchmarks</span>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {baselineFigures.map((figure, idx) => (
                <div
                  key={figure.label}
                  className={`rounded-2xl px-3 py-4 text-center ring-1 ${idx === baselineFigures.length - 1 ? "col-span-2 md:col-span-1" : ""
                    } ${figure.highlight
                      ? "bg-rose-50 ring-rose-200"
                      : "bg-slate-50/80 ring-slate-100"
                    }`}
                >
                  <div
                    className={`text-2xl font-extrabold tracking-tight ${figure.highlight ? "text-rose-700" : "text-slate-900"
                      }`}
                  >
                    {figure.value || "—"}
                  </div>
                  <div
                    className={`mt-1 text-[11px] ${figure.highlight ? "font-bold text-rose-800" : "font-semibold text-slate-500"
                      }`}
                  >
                    {figure.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left 8 cols + Right 4 cols */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Problem Spec */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8 [&>*:last-child]:flex-1">
          {/* Challenge Statement */}
          <SectionCard
            title="Core Challenge Statement"
            icon={<AlertOctagon className="h-5 w-5 text-brand-600" />}
          >
            <div className="rounded-2xl border border-l-4 !border-l-brand-600 bg-gradient-to-r from-violet-50/70 to-white p-5">
              <p className="text-sm font-semibold leading-relaxed text-slate-900 sm:text-base">
                &ldquo;{challengeStatement}&rdquo;
              </p>
            </div>
          </SectionCard>

          {/* Why It Matters */}
          {whyItMatters && (
            <SectionCard
              title="Commercial &amp; Care Impact"
              icon={<Sparkles className="h-5 w-5 text-teal-600" />}
            >
              <div className="rounded-2xl bg-gradient-to-br from-teal-50/70 to-white p-5 ring-1 ring-teal-100">
                <p className="text-sm leading-relaxed text-slate-700">{whyItMatters}</p>
              </div>
            </SectionCard>
          )}

          {/* Questions to Investigate */}
          {questionsToInvestigate.length > 0 && (
            <SectionCard
              title="Key Questions to Investigate"
              icon={<ListCheck className="h-5 w-5 text-brand-600" />}
              description="Squad discovery checklist"
            >
              <div className="space-y-2.5">
                {questionsToInvestigate.map((question, idx) => {
                  const isChecked = Boolean(checkedQuestions[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleQuestion(idx)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl p-3.5 ring-1 transition-all ${isChecked
                        ? "bg-emerald-50/60 text-emerald-950 ring-emerald-200"
                        : "bg-slate-50/70 text-slate-800 ring-slate-200/80 hover:bg-violet-50/60 hover:ring-brand-300"
                        }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-[18px] w-[18px] text-emerald-600" />
                        ) : (
                          <Square className="h-[18px] w-[18px] text-slate-400" />
                        )}
                      </button>
                      <span
                        className={`text-[13px] font-medium leading-relaxed ${isChecked ? "text-slate-500 line-through" : ""
                          }`}
                      >
                        {question}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column: Metrics & Stakeholders */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4 [&>*:last-child]:flex-1">
          {/* North Star Metric & Supporting Measures */}
          <SectionCard
            title="North Star &amp; Measures"
            icon={<Target className="h-5 w-5 text-brand-600" />}
          >
            <div className="space-y-5">
              <div>
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  North Star Metric
                </span>
                <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-fuchsia-600 p-4 shadow-md shadow-brand-600/20">
                  <p className="text-sm font-bold leading-relaxed text-white">
                    {northStarMetric || "Operational visibility improvement across transit stages."}
                  </p>
                </div>
              </div>

              {supportingMeasures.length > 0 && (
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Supporting Health Measures
                  </span>
                  <div className="space-y-2">
                    {supportingMeasures.map((measure, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 text-xs font-medium text-slate-800 ring-1 ring-slate-100"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{measure}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Sponsoring Partner Attribution */}
          <SectionCard
            title="Sponsoring Partner"
            icon={<Building2 className="h-4 w-4" />}
            footerAction={
              <Link
                href="/student/company"
                className="inline-flex w-full items-center justify-between gap-1 text-xs font-bold text-brand-600 hover:underline"
              >
                <span>View Full Company Dossier</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {companyLogoUrl && !companyLogoFailed && (
              <div className="mb-4 flex justify-center rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogoUrl}
                  alt={`${companyName} logo`}
                  onError={() => setCompanyLogoFailed(true)}
                  className="h-24 w-auto max-w-full object-contain"
                />
              </div>
            )}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Enterprise:</span>
                <span className="text-right font-bold text-slate-900">{companyName}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Challenge Sponsor:</span>
                <span className="text-right font-semibold text-slate-800">{challengeOwner || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="text-right font-semibold text-slate-800">{team?.name || "—"}</span>
              </div>
            </div>
          </SectionCard>

          {/* Mentor Guidance Attribution */}
          {mentor && (
            <SectionCard
              title="Dedicated Mentor"
              icon={<Users className="h-4 w-4" />}
              footerAction={
                <Link
                  href="/student/mentor"
                  className="inline-flex w-full items-center justify-between gap-1 text-xs font-bold text-brand-600 hover:underline"
                >
                  <span>View Mentor Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-base font-bold text-white shadow-md shadow-brand-600/20">
                  {mentor.full_name?.charAt(0) || "M"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-slate-900">{mentor.full_name}</h4>
                  <p className="truncate text-xs text-slate-500">
                    {mentor.designation || "Industry Mentor"}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Hard Constraints / Project Boundaries (full width so both columns above stay balanced) */}
      {projectBoundaries.length > 0 && (
        <SectionCard
          title="Project Boundaries (Hard Constraints)"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          badge={<StatusBadge variant="warning">Non-Negotiable</StatusBadge>}
        >
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50/70 p-3.5 text-xs font-medium leading-relaxed text-amber-900 ring-1 ring-amber-200">
              Proposals violating these boundaries will fail Quality Gate reviews.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {projectBoundaries.map((boundary, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3.5 text-[13px] font-medium text-slate-800 ring-1 ring-slate-200/80"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-700">
                    ✕
                  </span>
                  <span className="leading-relaxed">{boundary}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}