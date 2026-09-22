"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  ExternalLink,
  Users,
  ShieldCheck,
  ArrowRight,
  Compass,
  Briefcase,
  Award,
  Loader2,
  Quote,
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
  const sponsorInitials = founderSponsor
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const highlights = [
    {
      label: "Corporate Sponsor",
      value: founderSponsor || "—",
      sub: founderTitle,
      icon: Award,
    },
    {
      label: "Assigned Squad",
      value: team?.name || "—",
      sub: "Your fellowship squad",
      icon: Users,
    },
    {
      label: "Operating Stages",
      value: journeyStages.length ? String(journeyStages.length) : "—",
      sub: "Journey touchpoints",
      icon: Compass,
    },
    {
      label: "Assigned Challenge",
      value: project?.challenge_area || project?.code || "—",
      sub: project?.title ? "Assigned to your squad" : "",
      icon: Briefcase,
    },
  ];

  const secondaryButton =
    "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:!border-brand-300 hover:text-brand-700";

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Enterprise Partner
          </span>
        }
        title="Assigned Company"
        subtitle="The organisation sponsoring your squad's challenge and guiding the real-world context of your work."
      />

      {/* ───────── Company Hero ───────── */}
      <div className="card-custom !p-0 overflow-hidden">
        {/* Cover banner */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-brand-800 via-brand-600 to-fuchsia-500 sm:h-44">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute right-44 top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="absolute right-5 top-5 flex flex-wrap justify-end gap-2 sm:right-8 sm:top-6">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur sm:inline-flex">
              <Building2 className="h-3 w-3" />
              Assigned Enterprise Partner
            </span>
            {accreditation && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur">
                <ShieldCheck className="h-3 w-3" />
                {accreditation}
              </span>
            )}
          </div>
        </div>

        {/* Logo + identity */}
        <div className="px-4 pb-7 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Logo tile */}
            <div className="relative z-10 -mt-20 shrink-0 sm:-mt-24">
              <div className="flex h-44 w-44 items-center justify-center rounded-3xl border-4 !border-white bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 sm:h-56 sm:w-56 sm:p-4">
                {logoUrl && !companyLogoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${companyName} logo`}
                    onError={() => setCompanyLogoFailed(true)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-6xl font-black text-white">
                    {companyName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name, tagline, actions */}
            <div className="min-w-0 flex-1 space-y-4 lg:pt-6">
              <div className="space-y-2">
                {category && (
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                    {category}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    {companyName}
                  </h2>
                  <StatusBadge variant="success">Active Partner</StatusBadge>
                </div>
                {tagline && (
                  <p className="text-base font-medium italic text-slate-500 sm:text-lg">
                    &ldquo;{tagline}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link href="/student/project" className="btn-gradient-primary !py-2 !px-4 !text-xs">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Assigned Challenge</span>
                </Link>
                <Link href="/student/team" className={secondaryButton}>
                  <Users className="h-3.5 w-3.5" />
                  <span>My Squad</span>
                </Link>
                {website && (
                  <a href={website} target="_blank" rel="noreferrer" className={secondaryButton}>
                    <Globe className="h-3.5 w-3.5" />
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Highlights strip */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {highlights.map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-xs ring-1 ring-slate-200">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="truncate text-sm font-bold text-slate-900">{value}</p>
                {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────── Content grid ───────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left: story, flow, challenge */}
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* About */}
          <SectionCard
            title="About the Company"
            icon={<Building2 className="h-5 w-5" />}
          >
            <div className="relative rounded-2xl border border-l-4 !border-l-brand-600 bg-gradient-to-r from-violet-50/70 to-white p-5">
              <Quote className="mb-2 h-5 w-5 text-brand-500" />
              <p className="text-sm font-medium leading-relaxed text-slate-800 sm:text-[15px]">
                {profile || "A company profile has not been added yet."}
              </p>
            </div>
          </SectionCard>

          {/* Operating flow */}
          {journeyStages.length > 0 && (
            <SectionCard
              title="Operating Flow"
              icon={<Compass className="h-5 w-5" />}
              description={`${journeyStages.length} core touchpoints across the customer journey`}
            >
              <ol className="grid gap-5 pt-2 sm:grid-cols-5 sm:gap-2">
                {journeyStages.map((stageName, idx) => {
                  const isFocus =
                    stageName === "VIL Issue" ||
                    stageName === "Visa Processing" ||
                    stageName === "Travel & Treatment";
                  const isLast = idx === journeyStages.length - 1;
                  return (
                    <li key={stageName} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center">
                      {!isLast && (
                        <span
                          className={`absolute left-[19px] top-10 h-[calc(100%+0.75rem)] w-0.5 sm:left-1/2 sm:top-[19px] sm:h-0.5 sm:w-full ${isFocus ? "bg-brand-300" : "bg-slate-200"
                            }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${isFocus
                          ? "bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-md shadow-brand-600/30"
                          : "border border-slate-200 bg-white text-slate-500"
                          }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 sm:px-1">
                        <p className="text-xs font-bold leading-snug text-slate-900">{stageName}</p>
                        {isFocus && (
                          <StatusBadge variant="primary" className="mt-1.5 !px-2 !py-0 !text-[9px]">
                            Sprint Focus
                          </StatusBadge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </SectionCard>
          )}

          {/* Assigned challenge (details live in /student/project) */}
          {project && (
            <SectionCard
              title="Your Assigned Challenge"
              icon={<Briefcase className="h-5 w-5" />}
              footerAction={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="break-all text-xs font-medium text-slate-400 sm:break-normal">
                    Code: {project.code || "DISCOVER"}
                  </span>

                  <Link
                    href="/student/project"
                    className="inline-flex items-start gap-1 text-xs font-bold leading-5 text-brand-600 hover:text-brand-800 hover:underline sm:items-center"
                  >
                    <span className="min-w-0 break-words">
                      Inspect Problem Spec, Metrics &amp; Boundaries
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
                  </Link>
                </div>
              }
            >
              {project.challenge_area && (
                <StatusBadge variant="primary" className="mb-2">
                  {project.challenge_area}
                </StatusBadge>
              )}
              <h4 className="text-base font-bold text-slate-900">{project.title}</h4>
              <p className="mt-1.5 line-clamp-4 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                {project.description || project.challenge_statement}
              </p>
            </SectionCard>
          )}

          {/* Reference tracks */}
          {referenceChallengeAreas.length > 0 && (
            <SectionCard
              title="Additional Approved Challenge Tracks"
              description="Future cohort tracks approved by leadership (not assigned to your squad)"
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {referenceChallengeAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                  >
                    <span className="text-sm font-bold text-slate-800">{area}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">
                      Reference
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right: sponsor, brand, mentor */}
        <div className="min-w-0 space-y-6 lg:col-span-5 lg:sticky lg:top-6 lg:self-start">
          {/* Sponsor */}
          {founderSponsor && (
            <SectionCard title="Corporate Sponsor" icon={<Award className="h-4 w-4" />}>
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-lg font-bold text-white shadow-md shadow-brand-600/20">
                  {sponsorInitials}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-base font-bold text-slate-900">{founderSponsor}</h4>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {[founderTitle, companyName].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-brand-700 transition-colors hover:!border-brand-300 hover:bg-brand-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    Company Website
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </SectionCard>
          )}


          {/* Mentor (full bio lives at /student/mentor) */}
          {mentor && (
            <SectionCard
              title="Dedicated Mentor"
              icon={<Award className="h-4 w-4" />}
              footerAction={
                <Link
                  href="/student/mentor"
                  className="inline-flex w-full items-center justify-between text-xs font-bold text-brand-600 hover:underline"
                >
                  <span>View Mentor Profile &amp; Contact</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <div className="flex items-center gap-3.5">
                {mentor.headshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.headshot_url}
                    alt={mentor.full_name}
                    className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 object-cover object-center"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
                    {mentor.full_name?.charAt(0) || "M"}
                  </div>
                )}
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
    </div>
  );
}
