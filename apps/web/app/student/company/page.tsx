"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  ExternalLink,
  Lock,
  Briefcase,
  Users,
  ShieldCheck,
  Calendar,
  Award,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  Plane,
  FileCheck,
  HeartPulse,
  Clock,
  Compass,
  Target,
  Layers,
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";

interface GateOutput {
  badge?: string;
  title: string;
}

function parseObjectives(raw: string): string[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line) => line.replace(/^\d+[\.\)]\s*|-\s*|•\s*/, "").trim());
  }
  const matches = raw.split(/(?:^|\s+)(?=\d+[\.\)]\s+)/).map((s) => s.trim()).filter(Boolean);
  if (matches.length > 1) {
    return matches.map((item) => item.replace(/^\d+[\.\)]\s*/, "").trim());
  }
  return [raw.trim()];
}

function parseGateOutputs(raw: string): GateOutput[] {
  if (!raw) return [];
  let parts: string[] = [];
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) {
    parts = lines;
  } else {
    parts = raw.split(/(?:^|\s+)(?=(?:Week|Gate|Phase)\s*\d+[:\s])/i).map((s) => s.trim()).filter(Boolean);
  }
  if (parts.length === 0) return [{ title: raw.trim() }];

  return parts.map((part) => {
    const match = part.match(/^((?:Week|Gate|Phase)\s*\d+[:\s]*)(.*)$/i);
    if (match) {
      return {
        badge: match[1].replace(/[:\s]+$/, "").trim(),
        title: match[2].trim(),
      };
    }
    const numMatch = part.match(/^(\d+[\.\)])\s*(.*)$/);
    if (numMatch) {
      return {
        badge: `Gate ${numMatch[1].replace(/[\.\)]/, "")}`,
        title: numMatch[2].trim(),
      };
    }
    return { title: part };
  });
}

export default function StudentCompanyPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentorImageFailed, setMentorImageFailed] = useState(false);
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        const [ctxRes, dashRes] = await Promise.allSettled([
          fetchStudentPortalContext(user?.id),
          fetchStudentDashboard(),
        ]);
        if (ctxRes.status === "fulfilled") setContext(ctxRes.value);
        if (dashRes.status === "fulfilled") setDashboardData(dashRes.value);
      } catch (err) {
        console.error("Failed to load company details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <span className="font-medium text-slate-700">Loading Sponsoring Company...</span>
        </div>
      </div>
    );
  }

  const company = context?.company;
  const project = context?.project;
  const mentor = context?.mentor || dashboardData?.mentor;
  const team = context?.team || dashboardData?.team;
  const currentWeek = dashboardData?.team?.current_week || dashboardData?.current_week?.week_number || 1;

  // Company Details — all from backend, no hardcoded fallbacks
  const companyName = company?.name ?? "";
  const tagline = company?.tagline ?? "";
  const accreditation = company?.accreditation ?? "";
  const category = company?.category ?? "";
  const founderSponsor = company?.founder_sponsor ?? "";
  const founderTitle = company?.founder_title ?? "";
  const profile = company?.profile ?? "";
  const website = company?.website ?? "";
  const logoUrl = company?.logo_url ?? "";

  // Journey Stages from backend
  const journeyStages = company?.public_journey_stages || [];

  // Reference challenge areas from backend
  const referenceChallengeAreas = company?.reference_challenge_areas || [];

  // Project Information — all from backend
  const projectTitle = project?.title ?? "";
  const projectCode = project?.code ?? "";
  const challengeArea = project?.challenge_area ?? "";
  const projectDescription = project?.description ?? "";
  const objectives = project?.objectives ?? "";
  const deliverables = project?.expected_deliverables ?? "";

  const parsedObjectives = parseObjectives(objectives);
  const parsedGateOutputs = parseGateOutputs(deliverables);

  const mentorInitial = mentor?.full_name ? mentor.full_name.charAt(0).toUpperCase() : "?";

  // If no company data, show empty state
  if (!company) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Company Assigned</h2>
          <p className="text-sm text-slate-500">
            You have not been matched with an enterprise partner yet. Please check back later or contact your program coordinator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header with Brand Accents */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              Assigned Enterprise Partner
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Live Industry Challenge
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              {accreditation}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
              <Lock className="h-3 w-3 text-blue-700" />
              Non-Elective Assignment
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {companyName}
            </h1>
            {tagline && (
              <span className="text-sm font-semibold italic text-slate-500">
                &ldquo;{tagline}&rdquo;
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Exclusive enterprise sponsor for the DISCOVER fellowship. In Discover, fellows are matched directly with enterprise leadership to solve authentic operational and strategic bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/project"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Briefcase className="h-4 w-4 text-[#2E5AA8]" />
            <span>Assigned Challenge</span>
          </Link>
          <Link
            href="/student/team"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Fellowship Squad</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Grid: Left 8 cols + Right 4 cols */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Enterprise Profile & Founder Sponsorship */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#2E5AA8]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Enterprise Profile &amp; Mission
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {category}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-red-50/40 via-white to-blue-50/40 border-l-4 border-[#ED1C24]">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {profile}
              </p>
            </div>

            {/* Founder & Corporate Sponsor Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Corporate Sponsor / Founder:</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                  {founderSponsor} ({founderTitle})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Accreditation:</span>
                <span className="font-bold text-emerald-700">{accreditation}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Public Patient Journey Stages (Cikitsa Operational Ecosystem) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#39B54A]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Public Patient Journey Stages (Operating Flow)
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                5 Core Care Coordination Stages
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Cikitsa India orchestrates international care across these touchpoints. Patient visibility weakens between VIL issue and hospital arrival, where this challenge intervenes.
            </p>

            {/* Journey Stages Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
              {journeyStages.map((stageName, idx) => {
                const isChallengeFocus = stageName === "VIL Issue" || stageName === "Visa Processing" || stageName === "Travel & Treatment";
                return (
                  <div
                    key={stageName}
                    className={`relative rounded-xl p-3 text-center border transition-all ${
                      isChallengeFocus
                        ? "border-[#2E5AA8]/40 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="text-[10px] font-extrabold text-slate-400 mb-1">
                      STAGE 0{idx + 1}
                    </div>
                    <div className="font-bold text-xs text-slate-900 mb-1">
                      {stageName}
                    </div>
                    {isChallengeFocus && (
                      <span className="inline-block text-[9px] font-bold text-[#2E5AA8] bg-blue-100/80 px-1.5 py-0.5 rounded">
                        Challenge Focus
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Assigned DISCOVER Challenge: Project A (Journey Intelligence) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#ED1C24]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Assigned Challenge: {projectTitle}
                </h3>
              </div>
              <span className="rounded-md bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                {challengeArea}
              </span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E5AA8]">
                  Code: {projectCode} • Discover Phase
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Status: Assigned to Squad
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{projectTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {projectDescription}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-1 items-stretch">
              {/* Strategic Scope & Objectives */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#2E5AA8]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Strategic Scope &amp; Objectives
                      </span>
                    </div>
                    {parsedObjectives.length > 0 && (
                      <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-extrabold text-[#2E5AA8]">
                        {parsedObjectives.length} Core Objectives
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-0.5">
                    {parsedObjectives.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100/80 text-[10px] font-extrabold text-[#2E5AA8] shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {obj}
                        </p>
                      </div>
                    ))}
                    {parsedObjectives.length === 0 && (
                      <p className="text-xs text-slate-500 italic">No specific objectives defined yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Discover Gate Outputs */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Discover Gate Outputs
                      </span>
                    </div>
                    {parsedGateOutputs.length > 0 && (
                      <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        {parsedGateOutputs.length} Key Deliverables
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-0.5">
                    {parsedGateOutputs.map((out, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        {out.badge ? (
                          <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            {out.badge}
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                            ✓
                          </span>
                        )}
                        <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                          {out.title}
                        </p>
                      </div>
                    ))}
                    {parsedGateOutputs.length === 0 && (
                      <p className="text-xs text-slate-500 italic">No specific deliverables defined yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/student/project"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E5AA8] hover:text-[#ED1C24] transition-colors hover:underline"
              >
                <span>View Full Challenge Details, Metrics &amp; Boundaries</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Reference Challenge Areas (Unassigned, Future Allocation) */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Additional Approved Company Challenge Areas
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                Unassigned Reference
              </span>
            </div>
            <p className="text-xs text-slate-600">
              The following challenge areas have been approved by Cikitsa India for future cohorts or team allocation, but are <strong>not assigned to your squad</strong> for this Discover sprint:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {referenceChallengeAreas.map((area) => (
                <div
                  key={area}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-800">{area}</span>
                  <span className="text-[10px] font-semibold text-slate-400">Available for Allocation</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Right Card 1: Company Profile & Brand Asset */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="flex justify-center mb-3">
                {logoUrl && !companyLogoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={companyName}
                    onError={() => setCompanyLogoFailed(true)}
                    className="h-20 max-w-[200px] object-contain p-2 rounded-xl border border-slate-100 shadow-2xs"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ED1C24] to-[#2E5AA8] text-white font-black text-2xl shadow-xs">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-0.5">{companyName}</h4>
              <p className="text-xs text-slate-500 font-medium italic mb-2">&ldquo;{tagline}&rdquo;</p>
              <div className="flex flex-wrap justify-center gap-1.5 my-2">
                <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  {accreditation}
                </span>
                <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-[#2E5AA8]">
                  MVT Leader
                </span>
              </div>
              {website && (
                <div className="mt-3">
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E5AA8] hover:text-[#ED1C24] hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px]">{website}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sponsor Status:</span>
                <span className="font-bold text-emerald-700">Active Industry Partner</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Challenge Owner:</span>
                <span className="font-semibold text-slate-800">{founderSponsor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="font-semibold text-slate-800">{team?.name || "—"}</span>
              </div>
            </div>


          </div>

          {/* Right Card 2: Dedicated Team Mentor Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#2E5AA8]" />
                <span>Dedicated Team Mentor</span>
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              {mentor?.headshot_url && !mentorImageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.headshot_url}
                  alt={mentor.full_name || "Mentor"}
                  onError={() => setMentorImageFailed(true)}
                  className="h-12 w-12 rounded-xl object-cover border border-slate-300 shadow-2xs"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2E5AA8] text-white font-bold text-base shadow-2xs">
                  {mentorInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {mentor?.full_name || "—"}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {mentor?.designation || "—"}
                </p>
                <p className="text-[10px] font-medium text-[#2E5AA8] truncate">
                  {mentor?.company_name || "—"}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-3 text-xs flex items-start gap-2">
              <Info className="h-4 w-4 text-[#2E5AA8] shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-relaxed text-[11px]">
                <strong>Mentor Role:</strong> Questions, critiques, exposes gaps, and coaches reasoning — does NOT solve the challenge for the squad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
