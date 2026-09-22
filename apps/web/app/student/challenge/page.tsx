"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Building2,
  ArrowRight,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { fetchChallenges } from "@/lib/api/challenges";
import { Challenge } from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

export default function StudentChallengePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChallenges() {
      try {
        setLoading(true);
        const data = await fetchChallenges({ status: "active" });
        setChallenges(data);
      } catch (err) {
        console.error("Failed to load challenges", err);
      } finally {
        setLoading(false);
      }
    }

    loadChallenges();
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Industry Problem Tracks
          </span>
        }
        title="Fellowship Challenges"
        subtitle="Review active industry challenge tracks and project specifications."
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading challenge specifications…</span>
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          headline="No active challenges"
          description="New industry challenge tracks will appear here once published by your mentor."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {challenges.map((c) => (
            <SectionCard
              key={c.id}
              className="h-full"
              badge={
                <StatusBadge
                  variant={
                    c.difficulty === "advanced"
                      ? "danger"
                      : c.difficulty === "standard"
                        ? "primary"
                        : "secondary"
                  }
                >
                  {c.difficulty}
                </StatusBadge>
              }
              headerAction={
                <div className="flex max-w-[140px] items-center gap-1.5 text-xs font-medium text-slate-500 sm:max-w-none">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-semibold text-slate-700">
                    {c.company_name}
                  </span>
                </div>
              }
              footerAction={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-400">Sprint Track</span>
                  <Link
                    href="/student/submissions"
                    className="btn-gradient-primary w-full justify-center !px-3.5 !py-2 !text-xs sm:w-auto"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Turn in Solution</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              }
            >
              <h3 className="break-words text-base font-bold text-slate-900 sm:text-lg">{c.title}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 sm:line-clamp-2">
                {c.description}
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-900">Problem Statement</h4>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-slate-600 sm:line-clamp-3">
                  {c.problem_statement}
                </p>
              </div>

              {c.expected_outcome && (
                <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Target Outcome: </span>
                  <span>{c.expected_outcome}</span>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
