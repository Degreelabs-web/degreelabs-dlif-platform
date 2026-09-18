"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UsersRound,
  FileText,
  UserRound,
  Briefcase,
  FolderGit2,
  CalendarDays,
  ArrowRight,
  PlusCircle,
  Loader2,
  BookOpen,
  Video,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  MessageSquare,
  ChevronDown,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { fetchStudents } from "@/lib/api/students";
import { fetchTeams } from "@/lib/api/teams";
import { fetchSubmissions } from "@/lib/api/submissions";
import { fetchCohorts } from "@/lib/api/cohorts";
import { fetchMentors, fetchCompanies, fetchProjects } from "@/lib/api/fellowship";
import { Cohort, Student, Submission } from "@/types/fellowship";
import {
  fetchAdminMentorSlots,
  approveMentorSlot,
  declineMentorSlot,
  rescheduleAdminMentorSlot,
  deleteAdminMentorSlot,
  MentorSlotRequest,
} from "@/lib/api/mentor_slots";

// ─── Schedule Meet Modal ──────────────────────────────────────────────────────

interface ScheduleMeetModalProps {
  request: MentorSlotRequest;
  mentors: { id: string; full_name: string }[];
  onClose: () => void;
  onApproved: (updated: MentorSlotRequest) => void;
}

function ScheduleMeetModal({ request, mentors, onClose, onApproved }: ScheduleMeetModalProps) {
  // Pre-fill from confirmed time if editing, or preferred date/time
  const prefDate = request.confirmed_start_time
    ? request.confirmed_start_time.slice(0, 10)
    : (request.preferred_date || "");
  const prefStart = request.confirmed_start_time
    ? request.confirmed_start_time.slice(11, 16)
    : (request.preferred_time_start?.slice(0, 5) || "10:00");
  const prefEnd = request.confirmed_end_time
    ? request.confirmed_end_time.slice(11, 16)
    : (request.preferred_time_end?.slice(0, 5) || "11:00");

  const [date, setDate] = useState(prefDate);
  const [startTime, setStartTime] = useState(prefStart);
  const [endTime, setEndTime] = useState(prefEnd);
  const [mentorId, setMentorId] = useState(request.assigned_mentor_id || mentors[0]?.id || "");
  const [adminNote, setAdminNote] = useState(request.admin_note || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date || !startTime || !endTime || !mentorId) {
      setError("Please fill in all required fields.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    try {
      setLoading(true);
      const confirmedStart = `${date}T${startTime}:00`;
      const confirmedEnd = `${date}T${endTime}:00`;
      const payload = {
        assigned_mentor_id: mentorId,
        confirmed_start_time: confirmedStart,
        confirmed_end_time: confirmedEnd,
        admin_note: adminNote || undefined,
      };

      let updated: MentorSlotRequest;
      if (request.status === "approved") {
        updated = await rescheduleAdminMentorSlot(request.id, payload);
      } else {
        updated = await approveMentorSlot(request.id, payload);
      }
      onApproved(updated);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Failed to schedule meet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {request.status === "approved" ? "Edit / Reschedule Mentor Meet" : "Schedule Mentor Meet"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Team: <span className="font-semibold text-slate-700">{request.team_name}</span>
                {request.requester_name && (
                  <> · Requested by <span className="font-semibold">{request.requester_name}</span></>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Requested Slot Info */}
        <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Team's Requested Slot &amp; Topic
          </p>
          <p>
            <span className="font-medium">Date:</span> {request.preferred_date} &nbsp;
            <span className="font-medium">Time:</span>{" "}
            {request.preferred_time_start?.slice(0, 5)} – {request.preferred_time_end?.slice(0, 5)}
          </p>
          <p className="mt-1 italic">"{request.topic}"</p>
        </div>

        {/* Form */}
        <form onSubmit={handleApprove} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirmed Date */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="h-3.5 w-3.5 text-sky-600" />
              Confirmed Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Confirmed Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Assign Mentor */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <UserRound className="h-3.5 w-3.5 text-sky-600" />
              Assign Mentor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">— Select a mentor —</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Admin Note */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Admin Note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Any instructions or context for the team…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scheduling…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {request.status === "approved" ? "Update & Reschedule Meet" : "Schedule & Generate Meet"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Decline Modal ────────────────────────────────────────────────────────────

function DeclineModal({
  request,
  onClose,
  onDeclined,
}: {
  request: MentorSlotRequest;
  onClose: () => void;
  onDeclined: (updated: MentorSlotRequest) => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) { setError("Please provide a reason."); return; }
    try {
      setLoading(true);
      const updated = await declineMentorSlot(request.id, { admin_note: note.trim() });
      onDeclined(updated);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Failed to decline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900">Decline Slot Request</h2>
        <p className="mt-1 text-xs text-slate-500">
          Team: <span className="font-semibold">{request.team_name}</span>. The team will be notified by email.
        </p>
        <form onSubmit={handleDecline} className="mt-4 space-y-3">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for declining (e.g. slot unavailable, please resubmit for next week)…"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
          />
          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    teams: 0,
    submissions: 0,
    mentors: 0,
    companies: 0,
    projects: 0,
  });
  const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  // Mentor slot requests state
  const [slotRequests, setSlotRequests] = useState<MentorSlotRequest[]>([]);
  const [slotFilter, setSlotFilter] = useState<"pending" | "approved" | "declined" | "all">("pending");
  const [mentorList, setMentorList] = useState<{ id: string; full_name: string }[]>([]);
  const [schedulingRequest, setSchedulingRequest] = useState<MentorSlotRequest | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<MentorSlotRequest | null>(null);
  const [slotLoading, setSlotLoading] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          studentsRes,
          teamsRes,
          submissionsRes,
          cohortsRes,
          mentorsRes,
          companiesRes,
          projectsRes,
        ] = await Promise.allSettled([
          fetchStudents(),
          fetchTeams(),
          fetchSubmissions(),
          fetchCohorts(),
          fetchMentors(),
          fetchCompanies(),
          fetchProjects(),
        ]);

        const students = studentsRes.status === "fulfilled" ? studentsRes.value : [];
        const teams = teamsRes.status === "fulfilled" ? teamsRes.value : [];
        const submissions = submissionsRes.status === "fulfilled" ? submissionsRes.value : [];
        const cohorts = cohortsRes.status === "fulfilled" ? cohortsRes.value : [];
        const mentors = mentorsRes.status === "fulfilled" ? mentorsRes.value : [];
        const companies = companiesRes.status === "fulfilled" ? companiesRes.value : [];
        const projects = projectsRes.status === "fulfilled" ? projectsRes.value : [];

        setStats({
          students: students.length,
          teams: teams.length,
          submissions: submissions.length,
          mentors: mentors.length,
          companies: companies.length,
          projects: projects.length,
        });

        const active = cohorts.find((c) => c.status === "active") || cohorts[0] || null;
        setActiveCohort(active);
        setRecentStudents(students.slice(0, 5));
        setRecentSubmissions(submissions.slice(0, 5));

        // Build mentor dropdown list from mentors API
        const mentorDropdown = mentors.map((m: any) => ({
          id: m.id,
          full_name: m.full_name || m.name || "Mentor",
        }));
        setMentorList(mentorDropdown);
      } catch (err) {
        console.error("Failed to load admin telemetry", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Load mentor slot requests whenever filter changes
  useEffect(() => {
    async function loadSlots() {
      setSlotLoading(true);
      try {
        const slots = await fetchAdminMentorSlots(slotFilter === "all" ? undefined : slotFilter);
        setSlotRequests(slots);
      } catch {
        setSlotRequests([]);
      } finally {
        setSlotLoading(false);
      }
    }
    loadSlots();
  }, [slotFilter]);

  const handleApproved = (updated: MentorSlotRequest) => {
    setSlotRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSchedulingRequest(null);
  };

  const handleDeclined = (updated: MentorSlotRequest) => {
    setSlotRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setDecliningRequest(null);
  };

  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  const handleDeleteSlot = async (req: MentorSlotRequest) => {
    const isApproved = req.status === "approved";
    const msg = isApproved
      ? `Are you sure you want to cancel and delete this scheduled mentor session for Team "${req.team_name || "Team"}"? This will cancel the meeting.`
      : `Are you sure you want to delete this slot request for Team "${req.team_name || "Team"}"?`;
    if (!window.confirm(msg)) return;

    try {
      setDeletingSlotId(req.id);
      await deleteAdminMentorSlot(req.id);
      setSlotRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (err: any) {
      window.alert(err?.data?.detail || err?.message || "Failed to cancel slot request.");
    } finally {
      setDeletingSlotId(null);
    }
  };

  const pendingCount = slotRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Admin Telemetry &amp; Command Center
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Fellowship Operations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time control over students, cohorts, teams, mentors, partner companies, and deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/assignments"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Assignments Center
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading fellowship metrics...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Users}
              label="Total Students"
              value={stats.students}
              description="Provisioned in fellowship"
              href="/admin/students"
            />
            <StatCard
              icon={UsersRound}
              label="Active Teams"
              value={stats.teams}
              description="Formed project squads"
              href="/admin/teams"
            />
            <StatCard
              icon={FileText}
              label="Submissions"
              value={stats.submissions}
              description="Deliverables turned in"
              href="/admin/submissions"
            />
          </div>

          {/* Secondary Telemetry */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SecondaryMetricCard
              icon={UserRound}
              label="Mentors Roster"
              count={stats.mentors}
              href="/admin/mentors"
            />
            <SecondaryMetricCard
              icon={Briefcase}
              label="Partner Companies"
              count={stats.companies}
              href="/admin/companies"
            />
            <SecondaryMetricCard
              icon={FolderGit2}
              label="Industry Projects"
              count={stats.projects}
              href="/admin/projects"
            />
          </div>

          {/* ── Mentor Slot Requests Queue ── */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Mentor Slot Requests
                    {pendingCount > 0 && slotFilter === "pending" && (
                      <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {pendingCount} pending
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review team-requested mentor consultation slots and schedule Google Meet sessions.
                  </p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
                {(["pending", "approved", "declined", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSlotFilter(f)}
                    className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                      slotFilter === f
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot list */}
            {slotLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading requests…</span>
              </div>
            ) : slotRequests.length === 0 ? (
              <div className="py-12 text-center">
                <Video className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">
                  No {slotFilter !== "all" ? slotFilter : ""} mentor slot requests.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Team leads can request slots from their Team Workspace page.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {slotRequests.map((req) => (
                  <div key={req.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between hover:bg-slate-50/60 transition-colors">
                    {/* Left: request info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{req.team_name || "Unknown Team"}</span>
                        {req.cohort_name && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {req.cohort_name}
                          </span>
                        )}
                        <SlotStatusBadge status={req.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {req.preferred_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {req.preferred_time_start?.slice(0, 5)} – {req.preferred_time_end?.slice(0, 5)}
                        </span>
                        {req.requester_name && (
                          <span className="flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            {req.requester_name}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 italic truncate max-w-xl">
                        "{req.topic}"
                      </p>

                      {/* Approved: show confirmed details */}
                      {req.status === "approved" && req.confirmed_start_time && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-emerald-700 font-semibold">
                            ✓ Scheduled: {req.confirmed_start_time.slice(0, 16).replace("T", " ")}
                          </span>
                          {req.meet_link && (
                            <a
                              href={req.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                            >
                              <Video className="h-3 w-3" />
                              Join Meet
                            </a>
                          )}
                          {req.assigned_mentor_name && (
                            <span className="text-slate-500">Mentor: {req.assigned_mentor_name}</span>
                          )}
                        </div>
                      )}

                      {/* Declined: show admin note */}
                      {req.status === "declined" && req.admin_note && (
                        <p className="text-xs text-red-600 mt-1">
                          Declined: {req.admin_note}
                        </p>
                      )}
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex shrink-0 items-center gap-2">
                      {req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setDecliningRequest(req)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchedulingRequest(req)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-xs"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Schedule Meet
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(req)}
                            disabled={deletingSlotId === req.id}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                            title="Delete request"
                          >
                            {deletingSlotId === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}

                      {req.status === "approved" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSchedulingRequest(req)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                            title="Edit / Reschedule session"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            Edit / Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(req)}
                            disabled={deletingSlotId === req.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Cancel scheduled session"
                          >
                            {deletingSlotId === req.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Cancel Session
                          </button>
                        </>
                      )}

                      {req.status === "declined" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSchedulingRequest(req)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                          >
                            <Video className="h-3.5 w-3.5 text-sky-600" />
                            Re-schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(req)}
                            disabled={deletingSlotId === req.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
                            title="Delete request"
                          >
                            {deletingSlotId === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Cohort Status */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  {activeCohort ? "Active Cohort" : "Cohort Status"}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  {activeCohort ? activeCohort.name : "No active cohort detected"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeCohort
                    ? `Academic Year: ${activeCohort.academic_year} | Running from ${new Date(
                        activeCohort.start_date
                      ).toLocaleDateString()} to ${new Date(
                        activeCohort.end_date
                      ).toLocaleDateString()}`
                    : "Create a cohort to begin enrolling students and scheduling sessions."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/admin/cohorts"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <BookOpen className="h-4 w-4" />
                  Manage Cohorts
                </Link>
                <Link
                  href="/admin/sessions"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <CalendarDays className="h-4 w-4" />
                  Cohort Sessions
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Command Actions */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Operational Workflows
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Instant navigation
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ActionCard
                title="Provision Students"
                description="Enroll university candidates, setup auth credentials, and manage profiles."
                href="/admin/students"
                badge="Students"
              />
              <ActionCard
                title="Team Management"
                description="Create student squads, allocate team leaders, and manage roster seats."
                href="/admin/teams"
                badge="Squads"
              />
              <ActionCard
                title="Assignments Matrix"
                description="Pair teams with mentors and sponsor company projects with validation."
                href="/admin/assignments"
                badge="Workflow"
              />
              <ActionCard
                title="Curriculum &amp; Sessions"
                description="Generate AI discover curriculum, schedule weekly workshops and tasks."
                href="/admin/sessions"
                badge="Education"
              />
              <ActionCard
                title="Executive Reports"
                description="Analyze fellowship health, team completion velocity, and mentor reviews."
                href="/admin/reports"
                badge="Analytics"
              />
            </div>
          </section>

          {/* Recent Activity Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Newly Provisioned Students */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Students
                </h3>
                <Link
                  href="/admin/students"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentStudents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No students provisioned yet.
                  </p>
                ) : (
                  recentStudents.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {s.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {s.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Submissions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Deliverables
                </h3>
                <Link
                  href="/admin/submissions"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {recentSubmissions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No submissions recorded yet.
                  </p>
                ) : (
                  recentSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Submission #{sub.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Status: {sub.status}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* Modals */}
      {schedulingRequest && (
        <ScheduleMeetModal
          request={schedulingRequest}
          mentors={mentorList}
          onClose={() => setSchedulingRequest(null)}
          onApproved={handleApproved}
        />
      )}
      {decliningRequest && (
        <DeclineModal
          request={decliningRequest}
          onClose={() => setDecliningRequest(null)}
          onDeclined={handleDeclined}
        />
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function SlotStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    declined: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${map[status] || map.cancelled}`}>
      {status}
    </span>
  );
}

// ─── Reusable UI components ───────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-700 ring-1 ring-inset ring-slate-200 group-hover:bg-slate-900 group-hover:text-white transition">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{description}</p>
    </Link>
  );
}

function SecondaryMetricCard({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="text-lg font-bold text-slate-900">{count}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {badge}
        </span>
        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </Link>
  );
}
