"use client";

import { useEffect, useState } from "react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import { Building2, Globe, ExternalLink } from "lucide-react";

export default function StudentCompanyPage() {
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
        console.error("Failed to load company", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const company = context?.company;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Student Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sponsoring Industry Partner
        </h1>
        <p className="text-sm text-slate-600">
          The organization that authored your fellowship problem statement and guides its real-world implementation.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading company details...</div>
      ) : !company ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No company assigned yet</h3>
          <p className="mt-1 text-xs text-slate-500">Company allocations occur during project matching week.</p>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold text-xl">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 mt-1">
                  {company.industry}
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active Sponsor
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              About the Partner
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">{company.profile}</p>
          </div>

          {company.website && (
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="h-4 w-4 text-slate-400" />
                <span>Website</span>
              </div>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
              >
                {company.website} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
