"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Video,
  ListTodo,
  CheckCircle2,
  ExternalLink,
  Loader2,
  BookOpen,
} from "lucide-react";
import { fetchSessions } from "@/lib/api/sessions";
import { fetchAttendance } from "@/lib/api/attendance";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { AttendanceRecord, Session } from "@/types/fellowship";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

export default function StudentSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessionsData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        const sessionsData = await fetchSessions();
        setSessions(sessionsData);

        if (user) {
          try {
            const context = await fetchStudentPortalContext(user.id);
            const attendanceData = await fetchAttendance({ student_id: context.student.profile_id });
            setAttendance(attendanceData);
          } catch (attendanceError) {
            console.warn("Failed to load student attendance", attendanceError);
            setAttendance([]);
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
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Curriculum &amp; Workshops
          </span>
        }
        title="Fellowship Sessions"
        subtitle="12-session curriculum calendar, attendance logs, and live workshop rooms."
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading session calendar…</span>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          headline="No scheduled sessions found"
          description="Your fellowship curriculum schedule will be updated shortly by program staff."
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const att = attendance.find((a) => a.session_id === sess.id);
            const isAttended = att?.status === "present";

            return (
              <SectionCard
                key={sess.id}
                badge={
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant="secondary">
                      Week {sess.week_number}
                    </StatusBadge>
                    {isAttended ? (
                      <StatusBadge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                        Attended
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant={sess.status === "completed" ? "secondary" : "primary"}>
                        {sess.status}
                      </StatusBadge>
                    )}
                  </div>
                }
                headerAction={
                  sess.meeting_url ? (
                    <a
                      href={sess.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gradient-primary !py-1.5 !px-3 !text-xs"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Join Call</span>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
                      <Video className="h-3.5 w-3.5" />
                      <span>Link Pending</span>
                    </span>
                  )
                }
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">{sess.title}</h3>
                  <p className="max-w-2xl text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {sess.description || sess.agenda || "Session details will be shared prior to kickoff."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {sess.scheduled_at
                          ? new Date(sess.scheduled_at).toLocaleString()
                          : "Schedule TBD"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{sess.duration_minutes || 90} mins</span>
                    </div>

                    {sess.facilitator_name && (
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span>Facilitator: {sess.facilitator_name}</span>
                      </div>
                    )}

                    {sess.tasks && sess.tasks.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="h-3.5 w-3.5 text-brand-600" />
                        <span>{sess.tasks.length} task(s)</span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
