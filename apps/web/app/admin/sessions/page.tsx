"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  PlusCircle,
  Sparkles,
  Clock,
  Video,
  ListTodo,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  fetchSessions,
  createSession,
  updateSession,
  deleteSession,
  generateDiscoverCurriculum,
  retryGenerateMeet,
} from "@/lib/api/sessions";
import { fetchCohorts } from "@/lib/api/cohorts";
import { fetchMentors } from "@/lib/api/fellowship";
import {
  fetchAdminMentorSlots,
  approveMentorSlot,
  declineMentorSlot,
  rescheduleAdminMentorSlot,
  deleteAdminMentorSlot,
  MentorSlotRequest,
} from "@/lib/api/mentor_slots";
import { Cohort, Session } from "@/types/fellowship";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";

function toISTInputValue(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const istTime = new Date(d.getTime() + 330 * 60 * 1000);
  return istTime.toISOString().slice(0, 16);
}

function fromISTInputToUTC(val: string): string {
  if (!val) return "";
  const d = new Date(`${val}:00+05:30`);
  return isNaN(d.getTime()) ? val : d.toISOString();
}

export default function AdminSessionsPage() {
  const [activeTab, setActiveTab] = useState<"sessions" | "slot-requests">("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [retryingMeetId, setRetryingMeetId] = useState<string | null>(null);
  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null);

  // Mentor slot requests state
  const [slotRequests, setSlotRequests] = useState<MentorSlotRequest[]>([]);
  const [slotFilter, setSlotFilter] = useState<"pending" | "approved" | "declined" | "all">("pending");
  const [slotLoading, setSlotLoading] = useState(false);
  const [mentorList, setMentorList] = useState<{ id: string; full_name: string }[]>([]);
  const [schedulingRequest, setSchedulingRequest] = useState<MentorSlotRequest | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<MentorSlotRequest | null>(null);
  // Schedule meet form state
  const [schedDate, setSchedDate] = useState("");
  const [schedStart, setSchedStart] = useState("");
  const [schedEnd, setSchedEnd] = useState("");
  const [schedMentor, setSchedMentor] = useState("");
  const [schedNote, setSchedNote] = useState("");
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);
  // Decline form state
  const [declineNote, setDeclineNote] = useState("");
  const [declineLoading, setDeclineLoading] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);

  // Create Session Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState({
    cohort_id: "",
    week_number: 1,
    session_number: 100,
    title: "Induction on DLIF",
    description: "",
    agenda: "",
    session_type: "induction",
    facilitator_name: "",
    scheduled_at: "",
    duration_minutes: 90,
    meeting_url: "",
    join_available_from: "",
    join_available_until: "",
    recording_url: "",
    status: "scheduled",
  });

  // Discover Curriculum Modal
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false);
  const [curriculumSuccess, setCurriculumSuccess] = useState<string | null>(null);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [curriculumParams, setCurriculumParams] = useState({
    cohort_id: "",
    start_date: "",
    session_duration_minutes: 90,
    default_meeting_url: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [sessionsData, cohortsData, mentorsData] = await Promise.all([
        fetchSessions({ cohort_id: selectedCohort || undefined }),
        fetchCohorts(),
        fetchMentors().catch(() => []),
      ]);
      setSessions(sessionsData);
      setCohorts(cohortsData);
      setMentorList(
        (mentorsData as any[]).map((m: any) => ({ id: m.id, full_name: m.full_name || m.name || "Mentor" }))
      );
      if (cohortsData.length > 0 && !sessionData.cohort_id) {
        setSessionData((prev) => ({ ...prev, cohort_id: cohortsData[0].id }));
        setCurriculumParams((prev) => ({ ...prev, cohort_id: cohortsData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [selectedCohort]);

  // Load mentor slot requests
  useEffect(() => {
    async function loadSlots() {
      setSlotLoading(true);
      try {
        const slots = await fetchAdminMentorSlots(slotFilter === "all" ? undefined : slotFilter);
        setSlotRequests(slots);
      } catch { setSlotRequests([]); }
      finally { setSlotLoading(false); }
    }
    if (activeTab === "slot-requests") loadSlots();
  }, [slotFilter, activeTab]);

  const pendingCount = slotRequests.filter((r) => r.status === "pending").length;
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  function openScheduleModal(req: MentorSlotRequest) {
    setSchedulingRequest(req);
    if (req.confirmed_start_time) {
      const startDatePart = req.confirmed_start_time.slice(0, 10);
      const startTimePart = req.confirmed_start_time.slice(11, 16);
      const endTimePart = req.confirmed_end_time ? req.confirmed_end_time.slice(11, 16) : "11:00";
      setSchedDate(startDatePart);
      setSchedStart(startTimePart);
      setSchedEnd(endTimePart);
      setSchedMentor(req.assigned_mentor_id || mentorList[0]?.id || "");
      setSchedNote(req.admin_note || "");
    } else {
      setSchedDate(req.preferred_date || "");
      setSchedStart(req.preferred_time_start?.slice(0, 5) || "10:00");
      setSchedEnd(req.preferred_time_end?.slice(0, 5) || "11:00");
      setSchedMentor(mentorList[0]?.id || "");
      setSchedNote("");
    }
    setSchedError(null);
  }

  async function handleApproveSlot(e: React.FormEvent) {
    e.preventDefault();
    setSchedError(null);
    if (!schedDate || !schedStart || !schedEnd || !schedMentor) {
      setSchedError("All fields are required."); return;
    }
    if (schedStart >= schedEnd) { setSchedError("End time must be after start time."); return; }
    try {
      setSchedLoading(true);
      const payload = {
        assigned_mentor_id: schedMentor,
        confirmed_start_time: `${schedDate}T${schedStart}:00`,
        confirmed_end_time: `${schedDate}T${schedEnd}:00`,
        admin_note: schedNote || undefined,
      };

      let updated: MentorSlotRequest;
      if (schedulingRequest?.status === "approved") {
        updated = await rescheduleAdminMentorSlot(schedulingRequest.id, payload);
      } else {
        updated = await approveMentorSlot(schedulingRequest!.id, payload);
      }
      setSlotRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSchedulingRequest(null);
    } catch (err: any) {
      setSchedError(err?.data?.detail || err?.message || "Failed to save slot.");
    } finally { setSchedLoading(false); }
  }

  async function handleDeleteSlot(req: MentorSlotRequest) {
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
  }

  async function handleDeclineSlot(e: React.FormEvent) {
    e.preventDefault();
    setDeclineError(null);
    if (!declineNote.trim()) { setDeclineError("Please provide a reason."); return; }
    try {
      setDeclineLoading(true);
      const updated = await declineMentorSlot(decliningRequest!.id, { admin_note: declineNote.trim() });
      setSlotRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDecliningRequest(null);
    } catch (err: any) {
      setDeclineError(err?.data?.detail || err?.message || "Failed to decline.");
    } finally { setDeclineLoading(false); }
  }

  function openCreateModal() {
    setEditingSession(null);
    setSessionFormError(null);
    setSessionData((prev) => ({
      ...prev,
      week_number: 1,
      session_number: 100,
      session_type: "induction",
      title: "Induction on DLIF",
      description: "",
      agenda: "",
      facilitator_name: "",
      scheduled_at: "",
      meeting_url: "",
      join_available_from: "",
      join_available_until: "",
      recording_url: "",
      status: "scheduled",
    }));
    setIsCreateModalOpen(true);
  }

  function openEditModal(session: Session) {
    setEditingSession(session);
    setSessionFormError(null);
    setSessionData({
      cohort_id: session.cohort_id,
      week_number: session.week_number,
      session_number: session.session_number,
      title: session.title,
      description: session.description || "",
      agenda: session.agenda || "",
      session_type: session.session_type || "workshop",
      facilitator_name: session.facilitator_name || "",
      scheduled_at: session.scheduled_at
        ? toISTInputValue(session.scheduled_at)
        : "",
      duration_minutes: session.duration_minutes,
      meeting_url: session.meeting_url || "",
      join_available_from: session.join_available_from
        ? toISTInputValue(session.join_available_from)
        : "",
      join_available_until: session.join_available_until
        ? toISTInputValue(session.join_available_until)
        : "",
      recording_url: session.recording_url || "",
      status: session.status,
    });
    setIsCreateModalOpen(true);
  }

  async function handleSubmitSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionFormError(null);
    setSubmittingSession(true);

    try {
      if (!sessionData.cohort_id) {
        throw new Error("Please select a cohort.");
      }
      const cleanOptional = (value: string) => value.trim() || undefined;
      const payload = {
        week_number: Number(sessionData.week_number),
        session_number: Number(sessionData.session_number),
        title: sessionData.title.trim(),
        description: cleanOptional(sessionData.description),
        agenda: cleanOptional(sessionData.agenda),
        session_type: sessionData.session_type,
        facilitator_name: cleanOptional(sessionData.facilitator_name),
        scheduled_at: sessionData.scheduled_at ? fromISTInputToUTC(sessionData.scheduled_at) : undefined,
        duration_minutes: Number(sessionData.duration_minutes),
        meeting_url: cleanOptional(sessionData.meeting_url),
        join_available_from: sessionData.join_available_from ? fromISTInputToUTC(sessionData.join_available_from) : undefined,
        join_available_until: sessionData.join_available_until ? fromISTInputToUTC(sessionData.join_available_until) : undefined,
        recording_url: cleanOptional(sessionData.recording_url),
        status: sessionData.status,
      };

      if (editingSession) {
        await updateSession(editingSession.id, payload);
      } else {
        await createSession({ ...payload, cohort_id: sessionData.cohort_id });
      }

      setIsCreateModalOpen(false);
      setEditingSession(null);
      setSessionData((prev) => ({
        ...prev,
        title: "",
        description: "",
        week_number: prev.week_number + 1,
        session_number: prev.session_number + 1,
      }));
      loadData();
    } catch (err: any) {
      setSessionFormError(
        err.message || `Failed to ${editingSession ? "update" : "create"} session.`
      );
    } finally {
      setSubmittingSession(false);
    }
  }

  async function handleDeleteSession(session: Session) {
    if (!window.confirm(`Delete session "${session.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(session.id);
      await deleteSession(session.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete session.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRetryMeet(session: Session) {
    try {
      setRetryingMeetId(session.id);
      const updated = await retryGenerateMeet(session.id);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to generate Meet link."
      );
    } finally {
      setRetryingMeetId(null);
    }
  }

  async function handleCopyMeetLink(session: Session) {
    if (!session.meet_link) return;
    await navigator.clipboard.writeText(session.meet_link);
    setCopiedMeetId(session.id);
    setTimeout(() => setCopiedMeetId(null), 2000);
  }

  async function handleGenerateCurriculum(e: React.FormEvent) {
    e.preventDefault();
    setCurriculumError(null);
    setCurriculumSuccess(null);
    setGeneratingCurriculum(true);

    try {
      if (!curriculumParams.cohort_id) {
        throw new Error("Please select a target cohort.");
      }

      const result = await generateDiscoverCurriculum(curriculumParams.cohort_id, {
        start_date: curriculumParams.start_date || undefined,
        session_duration_minutes: Number(curriculumParams.session_duration_minutes),
        default_meeting_url: curriculumParams.default_meeting_url.trim() || undefined,
      });

      setCurriculumSuccess(
        `Generated ${result.sessions_count} Discover curriculum sessions.`
      );
      setTimeout(() => {
        setIsDiscoverModalOpen(false);
        setCurriculumSuccess(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setCurriculumError(err.message || "Failed to generate curriculum.");
    } finally {
      setGeneratingCurriculum(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Fellowship Education
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Curriculum & Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Schedule live workshops, generate AI discover tracks, and assign deliverable tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDiscoverModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Generate Discover Track
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create Session
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "sessions"
            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          <CalendarDays className="h-4 w-4" />
          Cohort Sessions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("slot-requests")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeTab === "slot-requests"
            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
            : "text-slate-500 hover:text-slate-700"
            }`}
        >
          <Video className="h-4 w-4" />
          Mentor Slot Requests
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ══ TAB: Cohort Sessions ══ */}
      {activeTab === "sessions" && (
        <>
          {/* Cohort Filter */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Cohort Schedule:
            </label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none sm:w-auto"
            >
              <option value="">All Cohorts</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academic_year})
                </option>
              ))}
            </select>
          </div>

          {/* Sessions Timeline List */}
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
                <span className="text-sm font-medium">Loading session timeline...</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                No scheduled sessions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Generate the standard 4-week Discover track or schedule a standalone session.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setIsDiscoverModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Discover Track
                </button>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Session
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => {
                const cohort = cohorts.find((c) => c.id === sess.cohort_id);
                return (
                  <div
                    key={sess.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                          Week {sess.week_number}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                          {sess.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {cohort ? cohort.name : "Cohort"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {sess.title}
                      </h3>

                      <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                        {sess.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>
                            {sess.scheduled_at
                              ? new Date(sess.scheduled_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                              : "Schedule to be confirmed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{sess.duration_minutes} mins</span>
                        </div>

                        {sess.tasks && (
                          <div className="flex items-center gap-1.5">
                            <ListTodo className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{sess.tasks.length} task(s)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Meet Status Chip */}
                      {sess.meet_status === "scheduled" && sess.meet_link ? (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Meet: Scheduled
                          </span>
                          <button
                            onClick={() => handleCopyMeetLink(sess)}
                            title="Copy Meet link"
                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            {copiedMeetId === sess.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : sess.meet_status === "failed" ? (
                        <button
                          onClick={() => handleRetryMeet(sess)}
                          disabled={retryingMeetId === sess.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-60"
                        >
                          {retryingMeetId === sess.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Meet: Failed — Retry
                        </button>
                      ) : sess.scheduled_at && sess.meet_status === "not_scheduled" ? (
                        <button
                          onClick={() => handleRetryMeet(sess)}
                          disabled={retryingMeetId === sess.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {retryingMeetId === sess.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Video className="h-3 w-3" />
                          )}
                          Generate Meet
                        </button>
                      ) : null}

                      {sess.meet_link && (
                        <a
                          href={sess.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Video className="h-3.5 w-3.5 text-emerald-600" />
                          Join Call
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      )}
                      <EntityActionsMenu
                        label={sess.title}
                        onEdit={() => openEditModal(sess)}
                        onDelete={() => handleDeleteSession(sess)}
                        deleteLabel={deletingId === sess.id ? "Deleting..." : "Delete"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ TAB: Mentor Slot Requests ══ */}
      {activeTab === "slot-requests" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Sub-header with filter tabs */}
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
                  Review requests, pick a confirmed time, assign a mentor, and auto-generate the Google Meet room.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              {(["pending", "approved", "declined", "all"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSlotFilter(f)}
                  className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${slotFilter === f
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
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
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.team_name || "Unknown Team"}</span>
                      {req.cohort_name && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{req.cohort_name}</span>
                      )}
                      {/* Status badge */}
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${req.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : req.status === "declined" ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}>{req.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{req.preferred_date}</span>
                      <span>{req.preferred_time_start?.slice(0, 5)} – {req.preferred_time_end?.slice(0, 5)}</span>
                      {req.requester_name && <span>{req.requester_name}</span>}
                    </div>
                    <p className="text-xs text-slate-600 italic truncate max-w-xl">"{req.topic}"</p>
                    {req.status === "approved" && req.confirmed_start_time && (
                      <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                        <span className="text-emerald-700 font-semibold">
                          ✓ {req.confirmed_start_time.slice(0, 16).replace("T", " ")}
                        </span>
                        {req.meet_link && (
                          <a href={req.meet_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors">
                            <Video className="h-3 w-3" />Join Meet
                          </a>
                        )}
                        {req.assigned_mentor_name && <span className="text-slate-500">Mentor: {req.assigned_mentor_name}</span>}
                      </div>
                    )}
                    {req.status === "declined" && req.admin_note && (
                      <p className="text-xs text-red-600 mt-1">Reason: {req.admin_note}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setDecliningRequest(req); setDeclineNote(""); setDeclineError(null); }}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => openScheduleModal(req)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-sm"
                        >
                          <Video className="h-3.5 w-3.5" />Schedule Meet
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
                          onClick={() => openScheduleModal(req)}
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
                          onClick={() => openScheduleModal(req)}
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
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* Schedule Meet Modal */}
      {schedulingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {schedulingRequest.status === "approved" ? "Edit / Reschedule Mentor Meet" : "Schedule Mentor Meet"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Team: <span className="font-semibold text-slate-700">{schedulingRequest.team_name}</span>
                    {schedulingRequest.requester_name && <> · {schedulingRequest.requester_name}</>}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setSchedulingRequest(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Requested info */}
            <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Team's Requested Slot</p>
              <p>Date: {schedulingRequest.preferred_date} &nbsp; Time: {schedulingRequest.preferred_time_start?.slice(0, 5)} – {schedulingRequest.preferred_time_end?.slice(0, 5)}</p>
              <p className="mt-1 italic">"{schedulingRequest.topic}"</p>
            </div>
            <form onSubmit={handleApproveSlot} className="p-6 space-y-4">
              {schedError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{schedError}</span>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Confirmed Date <span className="text-red-500">*</span></label>
                <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">Start Time <span className="text-red-500">*</span></label>
                  <input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">End Time <span className="text-red-500">*</span></label>
                  <input type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Assign Mentor <span className="text-red-500">*</span></label>
                <select value={schedMentor} onChange={(e) => setSchedMentor(e.target.value)} required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20">
                  <option value="">— Select a mentor —</option>
                  {mentorList.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">Admin Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea rows={2} value={schedNote} onChange={(e) => setSchedNote(e.target.value)}
                  placeholder="Instructions or context for the team…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setSchedulingRequest(null)} disabled={schedLoading}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={schedLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
                  {schedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {schedulingRequest.status === "approved" ? "Update & Reschedule Meet" : "Schedule & Generate Meet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {decliningRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button type="button" onClick={() => setDecliningRequest(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold text-slate-900">Decline Slot Request</h2>
            <p className="mt-1 text-xs text-slate-500">Team: <span className="font-semibold">{decliningRequest.team_name}</span>. They will be notified by email.</p>
            <form onSubmit={handleDeclineSlot} className="mt-4 space-y-3">
              {declineError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{declineError}</span>
                </div>
              )}
              <textarea rows={3} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Reason for declining (e.g. slot unavailable, please resubmit for next week)…" required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20" />
              <div className="flex justify-end gap-2.5">
                <button type="button" onClick={() => setDecliningRequest(null)} disabled={declineLoading}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={declineLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                  {declineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Decline Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSession ? "Edit Workshop Session" : "Schedule Workshop Session"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingSession
                    ? "Update the workshop schedule and session details."
                    : "Plan a live fellowship sync, lecture, or review session."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingSession(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sessionFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{sessionFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSession} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Cohort *
                  </label>
                  <select
                    required
                    disabled={Boolean(editingSession)}
                    value={sessionData.cohort_id}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, cohort_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="" disabled>
                      Select Cohort
                    </option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Session Slot *
                  </label>

                  <select
                    required
                    value={
                      sessionData.session_type === "induction"
                        ? "induction"
                        : `${sessionData.week_number}-${((sessionData.session_number - 1) % 3) + 1}`
                    }
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "induction") {
                        setSessionData({
                          ...sessionData,
                          week_number: 1,
                          session_number: 100,
                          session_type: "induction",
                          title: "Induction on DLIF",
                        });

                        return;
                      }

                      const [weekValue, sessionValue] =
                        value.split("-").map(Number);

                      const globalSessionNumber =
                        (weekValue - 1) * 3 + sessionValue;

                      setSessionData({
                        ...sessionData,
                        week_number: weekValue,
                        session_number: globalSessionNumber,

                        // Session 1 & 2 = Learn + Work
                        // Session 3 = Output + Review
                        session_type:
                          sessionValue === 3
                            ? "output_review_gate"
                            : "learn_work",

                        // Clear induction title when switching away.
                        title:
                          sessionData.session_type === "induction"
                            ? ""
                            : sessionData.title,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="induction">
                      Induction on DLIF
                    </option>

                    <optgroup label="Week 1">
                      <option value="1-1">Session 1</option>
                      <option value="1-2">Session 2</option>
                      <option value="1-3">Session 3</option>
                    </optgroup>

                    <optgroup label="Week 2">
                      <option value="2-1">Session 1</option>
                      <option value="2-2">Session 2</option>
                      <option value="2-3">Session 3</option>
                    </optgroup>

                    <optgroup label="Week 3">
                      <option value="3-1">Session 1</option>
                      <option value="3-2">Session 2</option>
                      <option value="3-3">Session 3</option>
                    </optgroup>

                    <optgroup label="Week 4">
                      <option value="4-1">Session 1</option>
                      <option value="4-2">Session 2</option>
                      <option value="4-3">Session 3</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architecture Deep Dive & Sprint Kickoff"
                  value={sessionData.title}
                  onChange={(e) =>
                    setSessionData({ ...sessionData, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What this session covers and its expected outcomes..."
                  value={sessionData.description}
                  onChange={(e) =>
                    setSessionData({ ...sessionData, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Scheduled At *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionData.scheduled_at}
                    onChange={(e) =>
                      setSessionData({
                        ...sessionData,
                        scheduled_at: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={sessionData.duration_minutes}
                    onChange={(e) =>
                      setSessionData({
                        ...sessionData,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Virtual Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz"
                  value={sessionData.meeting_url}
                  onChange={(e) =>
                    setSessionData({ ...sessionData, meeting_url: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Preparation, activities, and follow-up actions..."
                  value={sessionData.agenda}
                  onChange={(e) =>
                    setSessionData({ ...sessionData, agenda: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Facilitator
                </label>

                <input
                  type="text"
                  placeholder="Name of the session lead"
                  value={sessionData.facilitator_name}
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      facilitator_name: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Allow joining from
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionData.join_available_from}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, join_available_from: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Allow joining until
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionData.join_available_until}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, join_available_until: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Recording URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://…"
                    value={sessionData.recording_url}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, recording_url: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Visibility status
                  </label>
                  <select
                    value={sessionData.status}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, status: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm capitalize text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="draft">Draft — admin only</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingSession(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingSession && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingSession ? "Save Changes" : "Schedule Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Discover Curriculum Modal */}
      {isDiscoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Generate Discover Curriculum
                  </h2>
                  <p className="text-xs text-slate-500">
                    Creates the standard 4-week, 12-session Discover curriculum.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiscoverModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {curriculumError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{curriculumError}</span>
              </div>
            )}

            {curriculumSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{curriculumSuccess}</span>
              </div>
            )}

            <form onSubmit={handleGenerateCurriculum} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Cohort *
                </label>
                <select
                  required
                  value={curriculumParams.cohort_id}
                  onChange={(e) =>
                    setCurriculumParams({
                      ...curriculumParams,
                      cohort_id: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>
                    Select Cohort
                  </option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    First session date
                  </label>
                  <input
                    type="date"
                    value={curriculumParams.start_date}
                    onChange={(e) =>
                      setCurriculumParams({ ...curriculumParams, start_date: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Session duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={curriculumParams.session_duration_minutes}
                    onChange={(e) =>
                      setCurriculumParams({
                        ...curriculumParams,
                        session_duration_minutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Default meeting URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={curriculumParams.default_meeting_url}
                  onChange={(e) =>
                    setCurriculumParams({
                      ...curriculumParams,
                      default_meeting_url: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  When supplied with a start date, the link opens for participants 15 minutes before each session.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDiscoverModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingCurriculum}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generatingCurriculum && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
