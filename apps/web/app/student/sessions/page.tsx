"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Video,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  BookOpen,
} from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchSessions } from "@/lib/api/sessions";
import { fetchAttendance } from "@/lib/api/attendance";
import { AttendanceRecord, Session, StudentPortalContext } from "@/types/fellowship";

export default function StudentSessionsPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessionsData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        if (user) {
          const ctx = await fetchStudentPortalContext(user.id);
          setContext(ctx);

          if (ctx.cohort?.id) {
            const [sessionsData, attendanceData] = await Promise.all([
              fetchSessions({ cohort_id: ctx.cohort.id }),
              fetchAttendance({ student_id: ctx.student.profile_id }),
            ]);
            setSessions(sessionsData);
            setAttendance(attendanceData);
          } else {
            // fallback: fetch all sessions
            const sessionsData = await fetchSessions();
            setSessions(sessionsData);
          }
        }
      } catch (err) {
        console.error("Failed to load student sessions", err);
      } finally {
        setLoading(false);
      }
    }

    loadSessionsData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Curriculum & Workshops
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Fellowship Sessions
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Weekly live architectural deep dives, mentorship touchpoints, and sprint tasks.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading session calendar...</span>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No scheduled sessions found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Your cohort curriculum schedule will be updated shortly by fellowship staff.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const att = attendance.find((a) => a.session_id === sess.id);
            const isAttended = att?.status === "present";

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

                    {isAttended ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle2 className="h-3 w-3" /> Attended
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                        {sess.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {sess.title}
                  </h3>

                  <p className="max-w-2xl text-xs text-slate-600 leading-relaxed">
                    {sess.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(sess.scheduled_at).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
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
                  {sess.meeting_url ? (
                    <a
                      href={sess.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                      Join Video Call
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </a>
                  ) : (
                    <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
                      Link pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
