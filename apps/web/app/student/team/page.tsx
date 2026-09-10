"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersRound,
  ShieldCheck,
  UserRound,
  Briefcase,
  FolderGit2,
  ExternalLink,
  Loader2,
  Mail,
  ArrowRight,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { StudentPortalContext } from "@/types/fellowship";

export default function StudentTeamPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

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

      {/* Squad Members Roster */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Squad Teammates</h2>
        <p className="text-xs text-slate-500">
          Collaborators working on your shared company project
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {context.team.members.map((member) => (
            <div
              key={member.student_id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {member.role}
                  </p>
                </div>
              </div>

              {member.role === "leader" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  <ShieldCheck className="h-3 w-3" />
                  Lead
                </span>
              )}
            </div>
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
    </div>
  );
}
