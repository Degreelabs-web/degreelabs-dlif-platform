"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  ExternalLink,
  Lock,
  ListCheck,
  Briefcase,
  Users,
  ShieldCheck,
  Calendar,
  Award,
  Cpu,
  FileText,
  CheckCircle2,
  Info,
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";

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
  const challenge = dashboardData?.assigned_challenge;
  const mentor = context?.mentor || dashboardData?.mentor;
  const team = context?.team || dashboardData?.team;
  const cohort = context?.cohort || dashboardData?.cohort;
  const currentWeek = dashboardData?.team?.current_week || dashboardData?.current_week?.week_number || 1;
  const mentorBio = context?.mentor?.bio;

  // Fallbacks rendered if not assigned yet
  const companyName = company?.name || challenge?.company_name || "Assigned Enterprise Partner";
  const industry = company?.industry || challenge?.industry || "Enterprise Information Technology";
  const profile =
    company?.profile ||
    "Leading enterprise sponsor participating in the DegreeLabs Industry Fellowship. Sponsoring organizations define authentic business challenges, evaluate strategic prototypes, and review final executive proposals.";
  const website = company?.website;

  const projectTitle = project?.title || challenge?.title || "Enterprise Digital Capability Architecture";
  const projectDescription =
    project?.description ||
    challenge?.problem_statement ||
    "Comprehensive operational diagnosis and solution strategy addressing enterprise-scale efficiency bottlenecks and service workflow modernization.";
  const objectives =
    project?.objectives ||
    "Identify operational friction points, frame strategic possibilities with What Would Have to Be True testing, and formulate an executive strategy roadmap.";
  const deliverables =
    project?.expected_deliverables ||
    "Problem Diagnosis Pack (W1), Strategic Possibilities (W2), Strategy Blueprint (W3), Executive Proposal (W4)";

  const mentorInitial = mentor?.full_name ? mentor.full_name.charAt(0).toUpperCase() : "M";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header (DL_DISCOVER project_detail.html reference) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              Assigned Enterprise Partner
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="h-3 w-3 text-emerald-700" />
              Matched Industry Sponsor
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Lock className="h-3 w-3" />
              Non-Elective Assignment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {companyName}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Direct industry partner and challenge sponsor for your DLIF Discover fellowship. In Discover, fellows collaborate with enterprise sponsors to solve real-world problems.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/project"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Briefcase className="h-4 w-4 text-slate-500" />
            <span>Assigned Project</span>
          </Link>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Program Hub</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Grid: Left 8 cols (Company & Challenge Details) + Right 4 cols (Enterprise & Mentor Details) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Enterprise Profile & Mission */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="h-5 w-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Enterprise Profile &amp; Corporate Mission
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-sky-600">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {profile}
              </p>
            </div>
          </div>

          {/* Card 2: Sponsoring Challenge & Objectives (From Database) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase className="h-5 w-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Sponsoring Challenge &amp; Objectives
              </h3>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Challenge Problem Scope
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{projectTitle}</h4>
                <p className="text-slate-700 leading-relaxed">{projectDescription}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Strategic Objectives
                  </span>
                  <p className="font-medium text-slate-800 leading-relaxed">{objectives}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Expected Deliverables &amp; Artifacts
                  </span>
                  <p className="font-medium text-slate-800 leading-relaxed">{deliverables}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 4-Week Discover Scope Boundaries */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ListCheck className="h-5 w-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                4-Week Discover Scope Boundaries
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Week 1 Milestone
                </span>
                <h4 className="font-bold text-xs text-slate-900">Discover the Real Problem</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Business Diagnosis &amp; Problem Framing Pack</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: Evidence-supported problem bounding.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Week 2 Milestone
                </span>
                <h4 className="font-bold text-xs text-slate-900">Create Strategic Possibilities</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Strategic Possibility &amp; Choice Pack</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: What Would Have to Be True tests.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Week 3 Milestone
                </span>
                <h4 className="font-bold text-xs text-slate-900">Design the Strategy</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Strategy &amp; Execution Blueprint</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: End-to-end architectural coherence.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                  Week 4 Milestone
                </span>
                <h4 className="font-bold text-xs text-slate-900">Build the Case for Action</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Executive Proposal &amp; Company Presentation Master</strong>
                </p>
                <p className="text-[10px] text-slate-400">Final Gate: Company shortlisting decision.</p>
              </div>
            </div>
          </div>

          {/* Card 4: Enterprise Constraints & Operational Focus */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Enterprise Constraints &amp; Operational Focus
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col">
                <div className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-sky-600" />
                  <span>Technical &amp; SLA Environment</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enterprise-grade standards compliant with {industry} security guidelines, privacy guardrails, and automated exception workflows.
                </p>
              </div>
              <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col">
                <div className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>Target Enterprise Stakeholders</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Business sponsors, Operational Leaders, IT Architecture Directors, and Internal DegreeLabs Reviewers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Right Card 1: Company Profile & Verification */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="flex justify-center mb-3">
                {company?.logo_url && !companyLogoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logo_url}
                    alt={companyName}
                    onError={() => setCompanyLogoFailed(true)}
                    className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-2xl shadow-xs">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">{companyName}</h4>
              <div className="flex justify-center my-2">
                <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                  {industry}
                </span>
              </div>
              {website && (
                <div className="mt-2">
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px]">{website}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sponsor Status:</span>
                <span className="font-semibold text-emerald-700">Active Industry Partner</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Industry Sector:</span>
                <span className="font-semibold text-slate-800">{industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assignment:</span>
                <span className="font-semibold text-slate-800">Non-Elective Enterprise Brief</span>
              </div>
            </div>

            <div className="rounded-xl bg-sky-50 border border-sky-200/80 p-3 text-xs flex items-start gap-2.5">
              <Info className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
              <p className="text-sky-950 leading-relaxed">
                <strong>Evaluation Pipeline:</strong> Internal DegreeLabs evaluators shortlist outputs before anything is shown to company reviewers.
              </p>
            </div>
          </div>

          {/* Right Card 2: Dedicated Team Mentor Card (MENTOR IMAGE VISIBLE!) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Award className="h-4 w-4 text-sky-600" />
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
                  alt={mentor.full_name || "Mentor Photo"}
                  onError={() => setMentorImageFailed(true)}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-lg text-white shadow-xs">
                  {mentorInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {mentor?.full_name || "Dedicated Industry Mentor"}
                </h4>
                <p className="text-xs font-semibold text-sky-700 truncate">
                  {mentor?.designation || "Senior Enterprise Advisor"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {mentor?.company_name || "DegreeLabs Mentor Council"}
                </p>
              </div>
            </div>

            {mentorBio && (
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                {mentorBio}
              </p>
            )}

            <Link
              href="/student/mentor"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <span>View Full Mentor Profile</span>
            </Link>
          </div>

          {/* Right Card 3: Team Alignment Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-600" />
              <span>Assigned 5-Member Team</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="font-bold text-sky-800 text-sm">{team?.name || "Discover Squad"}</div>
              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                <span>{cohort?.name || "Discover Cohort 2026"}</span>
                <span>&bull;</span>
                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                  Week {currentWeek}
                </span>
              </div>
            </div>

            <Link
              href="/student/team"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-slate-500" />
              <span>Open Team Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
