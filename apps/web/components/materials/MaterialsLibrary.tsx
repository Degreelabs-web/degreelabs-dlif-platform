"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileText, Search, Download, Star, Loader2 } from "lucide-react";
import { getMaterialAccess, getMentorMaterials, getStudentMaterials, Material } from "@/lib/api/materials";
import { useToast } from "@/components/ui/ToastProvider";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

export function MaterialsLibrary({ role }: { role: "student" | "mentor" }) {
  const { notify } = useToast();
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  const title = role === "student" ? "Fellowship Materials" : "Mentor Resources";
  const subtitle =
    role === "student"
      ? "Templates, guides, and learning references for your fellowship."
      : "Resources and playbooks to support your mentoring journey.";

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = role === "student" ? await getStudentMaterials() : await getMentorMaterials();
      setItems(data.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [role]);

  const categories = useMemo(
    () => [...new Set(items.map((x) => x.category).filter(Boolean) as string[])],
    [items]
  );

  const visible = items.filter(
    (x) =>
      (!category || x.category === category) &&
      `${x.title} ${x.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const open = async (material: Material) => {
    try {
      setOpening(material.id);
      const access = await getMaterialAccess(role, material.id);
      if (
        role === "student" &&
        access.student_access_mode === "download_editable_copy" &&
        !material.external_url
      ) {
        const link = document.createElement("a");
        link.href = access.url;
        link.download = access.filename || "material";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
        notify("Your editable copy is downloading.");
      } else {
        window.open(access.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      notify(`Unable to open material: ${(e as Error).message}`, "error");
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {role === "student" ? "Curriculum Resources" : "Mentor Guides"}
          </span>
        }
        title={title}
        subtitle={subtitle}
      />

      {/* Filter Toolbar */}
      <div className="card-custom flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-500">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full text-xs outline-none bg-transparent"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All categories</option>
          {categories.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <div key={x} className="card-custom h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          headline="No materials found"
          description="Try adjusting your search query or category filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <SectionCard
              key={m.id}
              className="h-full"
              headerAction={
                m.is_featured ? (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                ) : undefined
              }
              badge={
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="h-4 w-4" />
                </span>
              }
              footerAction={
                <div className="flex items-center justify-between">
                  <StatusBadge variant="secondary">
                    {m.category || m.material_type}
                  </StatusBadge>
                  <button
                    type="button"
                    onClick={() => void open(m)}
                    disabled={opening === m.id}
                    className="btn-gradient-primary !py-1.5 !px-3 !text-xs disabled:opacity-60"
                  >
                    {opening === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : m.external_url ? (
                      <ExternalLink className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>{opening === m.id ? "Opening…" : m.external_url ? "Open" : "Download"}</span>
                  </button>
                </div>
              }
            >
              <h3 className="card-title line-clamp-1">{m.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-600">
                {m.description || "Learning resource"}
              </p>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
