"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Building2,
  Calendar,
  UsersRound,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import {
  fetchCohorts,
  createCohort,
  updateCohort,
  deleteCohort,
} from "@/lib/api/cohorts";
import { fetchInstitutions } from "@/lib/api/institutions";
import { Cohort, Institution } from "@/types/fellowship";

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    institution_id: "",
    name: "",
    academic_year: "2026-2027",
    start_date: "2026-09-01",
    end_date: "2027-05-31",
    status: "active",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [cohortsData, institutionsData] = await Promise.all([
        fetchCohorts({
          institution_id: selectedInstitution || undefined,
          status: selectedStatus || undefined,
        }),
        fetchInstitutions(),
      ]);
      setCohorts(cohortsData);
      setInstitutions(institutionsData);
      if (institutionsData.length > 0 && !formData.institution_id) {
        setFormData((prev) => ({ ...prev, institution_id: institutionsData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load cohorts", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedInstitution, selectedStatus]);

  function openCreateModal() {
    setEditingCohort(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      institution_id: institutions[0]?.id || "",
      name: "",
      academic_year: "2026-2027",
      start_date: "2026-09-01",
      end_date: "2027-05-31",
      status: "active",
    });
    setIsModalOpen(true);
  }

  function openEditModal(cohort: Cohort) {
    setEditingCohort(cohort);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      institution_id: cohort.institution_id,
      name: cohort.name,
      academic_year: cohort.academic_year,
      start_date: cohort.start_date,
      end_date: cohort.end_date,
      status: cohort.status,
    });
    setIsModalOpen(true);
  }

  async function handleSubmitCohort(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.institution_id) {
        throw new Error("Please select an institution.");
      }
      if (editingCohort) {
        await updateCohort(editingCohort.id, {
          name: formData.name,
          academic_year: formData.academic_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
        });
      } else {
        await createCohort(formData);
      }
      setFormSuccess(`Cohort successfully ${editingCohort ? "updated" : "created"}!`);
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingCohort(null);
        setFormSuccess(null);
        setFormData({
          institution_id: institutions[0]?.id || "",
          name: "",
          academic_year: "2026-2027",
          start_date: "2026-09-01",
          end_date: "2027-05-31",
          status: "active",
        });
        loadData();
      }, 1000);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingCohort ? "update" : "create"} cohort.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCohort(cohort: Cohort) {
    if (!confirm(`Delete "${cohort.name}"? This action cannot be undone.`)) return;
    try {
      setDeletingId(cohort.id);
      await deleteCohort(cohort.id);
      await loadData();
    } catch (err) {
      alert("Failed to delete cohort: " + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fellowship Cohorts
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Cohort Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Organize student batches, academic calendars, and curriculum schedules by university.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Create Cohort
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Partner Institutions</option>
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Cohorts Grid */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading cohorts...</span>
          </div>
        </div>
      ) : cohorts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            No cohorts found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create a cohort for an institution to structure students and teams.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create Cohort
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map((cohort) => {
            const institution = institutions.find(
              (inst) => inst.id === cohort.institution_id
            );
            return (
              <div
                key={cohort.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                        cohort.status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {cohort.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-slate-400">
                        {cohort.academic_year}
                      </span>
                      <EntityActionsMenu
                        label={cohort.name}
                        onEdit={() => openEditModal(cohort)}
                        onDelete={() => handleDeleteCohort(cohort)}
                        deleteLabel={deletingId === cohort.id ? "Deleting..." : "Delete"}
                      />
                    </div>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {cohort.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {institution ? institution.name : "Institution"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {new Date(cohort.start_date).toLocaleDateString()} —{" "}
                      {new Date(cohort.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href={`/admin/teams?cohort_id=${cohort.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <UsersRound className="h-3.5 w-3.5" />
                    Squads
                  </Link>

                  <Link
                    href={`/admin/sessions?cohort_id=${cohort.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Sessions
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Cohort Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCohort ? "Edit Fellowship Cohort" : "Create Fellowship Cohort"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingCohort
                    ? "Update the cohort details and academic cycle."
                    : "Establish a new learning cohort and academic cycle."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCohort} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Partner Institution *
                </label>
                <select
                  required
                  disabled={Boolean(editingCohort)}
                  value={formData.institution_id}
                  onChange={(e) =>
                    setFormData({ ...formData, institution_id: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>
                    Select Institution
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cohort 2026 - Alpha"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2026-2027"
                    value={formData.academic_year}
                    onChange={(e) =>
                      setFormData({ ...formData, academic_year: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCohort ? "Save Changes" : "Create Cohort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
