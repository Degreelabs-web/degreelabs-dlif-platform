"use client";

import { useEffect, useState } from "react";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import {
  createInstitution,
  deleteInstitution,
  fetchInstitutions,
  updateInstitution,
} from "@/lib/api/institutions";
import { Institution } from "@/types/fellowship";
import { Building2, Plus, CheckCircle2 } from "lucide-react";

const emptyForm = { name: "", code: "", status: "active" };

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const data = await fetchInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error("Failed to load institutions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingInstitution) {
        await updateInstitution(editingInstitution.id, {
          name: formData.name,
          code: formData.code.toUpperCase(),
          status: formData.status,
        });
      } else {
        await createInstitution({
          name: formData.name,
          code: formData.code.toUpperCase(),
          status: formData.status,
        });
      }
      setShowModal(false);
      setEditingInstitution(null);
      setFormData(emptyForm);
      await loadInstitutions();
    } catch (err) {
      alert(`Failed to ${editingInstitution ? "update" : "create"} institution: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingInstitution(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      code: institution.code,
      status: institution.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (institution: Institution) => {
    if (!confirm(`Delete "${institution.name}"? This action cannot be undone.`)) return;
    try {
      setDeletingId(institution.id);
      await deleteInstitution(institution.id);
      await loadInstitutions();
    } catch (err) {
      alert("Failed to delete institution: " + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Partner Institutions
          </h1>
          <p className="text-sm text-slate-600">
            Universities and educational partners participating in the Impact Fellowship.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Institution
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading institutions...</div>
      ) : institutions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No institutions registered</h3>
          <p className="mt-1 text-xs text-slate-500">Onboard an institution to enroll students and launch cohorts.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{inst.name}</h3>
                  <span className="inline-block mt-1 font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                    {inst.code}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {inst.status}
                  </span>
                  <EntityActionsMenu
                    label={inst.name}
                    onEdit={() => openEditModal(inst)}
                    onDelete={() => handleDelete(inst)}
                    deleteLabel={deletingId === inst.id ? "Deleting..." : "Delete"}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                Added on: {new Date(inst.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingInstitution ? "Edit Institution" : "Onboard Institution"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Unique Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NIT-CAL"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm uppercase focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  {submitting
                    ? "Saving..."
                    : editingInstitution
                      ? "Save Changes"
                      : "Onboard Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
