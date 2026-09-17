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
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";

export default function StudentProjectDetailPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <span className="font-medium text-slate-700">Loading Assigned Challenge...</span>
        </div>
      </div>
    );
  }

  const challenge = dashboardData?.assigned_challenge;
  const project = context?.project;
  const company = context?.company;
  const mentor = dashboardData?.mentor || context?.mentor;
  const team = dashboardData?.team || context?.team;

  const title = challenge?.title || project?.title || "Scalable Supply Chain Operational Intelligence";
  const companyName = challenge?.company_name || company?.name || "Apex Logistics Global";
  const industry = challenge?.industry || company?.industry || "Enterprise Logistics & Mobility";
  const challengeOwner = challenge?.challenge_owner || "Director of Supply Chain Architecture";
  const problemStatement =
    challenge?.problem_statement ||
    project?.description ||
    "Apex Logistics operates multi-modal freight corridors across 14 hubs. Disjointed telematics systems and latency in exception handling cause costly SLA penalties and blindspots in multi-carrier handoffs. The team must discover the core root cause, frame strategic choices, and architect an actionable solution blueprint.";

  return (
    <div className="space-y-6 pb-12">
      {/* Header (Matching DL_DISCOVER project_detail.html) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
              Assigned Company Project
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Lock className="h-3 w-3" />
              Non-Elective Assignment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Direct industry challenge provided by <strong className="text-slate-900">{companyName}</strong>. In Discover, fellows are matched directly with enterprise challenges to build real-world capabilities.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Discover Program Hub</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left 8 cols (Problem Details) + Right 4 cols (Company & Team) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Problem Statement & Scope */}
        <div className="lg:col-span-8 space-y-6">
          {/* Problem Statement Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertOctagon className="h-5 w-5 text-red-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                Core Business Problem Statement
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-red-600">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {problemStatement}
              </p>
            </div>
          </div>

          {/* 4-Week Discover Scope Boundaries */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ListCheck className="h-5 w-5 text-sky-600" />
              <h3 className="font-extrabold text-slate-900 text-base">
                4-Week Discover Scope Boundaries &amp; Deliverables
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Week 1 Milestone</span>
                <h4 className="font-bold text-xs text-slate-900">Discover the Real Problem</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Business Diagnosis &amp; Problem Framing Pack</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: Evidence-supported problem bounding.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Week 2 Milestone</span>
                <h4 className="font-bold text-xs text-slate-900">Create Strategic Possibilities</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Strategic Possibility &amp; Choice Pack</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: What Would Have to Be True testing.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Week 3 Milestone</span>
                <h4 className="font-bold text-xs text-slate-900">Design the Strategy</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Strategy &amp; Execution Blueprint</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quality Gate: End-to-end architectural coherence.</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Week 4 Milestone</span>
                <h4 className="font-bold text-xs text-slate-900">Build the Case for Action</h4>
                <p className="text-[11px] text-slate-600">
                  Deliverable: <strong>Executive Proposal &amp; Company Presentation Master</strong>
                </p>
                <p className="text-[10px] text-slate-400">Final Gate: Company shortlisting decision.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sponsoring Company & Team Alignment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sponsoring Company Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Sponsoring Enterprise</h3>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                Active Partner
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-lg">
                <Building2 className="h-6 w-6 text-sky-400" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{companyName}</h4>
                <p className="text-xs text-slate-500">{industry}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Challenge Sponsor:</span>
                <span className="font-semibold text-slate-800 truncate">{challengeOwner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Industry Sector:</span>
                <span className="font-semibold text-slate-800">{industry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assignment Type:</span>
                <span className="font-semibold text-slate-800">Non-elective Enterprise Brief</span>
              </div>
            </div>
          </div>

          {/* Governance & Team Alignment Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Team Alignment
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Assigned Squad:</span>
                <span className="font-bold text-slate-900 text-sm">{team?.name || "Discover Squad"}</span>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                {mentor?.headshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.headshot_url}
                    alt={mentor.full_name || "Mentor"}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-xs text-white">
                    {mentor?.full_name ? mentor.full_name.charAt(0) : "M"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-slate-500 block text-[11px]">Dedicated Team Mentor:</span>
                  <span className="font-bold text-sky-800 text-sm truncate block">{mentor?.full_name || "Assigned Mentor"}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{mentor?.company_name || "Industry Advisor"}</span>
                </div>
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
