"use client";

import { useCallback, useEffect, useState } from "react";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { DeleteConfirmationDialog } from "@/components/admin/DeleteConfirmationDialog";
import { EnrollmentSyncStatus } from "@/components/admin/EnrollmentSyncStatus";
import {
  createMentor,
  deleteMentor,
  fetchMentors,
  updateMentor,
} from "@/lib/api/fellowship";
import { Mentor, MentorStatus } from "@/types/fellowship";
import {
  UserRound,
  Plus,
  Mail,
  Award,
  MapPin,
  ExternalLink,
  Quote,
  X,
  Phone,
} from "lucide-react";

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mentorInitials(name?: string | null): string {
  return (name || "Mentor")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function mentorHeadshotUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;

  try {
    const url = new URL(source);
    if (url.hostname === "drive.google.com") {
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = url.searchParams.get("id") || pathMatch?.[1];
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w400`;
      }
    }
  } catch {
    return null;
  }

  return source;
}

function mentorRole(mentor: Mentor): string {
  return mentor.current_role || mentor.designation || "Industry Expert";
}

function mentorOrganisation(mentor: Mentor): string {
  return mentor.organisation || mentor.company_name || "Independent";
}

function mentorLocation(mentor: Mentor): string {
  return mentor.location || [mentor.city, mentor.country].filter(Boolean).join(", ") || "Not provided";
}

function mentorPhoto(mentor: Mentor): string | null {
  return mentorHeadshotUrl(mentor.professional_headshot_url || mentor.headshot_url);
}

function mentorStatusClasses(status: string): string {
  const tones: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/15",
    inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
  };
  return tones[status] || tones.inactive;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MentorStatus | "">("");
  const [organisationFilter, setOrganisationFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [expertiseFilter, setExpertiseFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorPendingDelete, setMentorPendingDelete] = useState<Mentor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [directoryRefreshKey, setDirectoryRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
    designation: "",
    city: "",
    country: "",
    professional_headline: "",
    years_of_experience: 5,
    expertise: "",
    industries: "",
    linkedin_url: "",
    bio: "",
    headshot_url: "",
    support_preferences: "",
    mentor_statement: "",
  });

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMentors({
        search: search || undefined,
        status: statusFilter || undefined,
        organisation: organisationFilter || undefined,
        industry: industryFilter || undefined,
        expertise: expertiseFilter || undefined,
        country: countryFilter || undefined,
      });
      setMentors(data);
    } catch (err) {
      console.error("Failed to load mentors", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, organisationFilter, industryFilter, expertiseFilter, countryFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadMentors(), 250);
    return () => window.clearTimeout(timeoutId);
  }, [loadMentors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const profileData = {
        phone: formData.phone || undefined,
        organisation: formData.company_name || undefined,
        current_role: formData.designation || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        professional_headline: formData.professional_headline || undefined,
        years_of_experience: Number(formData.years_of_experience),
        expertise: splitList(formData.expertise),
        industries: splitList(formData.industries),
        linkedin_url: formData.linkedin_url || undefined,
        bio: formData.bio || undefined,
        professional_headshot_url: formData.headshot_url || undefined,
        support_preferences: splitList(formData.support_preferences),
        mentoring_statement: formData.mentor_statement || undefined,
      };
      if (editingMentor) {
        await updateMentor(editingMentor.id, profileData);
      } else {
        await createMentor({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password || undefined,
          ...profileData,
        });
        setDirectoryRefreshKey((value) => value + 1);
      }
      setShowModal(false);
      setEditingMentor(null);
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        company_name: "",
        designation: "",
        city: "",
        country: "",
        professional_headline: "",
        years_of_experience: 5,
        expertise: "",
        industries: "",
        linkedin_url: "",
        bio: "",
        headshot_url: "",
        support_preferences: "",
        mentor_statement: "",
      });
      await loadMentors();
    } catch (err) {
      alert(`Failed to ${editingMentor ? "update" : "provision"} mentor: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingMentor(null);
    setFormData({
      full_name: "", email: "", password: "", phone: "", company_name: "",
      designation: "", city: "", country: "", professional_headline: "",
      years_of_experience: 5, expertise: "", industries: "",
      linkedin_url: "", bio: "", headshot_url: "",
      support_preferences: "", mentor_statement: "",
    });
    setShowModal(true);
  };

  const openEditModal = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setFormData({
      full_name: mentor.full_name || "",
      email: mentor.email || "",
      password: "",
      phone: mentor.phone || "",
      company_name: mentor.organisation || mentor.company_name || "",
      designation: mentor.current_role || mentor.designation || "",
      city: mentor.city || "",
      country: mentor.country || "",
      professional_headline: mentor.professional_headline || "",
      years_of_experience: mentor.years_of_experience || 0,
      expertise: mentor.expertise?.join(", ") || "",
      industries: mentor.industries?.join(", ") || "",
      linkedin_url: mentor.linkedin_url || "",
      bio: mentor.bio || "",
      headshot_url: mentor.professional_headshot_url || mentor.headshot_url || "",
      support_preferences: mentor.support_preferences?.join(", ") || "",
      mentor_statement: mentor.mentoring_statement || mentor.mentor_statement || "",
    });
    setShowModal(true);
  };

  const requestDelete = (mentor: Mentor) => {
    setDeleteError(null);
    setMentorPendingDelete(mentor);
  };

  const changeMentorStatus = async (
    mentor: Mentor,
    status: MentorStatus
  ) => {
    try {
      setStatusUpdatingId(mentor.id);
      const updated = await updateMentor(mentor.id, { status });
      setMentors((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setSelectedMentor(updated);
      setDirectoryRefreshKey((value) => value + 1);
      await loadMentors();
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not update the mentor status."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const hasFilters = Boolean(
    search ||
      statusFilter ||
      organisationFilter ||
      industryFilter ||
      expertiseFilter ||
      countryFilter
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setOrganisationFilter("");
    setIndustryFilter("");
    setExpertiseFilter("");
    setCountryFilter("");
  };

  const confirmDelete = async () => {
    if (!mentorPendingDelete) return;

    try {
      setDeletingId(mentorPendingDelete.id);
      setDeleteError(null);
      await deleteMentor(mentorPendingDelete.id);
      setMentors((current) =>
        current.filter((mentor) => mentor.id !== mentorPendingDelete.id)
      );
      setDirectoryRefreshKey((value) => value + 1);
      setMentorPendingDelete(null);
      await loadMentors();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete the mentor."
      );
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
            Enrolled Mentors
          </h1>
          <p className="text-sm text-slate-600">
            Review synchronized industry mentors and their fellowship assignments.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Mentor Manually
        </button>
      </div>

      <EnrollmentSyncStatus
        entity="mentors"
        onSynced={loadMentors}
        refreshKey={directoryRefreshKey}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-8">
        <input
          type="text"
          placeholder="Search name, email, org, role, expertise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none md:col-span-2 xl:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MentorStatus | "")}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="text"
          placeholder="Organisation"
          value={organisationFilter}
          onChange={(e) => setOrganisationFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Industry"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Expertise"
          value={expertiseFilter}
          onChange={(e) => setExpertiseFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Country"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading mentors...</div>
      ) : mentors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UserRound className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No mentors found</h3>
          <p className="mt-1 text-xs text-slate-500">Connect the enrollment workbook or add a mentor manually.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Mentor</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Expertise</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
          {mentors.map((mentor) => (
            <tr
              key={mentor.id}
              onClick={() => setSelectedMentor(mentor)}
              className="cursor-pointer transition hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-xs font-bold text-brand-800 ring-1 ring-brand-200">
                  <span>{mentorInitials(mentor.full_name)}</span>
                  {mentorPhoto(mentor) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mentorPhoto(mentor) || undefined}
                      alt={`${mentor.full_name || "Mentor"} headshot`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{mentor.full_name || "Mentor"}</td>
              <td className="px-4 py-3 text-slate-600">{mentor.email || "Not provided"}</td>
              <td className="px-4 py-3 text-slate-700">{mentorRole(mentor)}</td>
              <td className="px-4 py-3 text-slate-700">{mentorOrganisation(mentor)}</td>
              <td className="px-4 py-3 text-slate-600">{mentorLocation(mentor)}</td>
              <td className="px-4 py-3 text-slate-600">{mentor.expertise?.slice(0, 2).join(", ") || "Not specified"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{mentor.years_of_experience ?? 0} Years</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${mentorStatusClasses(mentor.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {mentor.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    <EntityActionsMenu
                      label={mentor.full_name || "Mentor"}
                      onView={() => setSelectedMentor(mentor)}
                      onEdit={() => openEditModal(mentor)}
                      onDelete={() => requestDelete(mentor)}
                      deleteLabel={deletingId === mentor.id ? "Deleting..." : "Delete"}
                    />
              </td>
            </tr>
          ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMentor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mentor-profile-title"
        >
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-blue-50 p-6 sm:p-8">
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-brand-300/20 blur-3xl" />
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                aria-label="Close mentor profile"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-200 to-brand-400 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
                  <span>{mentorInitials(selectedMentor.full_name)}</span>
                  {mentorPhoto(selectedMentor) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mentorPhoto(selectedMentor) || undefined}
                      alt={`${selectedMentor.full_name || "Mentor"} headshot`}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="absolute h-24 w-24 object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="mentor-profile-title" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {selectedMentor.full_name || "Mentor"}
                    </h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${mentorStatusClasses(selectedMentor.status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {selectedMentor.status}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-semibold text-brand-700">
                    {mentorRole(selectedMentor)}
                    {mentorOrganisation(selectedMentor) ? ` at ${mentorOrganisation(selectedMentor)}` : ""}
                  </p>
                  {selectedMentor.professional_headline && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {selectedMentor.professional_headline}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.45fr_0.75fr]">
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Professional bio</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {selectedMentor.bio || "Professional bio has not been provided yet."}
                  </p>
                </section>

                {(selectedMentor.mentoring_statement || selectedMentor.mentor_statement) && (
                  <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
                    <Quote className="h-5 w-5 text-brand-500" />
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                      “As a mentor, I help fellows {selectedMentor.mentoring_statement || selectedMentor.mentor_statement}”
                    </p>
                  </section>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <section>
                    <h3 className="text-sm font-bold text-slate-900">Areas of expertise</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedMentor.expertise?.length ? selectedMentor.expertise : ["Not specified"]).map((item) => (
                        <span key={item} className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-sm font-bold text-slate-900">Industries</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedMentor.industries?.length ? selectedMentor.industries : ["Not specified"]).map((item) => (
                        <span key={item} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                <section>
                  <h3 className="text-sm font-bold text-slate-900">How this mentor supports fellows</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedMentor.support_preferences?.length
                      ? selectedMentor.support_preferences
                      : ["Support preferences not specified"]
                    ).map((item) => (
                      <span key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-bold text-slate-900">Contact and experience</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span className="min-w-0 break-all">{selectedMentor.email || "Not provided"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{selectedMentor.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div>
                      <p>{mentorLocation(selectedMentor)}</p>
                      {(selectedMentor.city || selectedMentor.country) && (
                        <p className="mt-1 text-xs text-slate-500">
                          City: {selectedMentor.city || "Not provided"} · Country: {selectedMentor.country || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{selectedMentor.years_of_experience ?? 0} years of professional experience</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{selectedMentor.assigned_teams_count} active fellowship team(s)</span>
                  </div>
                </div>

                {selectedMentor.linkedin_url && (
                  <a
                    href={selectedMentor.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    View professional profile
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admin review
                  </p>
                  {selectedMentor.status === "pending" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={statusUpdatingId === selectedMentor.id}
                        onClick={() => void changeMentorStatus(selectedMentor, "active")}
                        className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={statusUpdatingId === selectedMentor.id}
                        onClick={() => void changeMentorStatus(selectedMentor, "rejected")}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : selectedMentor.status === "active" ? (
                    <button
                      type="button"
                      disabled={statusUpdatingId === selectedMentor.id}
                      onClick={() => void changeMentorStatus(selectedMentor, "inactive")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Mark inactive
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={statusUpdatingId === selectedMentor.id}
                      onClick={() => void changeMentorStatus(selectedMentor, "active")}
                      className="w-full rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
                    >
                      Activate mentor
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={Boolean(mentorPendingDelete)}
        entityLabel="Mentor"
        entityName={mentorPendingDelete?.full_name || "this mentor"}
        deleting={Boolean(deletingId)}
        error={deleteError}
        onCancel={() => {
          setMentorPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDelete}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              {editingMentor ? "Edit Mentor" : "Add Mentor Manually"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingMentor)}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingMentor)}
                    placeholder="mentor@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                {!editingMentor && <div>
                  <label className="block text-xs font-medium text-slate-700">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Set temporary password (min 8 chars)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">City</label>
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Organisation</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Current Role</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Professional Headline</label>
                <input
                  type="text"
                  placeholder="A concise professional introduction"
                  value={formData.professional_headline}
                  onChange={(e) => setFormData({ ...formData, professional_headline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Professional Headshot URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.headshot_url}
                  onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Areas of Expertise</label>
                  <input
                    type="text"
                    placeholder="AI/ML, Product, Leadership"
                    value={formData.expertise}
                    onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Industries</label>
                  <input
                    type="text"
                    placeholder="Technology, Education, Healthcare"
                    value={formData.industries}
                    onChange={(e) => setFormData({ ...formData, industries: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Short Professional Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">How would you like to support DLIF fellows?</label>
                <textarea
                  rows={2}
                  placeholder="Separate multiple options with commas"
                  value={formData.support_preferences}
                  onChange={(e) => setFormData({ ...formData, support_preferences: e.target.value })}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">As a mentor, I help fellows…</label>
                <textarea
                  rows={2}
                  value={formData.mentor_statement}
                  onChange={(e) => setFormData({ ...formData, mentor_statement: e.target.value })}
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 p-2 text-sm focus:border-slate-900 focus:outline-none"
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
                  {submitting ? "Saving..." : editingMentor ? "Save Changes" : "Save Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
