"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  ExternalLink,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Compass,
  Briefcase,
  Award,
  Loader2,
} from "lucide-react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

export default function StudentCompanyPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="card-custom flex min-h-[280px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="font-medium text-slate-700">Loading Sponsoring Company…</span>
        </div>
      </div>
    );
  }

  const company = context?.company;
  const project = context?.project;
  const mentor = context?.mentor || dashboardData?.mentor;
  const team = context?.team || dashboardData?.team;

  if (!company) {
    return (
      <div className="page-container">
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          headline="No Company Assigned"
          description="You have not been matched with an enterprise partner yet. Please check back later or contact your program coordinator."
        />
      </div>
    );
  }

  const companyName = company.name ?? "";
  const tagline = company.tagline ?? "";
  const accreditation = company.accreditation ?? "";
  const category = company.category ?? "";
  const founderSponsor = company.founder_sponsor ?? "";
  const founderTitle = company.founder_title ?? "";
  const profile = company.profile ?? "";
  const website = company.website ?? "";
  const logoUrl = company.logo_url ?? "";
  const journeyStages = company.public_journey_stages || [];
  const referenceChallengeAreas = company.reference_challenge_areas || [];

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge variant="primary">Assigned Enterprise Partner</StatusBadge>
            {accreditation && (
              <StatusBadge variant="warning" icon={<ShieldCheck className="h-3 w-3" />}>
                {accreditation}
              </StatusBadge>
            )}
          </div>
        }
        title={companyName}
        subtitle={tagline ? `“${tagline}” — Enterprise sponsor for your fellowship squad.` : "Enterprise sponsor for your fellowship squad."}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/student/project"
              className="btn-gradient-primary !py-2 !px-3.5 !text-xs"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Assigned Challenge</span>
            </Link>
            <Link
              href="/student/team"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Squad</span>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Enterprise Overview & Flow */}
        <div className="lg:col-span-8 space-y-6">
          {/* Enterprise Profile */}
          <SectionCard
            title="Enterprise Profile &amp; Mission"
            icon={<Building2 className="h-5 w-5" />}
            badge={category ? <StatusBadge variant="secondary">{category}</StatusBadge> : undefined}
          >
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-brand-600">
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {profile}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Corporate Sponsor:</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">
                    {founderSponsor} {founderTitle ? `(${founderTitle})` : ""}
                  </span>
                </div>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Company Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Operating Flow / Journey Stages */}
          {journeyStages.length > 0 && (
            <SectionCard
              title="Public Care Coordination Stages (Operating Flow)"
              icon={<Compass className="h-5 w-5 text-teal-600" />}
              description={`${journeyStages.length} core touchpoints across patient journey`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                {journeyStages.map((stageName, idx) => {
                  const isFocus =
                    stageName === "VIL Issue" ||
                    stageName === "Visa Processing" ||
                    stageName === "Travel & Treatment";
                  return (
                    <div
                      key={stageName}
                      className={`relative rounded-xl p-3 text-center border transition-all ${
                        isFocus
                          ? "border-brand-300 bg-brand-50/40 shadow-xs"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-slate-400 mb-0.5">
                        STAGE 0{idx + 1}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mb-1">
                        {stageName}
                      </div>
                      {isFocus && (
                        <StatusBadge variant="primary" className="!text-[9px] !px-1.5 !py-0">
                          Sprint Focus
                        </StatusBadge>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Assigned Project Concise Briefing (Deduplicated — details live in /student/project) */}
          {project && (
            <SectionCard
              title={`Assigned Challenge: ${project.title}`}
              icon={<Briefcase className="h-5 w-5" />}
              badge={
                project.challenge_area ? (
                  <StatusBadge variant="primary">{project.challenge_area}</StatusBadge>
                ) : undefined
              }
              footerAction={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Code: {project.code || "DISCOVER"}
                  </span>
                  <Link
                    href="/student/project"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    <span>Inspect Problem Spec, Metrics &amp; Boundaries</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              }
            >
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {project.description || project.challenge_statement}
              </p>
            </SectionCard>
          )}

          {/* Reference Challenge Areas */}
          {referenceChallengeAreas.length > 0 && (
            <SectionCard
              title="Additional Approved Challenge Tracks"
              description="Future cohort tracks approved by leadership (not assigned to your squad)"
            >
              <div className="grid sm:grid-cols-2 gap-2.5">
                {referenceChallengeAreas.map((area) => (
                  <div
                    key={area}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-800">{area}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Unassigned Reference</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right 4 Cols: Brand & Mentorship Attribution */}
        <div className="lg:col-span-4 space-y-6">
          {/* Brand & Partner Summary */}
          <SectionCard>
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="flex justify-center mb-3">
                {logoUrl && !companyLogoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={companyName}
                    onError={() => setCompanyLogoFailed(true)}
                    className="h-16 max-w-[180px] object-contain p-2 rounded-xl border border-slate-100 shadow-xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white font-black text-xl shadow-xs">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-900">{companyName}</h4>
              {category && <p className="text-xs text-slate-500 mt-0.5">{category}</p>}
            </div>

            <div className="space-y-2.5 text-xs pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Partner Status:</span>
                <StatusBadge variant="success">Active Partner</StatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Squad:</span>
                <span className="font-semibold text-slate-800">{team?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lead Sponsor:</span>
                <span className="font-semibold text-slate-800">{founderSponsor || "—"}</span>
              </div>
            </div>
          </SectionCard>

          {/* Dedicated Mentor Attribution (Deduplicated — full bio at /student/mentor) */}
          {mentor && (
            <SectionCard
              title="Dedicated Mentor"
              icon={<Award className="h-4 w-4" />}
              footerAction={
                <Link
                  href="/student/mentor"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline w-full justify-between"
                >
                  <span>View Mentor Profile &amp; Contact</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="flex items-center gap-3">
                {mentor.headshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.headshot_url}
                    alt={mentor.full_name}
                    className="h-11 w-11 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-sm">
                    {mentor.full_name?.charAt(0) || "M"}
                  </div>
                )}
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
