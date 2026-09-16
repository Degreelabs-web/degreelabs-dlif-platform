"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileUp, Plus, Search } from "lucide-react";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { DeleteConfirmationDialog } from "@/components/admin/DeleteConfirmationDialog";
import { useToast } from "@/components/ui/ToastProvider";
import {
  archiveMaterial,
  createMaterial,
  deleteMaterial,
  getAdminMaterials,
  Material,
  publishMaterial,
  restoreMaterial,
  uploadMaterialAsset,
} from "@/lib/api/materials";

const initial = {
  title: "",
  description: "",
  category: "",
  material_type: "pdf",
  visibility: "all_students",
  student_access_mode: "view_download" as const,
  external_url: "",
  is_featured: false,
  publish_immediately: false,
};

const audiences = [
  ["all_students", "All students"],
  ["all_mentors", "All mentors"],
  ["students_and_mentors", "Students and mentors"],
] as const;

function studentAccessLabel(mode: Material["student_access_mode"]) {
  if (mode === "no_access") return "No access";
  if (mode === "download_editable_copy") return "Editable copy";
  return "View / download";
}

export default function AdminMaterialsPage() {
  const { notify } = useToast();
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminMaterials({ search: search || undefined });
      setItems(response.items);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      setError("");
      await action();
      await load();
      notify(successMessage);
    } catch (caught) {
      const message = (caught as Error).message;
      setError(message);
      notify(message, "error");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const isLink = form.material_type === "link";
      const material = await createMaterial({
        ...form,
        external_url: form.external_url || undefined,
        publish_immediately: isLink && form.publish_immediately,
      });

      if (file) await uploadMaterialAsset(material.id, file);
      if (!isLink && form.publish_immediately) await publishMaterial(material.id);

      setModal(false);
      setForm(initial);
      setFile(null);
      await load();
      notify(form.publish_immediately ? "Material published successfully." : "Material saved as a draft.");
    } catch (caught) {
      const message = (caught as Error).message;
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const permanentlyDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError("");
      await deleteMaterial(deleteTarget.id);
      setDeleteTarget(null);
      await load();
      notify("Material and its stored file were permanently deleted.");
    } catch (caught) {
      const message = (caught as Error).message;
      setError(message);
      notify(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Admin Portal</p>
          <h1 className="text-2xl font-bold text-slate-900">Student Centric Materials</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage learning resources available to students and mentors.
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add Material
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total", items.length],
          ["Published", items.filter((item) => item.status === "published").length],
          ["Draft / Archived", items.filter((item) => item.status !== "published").length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 rounded-xl border bg-white p-3">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search materials"
          />
        </div>
        <button onClick={() => void load()} className="rounded-lg border px-3 text-sm">
          Search
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="p-8 text-center text-slate-500">Loading materials...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Material</th>
                <th>Category</th>
                <th>Type</th>
                <th>Audience</th>
                <th>Student access</th>
                <th>Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((material) => (
                <tr key={material.id} className="border-t">
                  <td className="p-4">
                    <p className="font-semibold">{material.title}</p>
                    <p className="max-w-sm truncate text-xs text-slate-500">{material.description}</p>
                  </td>
                  <td>{material.category || "-"}</td>
                  <td className="capitalize">{material.material_type}</td>
                  <td>{material.visibility.replaceAll("_", " ")}</td>
                  <td>{studentAccessLabel(material.student_access_mode)}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">
                      {material.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <EntityActionsMenu
                      label={material.title}
                      onPublish={
                        material.status === "draft"
                          ? () => void runAction(() => publishMaterial(material.id), "Material published.")
                          : undefined
                      }
                      onRestore={
                        material.status === "archived"
                          ? () => void runAction(() => restoreMaterial(material.id), "Material restored as a draft.")
                          : undefined
                      }
                      onDelete={
                        material.status === "archived"
                          ? () => setDeleteTarget(material)
                          : () => void runAction(() => archiveMaterial(material.id), "Material archived. It is no longer visible to students or mentors.")
                      }
                      deleteLabel={material.status === "archived" ? "Delete permanently" : "Archive"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Add Material</h2>
                <p className="text-sm text-slate-500">Create a draft or publish a resource securely.</p>
              </div>
              <button type="button" onClick={() => setModal(false)} aria-label="Close">x</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-sm font-medium">
                Title
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-lg border p-2" />
              </label>
              <label className="sm:col-span-2 text-sm font-medium">
                Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border p-2" />
              </label>
              <label className="text-sm font-medium">
                Category
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border p-2" />
              </label>
              <label className="text-sm font-medium">
                Type
                <select value={form.material_type} onChange={(event) => setForm({ ...form, material_type: event.target.value })} className="mt-1 w-full rounded-lg border p-2">
                  {["pdf", "document", "presentation", "spreadsheet", "video", "image", "link", "other"].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                Audience
                <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })} className="mt-1 w-full rounded-lg border p-2">
                  {audiences.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                Student access
                <select value={form.student_access_mode} onChange={(event) => setForm({ ...form, student_access_mode: event.target.value as typeof form.student_access_mode })} className="mt-1 w-full rounded-lg border p-2">
                  <option value="no_access">No student access</option>
                  <option value="view_download">View / download only</option>
                  <option value="download_editable_copy">Download editable copy</option>
                </select>
              </label>
              {form.material_type === "link" ? (
                <label className="text-sm font-medium">
                  HTTPS URL
                  <input required type="url" value={form.external_url} onChange={(event) => setForm({ ...form, external_url: event.target.value })} className="mt-1 w-full rounded-lg border p-2" />
                </label>
              ) : (
                <label className="text-sm font-medium">
                  File
                  <input required type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
                  <span className="mt-1 block text-xs text-slate-500">PDF, Office, image, or MP4 — max 50 MB</span>
                </label>
              )}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} />
              Featured
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.publish_immediately} onChange={(event) => setForm({ ...form, publish_immediately: event.target.checked })} />
              Publish immediately
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="rounded-lg border px-4 py-2">Cancel</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
                <FileUp className="h-4 w-4" />{saving ? "Saving..." : "Save Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        entityLabel="Material"
        entityName={deleteTarget?.title ?? ""}
        deleting={deleting}
        error={null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={permanentlyDelete}
      />
    </div>
  );
}
