"use client";

import { useEffect, useState } from "react";
import { fetchCompanies, createCompany } from "@/lib/api/fellowship";
import { Company } from "@/types/fellowship";
import { Briefcase, Plus, Globe, Mail, CheckCircle2, ExternalLink } from "lucide-react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    profile: "",
    contact_email: "",
    website: "",
    contact_name: "",
    contact_phone: "",
    logo_url: "",
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await fetchCompanies({ search: search || undefined });
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCompany({
        name: formData.name,
        industry: formData.industry,
        profile: formData.profile,
        contact_email: formData.contact_email,
        website: formData.website || undefined,
        contact_name: formData.contact_name || undefined,
        contact_phone: formData.contact_phone || undefined,
        logo_url: formData.logo_url || undefined,
      });
      setShowModal(false);
      setFormData({
        name: "",
        industry: "",
        profile: "",
        contact_email: "",
        website: "",
        contact_name: "",
        contact_phone: "",
        logo_url: "",
      });
      loadCompanies();
    } catch (err) {
      alert("Failed to create company: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Partner Companies
          </h1>
          <p className="text-sm text-slate-600">
            Manage industry partners sponsoring fellowship problem statements and projects.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by company name or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading companies...</div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No partner companies found</h3>
          <p className="mt-1 text-xs text-slate-500">Add an industry partner to start assigning projects.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{company.name}</h3>
                  <span className="inline-block mt-0.5 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {company.industry}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {company.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3">{company.profile}</p>

              <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{company.contact_email}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Visit Website <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active Projects: <strong className="text-slate-900">{company.projects_count}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Add Industry Partner</h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Industry</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CleanTech, HealthTech, AI"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Company Profile</label>
                <textarea
                  required
                  rows={3}
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
