"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { FolderGit2, Building2, Calendar, Target, Award, ArrowRight } from "lucide-react";

export default function StudentProjectPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        const data = await fetchStudentPortalContext(user?.id);
        setContext(data);
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const project = context?.project;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Student Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Capstone Fellowship Project
        </h1>
        <p className="text-sm text-slate-600">
          Your team's assigned engineering problem statement and milestone expectations.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading project details...</div>
      ) : !project ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No project assigned yet</h3>
          <p className="mt-1 text-xs text-slate-500">Projects will be assigned by the fellowship admins.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{project.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>Sponsoring Partner: <strong className="text-slate-900">{context?.company?.name}</strong></span>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">
                {project.difficulty}
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Problem Description
                </h4>
                <p className="leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {project.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Key Objectives
                </h4>
                <p className="leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {project.objectives}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Expected Deliverables
                </h4>
                <p className="leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {project.expected_deliverables}
                </p>
              </div>
            </div>

            {(project.start_date || project.end_date) && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    Project Timeline: <strong>{project.start_date || "Kickoff"}</strong> &rarr;{" "}
                    <strong>{project.end_date || "Final Demo"}</strong>
                  </span>
                </div>

                <Link
                  href="/student/submissions"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                >
                  Go to Submissions <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
