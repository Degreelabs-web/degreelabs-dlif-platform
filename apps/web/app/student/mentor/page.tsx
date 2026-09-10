"use client";

import { useEffect, useState } from "react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { UserRound, Building, Mail, Award, Calendar, ExternalLink } from "lucide-react";

export default function StudentMentorPage() {
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
        console.error("Failed to load mentor", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const mentor = context?.mentor;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Student Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assigned Industry Mentor
        </h1>
        <p className="text-sm text-slate-600">
          Your dedicated industry advisor providing weekly technical reviews and career guidance.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading mentor details...</div>
      ) : !mentor ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UserRound className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No mentor assigned yet</h3>
          <p className="mt-1 text-xs text-slate-500">Mentors are paired during the fellowship kickoff week.</p>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-xl">
                {mentor.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{mentor.full_name}</h2>
                <p className="text-sm text-slate-600 font-medium">
                  {mentor.designation || "Staff Software Engineer"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>{mentor.company_name || "Industry Partner"}</span>
                </div>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active Advisor
            </span>
          </div>

          {mentor.expertise && mentor.expertise.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Domain Expertise
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {mentor.expertise.map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>Email: <strong className="text-slate-900">{mentor.email}</strong></span>
            </div>
            {mentor.linkedin_url && (
              <div className="flex items-center gap-3">
                <ExternalLink className="h-4 w-4 text-slate-400" />
                <a
                  href={mentor.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/70 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Weekly Team Touchpoint</p>
              <p className="text-xs text-slate-500">Every Thursday &bull; 6:00 PM IST (Google Meet)</p>
            </div>
            <button className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
              Join Office Hours
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
