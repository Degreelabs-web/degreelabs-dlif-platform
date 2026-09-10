"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Building2,
  ArrowRight,
  Loader2,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { fetchChallenges } from "@/lib/api/challenges";
import { Challenge } from "@/types/fellowship";

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Industry Problem Tracks
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Fellowship Challenges
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Review problem statements, technical specifications, and expected project deliverables.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading challenge specifications...</span>
          </div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Target className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No active challenges
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            New industry challenge tracks will be published by your mentor and administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                      c.difficulty === "advanced"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        : c.difficulty === "standard"
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {c.difficulty}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="font-semibold text-slate-700">
                      {c.company_name}
                    </span>
                  </div>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {c.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {c.description}
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Problem Statement:
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {c.problem_statement}
                  </p>
                </div>

                {c.expected_outcome && (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">
                      Target Outcome:{" "}
                    </span>
                    <span>{c.expected_outcome}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Sprint Track
                </span>

                <Link
                  href="/student/submissions"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Turn in Solution
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
