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
  ExternalLink,
  ShieldCheck,
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
  const challengeOwner = project.company_challenge_owner || company?.founder_sponsor || "";
  const challengeStatement = project.challenge_statement || project.description || "";
  const whyItMatters = project.why_it_matters || "";
  const questionsToInvestigate = project.questions_to_investigate || [];
  const projectBoundaries = project.project_boundaries || [];
  const northStarMetric = project.north_star_metric || "";
  const supportingMeasures = project.supporting_measures || [];
  const contextFigures = project.related_context_figures || {};

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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
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
        <div className="card-custom !p-4 bg-gradient-to-r from-violet-50/50 via-white to-fuchsia-50/30 border-violet-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Operational Baseline Figures (Estimates)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Context benchmarks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center">
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {contextFigures.vil_requests_per_month || "—"}
              </div>
              <div className="text-[10px] font-medium text-slate-500">VIL Requests/Mo</div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center">
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {contextFigures.patients_obtaining_visas_per_month || "—"}
              </div>
              <div className="text-[10px] font-medium text-slate-500">Visas Issued/Mo</div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-2.5 text-center">
              <div className="text-base sm:text-lg font-bold text-rose-700">
                {contextFigures.known_tracked_arrivals || "—"}
              </div>
              <div className="text-[10px] font-bold text-rose-800">Tracked Arrivals</div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center">
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {contextFigures.hospital_network || "—"}
              </div>
              <div className="text-[10px] font-medium text-slate-500">Partner Hospitals</div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-center">
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {contextFigures.bangladesh_patient_share || "—"}
              </div>
              <div className="text-[10px] font-medium text-slate-500">Bangladesh Share</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left 8 cols + Right 4 cols */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Problem Spec & Boundaries */}
        <div className="lg:col-span-8 space-y-6">
          {/* Challenge Statement */}
          <SectionCard
            title="Core Challenge Statement"
            icon={<AlertOctagon className="h-5 w-5 text-brand-600" />}
          >
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-brand-600">
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold">
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
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {whyItMatters}
              </p>
            </SectionCard>
          )}

          {/* Questions to Investigate */}
          {questionsToInvestigate.length > 0 && (
            <SectionCard
              title="Key Questions to Investigate"
              icon={<ListCheck className="h-5 w-5 text-brand-600" />}
              description="Squad discovery checklist"
            >
              <div className="space-y-2">
                {questionsToInvestigate.map((question, idx) => {
                  const isChecked = Boolean(checkedQuestions[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleQuestion(idx)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-slate-800"
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <span
                        className={`text-xs font-medium leading-relaxed ${
                          isChecked ? "line-through text-slate-500" : ""
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

          {/* Hard Constraints / Project Boundaries */}
          {projectBoundaries.length > 0 && (
            <SectionCard
              title="Project Boundaries (Hard Constraints)"
              icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              badge={<StatusBadge variant="warning">Non-Negotiable</StatusBadge>}
            >
              <div className="space-y-2">
                <div className="rounded-xl bg-amber-50/50 border border-amber-200 p-3 text-xs text-amber-900 font-medium leading-relaxed">
                  Proposals violating these boundaries will fail Quality Gate reviews.
                </div>

                {projectBoundaries.map((boundary, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs font-medium text-slate-800"
                  >
                    <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                      ✕
                    </span>
                    <span className="leading-relaxed">{boundary}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column: Metrics & Stakeholders */}
        <div className="lg:col-span-4 space-y-6">
          {/* North Star Metric & Supporting Measures */}
          <SectionCard
            title="North Star &amp; Measures"
            icon={<Target className="h-5 w-5 text-brand-600" />}
          >
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  North Star Metric
                </span>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                    {northStarMetric || "Operational visibility improvement across transit stages."}
                  </p>
                </div>
              </div>

              {supportingMeasures.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Supporting Health Measures
                  </span>
                  <div className="space-y-1.5">
                    {supportingMeasures.map((measure, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="truncate">{measure}</span>
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
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline w-full justify-between"
              >
                <span>View Full Company Dossier</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Enterprise:</span>
                <span className="font-bold text-slate-900">{companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Challenge Sponsor:</span>
                <span className="font-semibold text-slate-800">{challengeOwner || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="font-semibold text-slate-800">{team?.name || "—"}</span>
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
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline w-full justify-between"
                >
                  <span>View Mentor Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-xs">
                  {mentor.full_name?.charAt(0) || "M"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {mentor.full_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {mentor.designation || "Industry Mentor"}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
