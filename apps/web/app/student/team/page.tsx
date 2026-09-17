"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersRound,
  ShieldCheck,
  UserRound,
  Briefcase,
  ExternalLink,
  Loader2,
  Mail,
  ArrowRight,
  Crown,
  X,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { StudentPortalContext } from "@/types/fellowship";

type TeamMemberSummary = NonNullable<StudentPortalContext["team"]>["members"][number];

export default function StudentTeamPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMemberSummary | null>(null);

  useEffect(() => {
    async function loadTeamData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        if (user) {
          const data = await fetchStudentPortalContext(user.id);
          setContext(data);
        }
      } catch (err) {
        console.error("Failed to load student team context", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
          <span className="text-sm font-medium">Loading your team roster...</span>
        </div>
      </div>
    );
  }

  if (!context?.team) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <UsersRound className="mx-auto h-12 w-12 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Team Assignment in Progress
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          You are enrolled in the fellowship! The administrator is currently assembling multidisciplinary squads for your cohort.
        </p>
        <Link
          href="/student/journey"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          View Fellowship Journey <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {context.cohort?.name || "Active Cohort"}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {context.team.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Your fellowship project squad, paired industry mentor, and enterprise sponsor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            Your Role: {context.team.role}
          </span>
        </div>
      </div>

      {/* Privacy-safe teammate profiles: no contact, ID, or verification data. */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-blue-50 px-6 py-5 sm:px-8 sm:py-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Collaboration space
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            Squad Teammates
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Meet the fellows collaborating with you on this shared company project.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {context.team.members.map((member) => (
            <button
              key={member.student_id}
              type="button"
              onClick={() => setSelectedMember(member)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 to-blue-500 text-lg font-bold text-white shadow-sm ring-4 ring-sky-50">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                {member.role === "leader" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Crown className="h-3.5 w-3.5" />
                    Team lead
                  </span>
                )}
              </div>
              <div className="mt-5">
                <p className="text-base font-bold text-slate-950">
                    {member.name}
                </p>
                <p className="mt-1 text-sm capitalize text-slate-600">
                  {member.role}
                </p>
              </div>
              <p className="mt-4 text-xs font-semibold text-blue-700 group-hover:underline">
                View collaboration profile
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Mentor & Sponsor Alignment */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Mentor Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Mentor
            </span>
            <UserRound className="h-4 w-4 text-slate-400" />
          </div>

          {context.mentor ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-lg font-bold text-slate-900">
                {context.mentor.full_name}
              </h3>
              <p className="text-xs text-slate-600">
                {context.mentor.designation} at{" "}
                <span className="font-semibold text-slate-900">
                  {context.mentor.company_name}
                </span>
              </p>

              {context.mentor.email && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{context.mentor.email}</span>
                </div>
              )}

              {context.mentor.expertise && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {context.mentor.expertise.map((exp) => (
                    <span
                      key={exp}
                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3">
                <Link
                  href="/student/mentor"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  View full mentor profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Mentor pairing is being finalized by fellowship staff.
            </p>
          )}
        </section>

        {/* Assigned Company Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sponsoring Company
            </span>
            <Briefcase className="h-4 w-4 text-slate-400" />
          </div>

          {context.company ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-lg font-bold text-slate-900">
                {context.company.name}
              </h3>
              <p className="text-xs text-slate-600">
                Industry:{" "}
                <span className="font-semibold text-slate-900">
                  {context.company.industry}
                </span>
              </p>

              {context.company.profile && (
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                  {context.company.profile}
                </p>
              )}

              {context.company.website && (
                <a
                  href={context.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                >
                  Visit Company Website <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div className="pt-2">
                <Link
                  href="/student/company"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline"
                >
                  Explore partner profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Company assignment is pending team project selection.
            </p>
          )}
        </section>
      </div>

      {/* Assigned Project Card */}
      {context.project && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Fellowship Project
            </span>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              {context.project.difficulty}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <h3 className="text-xl font-bold text-slate-900">
              {context.project.title}
            </h3>

            <p className="text-xs leading-relaxed text-slate-600">
              {context.project.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <h4 className="text-xs font-semibold text-slate-900">
                  Core Objectives:
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">
                  {context.project.objectives}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <h4 className="text-xs font-semibold text-slate-900">
                  Deliverables Checklist:
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">
                  {context.project.expected_deliverables}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/student/submissions"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Submit Project Deliverable <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {selectedMember && (
        <TeammateProfileDialog
          member={selectedMember}
          teamName={context.team.name}
          cohortName={context.cohort?.name}
          projectTitle={context.project?.title}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

function TeammateProfileDialog({
  member,
  teamName,
  cohortName,
  projectTitle,
  onClose,
}: {
  member: TeamMemberSummary;
  teamName: string;
  cohortName?: string;
  projectTitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teammate-profile-title"
      onMouseDown={onClose}
    >
      <section
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-200 to-blue-500 text-2xl font-bold text-white shadow-md ring-4 ring-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="teammate-profile-title" className="text-xl font-bold text-slate-950 sm:text-2xl">
                    {member.name}
                  </h2>
                  {member.role === "leader" && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Team lead
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium capitalize text-blue-700">
                  {member.role} of {teamName}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Collaborating with you on the team’s fellowship project.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="Close teammate profile"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <CollaborationDetail label="Team" value={teamName} />
          {cohortName && <CollaborationDetail label="Cohort" value={cohortName} />}
          {projectTitle && <CollaborationDetail label="Shared project" value={projectTitle} fullWidth />}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
          <p className="text-xs leading-5 text-slate-500">
            This profile intentionally shows collaboration information only. Contact details,
            identification data, and documents are kept private.
          </p>
        </div>
      </section>
    </div>
  );
}

function CollaborationDetail({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
