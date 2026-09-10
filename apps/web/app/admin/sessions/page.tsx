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
} from "lucide-react";
import {
  fetchSessions,
  createSession,
  generateDiscoverCurriculum,
} from "@/lib/api/sessions";
import { fetchCohorts } from "@/lib/api/cohorts";
import { Cohort, Session } from "@/types/fellowship";

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState("");

  // Create Session Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState({
    cohort_id: "",
    week_number: 1,
    title: "",
    description: "",
    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    duration_minutes: 90,
    meeting_url: "https://meet.google.com/dlif-fellowship",
    status: "scheduled",
  });

  // Discover Curriculum Modal
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [generatingCurriculum, setGeneratingCurriculum] = useState(false);
  const [curriculumSuccess, setCurriculumSuccess] = useState<string | null>(null);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [curriculumParams, setCurriculumParams] = useState({
    cohort_id: "",
    total_weeks: 8,
    start_date: new Date().toISOString().slice(0, 10),
  });

  async function loadData() {
    try {
      setLoading(true);
      const [sessionsData, cohortsData] = await Promise.all([
        fetchSessions({ cohort_id: selectedCohort || undefined }),
        fetchCohorts(),
      ]);
      setSessions(sessionsData);
      setCohorts(cohortsData);
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

  useEffect(() => {
    loadData();
  }, [selectedCohort]);

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionFormError(null);
    setSubmittingSession(true);

    try {
      if (!sessionData.cohort_id) {
        throw new Error("Please select a cohort.");
      }
      await createSession({
        ...sessionData,
        week_number: Number(sessionData.week_number),
        duration_minutes: Number(sessionData.duration_minutes),
      });

      setIsCreateModalOpen(false);
      setSessionData((prev) => ({
        ...prev,
        title: "",
        description: "",
        week_number: prev.week_number + 1,
      }));
      loadData();
    } catch (err: any) {
      setSessionFormError(err.message || "Failed to create session.");
    } finally {
      setSubmittingSession(false);
    }
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
        total_weeks: Number(curriculumParams.total_weeks),
        start_date: curriculumParams.start_date,
      });

      setCurriculumSuccess(
        `Generated ${result.generated_sessions_count} Discover curriculum sessions!`
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
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create Session
          </button>
        </div>
      </div>

      {/* Cohort Filter */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-700">
          Cohort Schedule:
        </label>
        <select
          value={selectedCohort}
          onChange={(e) => setSelectedCohort(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
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
            Generate an 8-week Discover track or schedule standalone workshop sessions.
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
              onClick={() => setIsCreateModalOpen(true)}
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
                      <span>{new Date(sess.scheduled_at).toLocaleString()}</span>
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
                  {sess.meeting_url && (
                    <a
                      href={sess.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Video className="h-3.5 w-3.5 text-emerald-600" />
                      Join Call
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Schedule Workshop Session
                </h2>
                <p className="text-xs text-slate-500">
                  Plan a live fellowship sync, lecture, or review session.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
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

            <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Cohort *
                  </label>
                  <select
                    required
                    value={sessionData.cohort_id}
                    onChange={(e) =>
                      setSessionData({ ...sessionData, cohort_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Week # *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    required
                    value={sessionData.week_number}
                    onChange={(e) =>
                      setSessionData({
                        ...sessionData,
                        week_number: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
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
                  Description / Agenda *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Key topics, preparation materials, and expected outcomes..."
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

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Discover Curriculum Modal */}
      {isDiscoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
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
                    Populates standard multi-week fellowship modules.
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
                    Total Weeks
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={24}
                    value={curriculumParams.total_weeks}
                    onChange={(e) =>
                      setCurriculumParams({
                        ...curriculumParams,
                        total_weeks: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={curriculumParams.start_date}
                    onChange={(e) =>
                      setCurriculumParams({
                        ...curriculumParams,
                        start_date: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
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
