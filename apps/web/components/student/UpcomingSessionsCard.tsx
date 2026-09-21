"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Video, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { StudentDashboardSession } from "@/types/student_dashboard";

interface Props {
  sessions: StudentDashboardSession[];
}

/** Format an ISO date string in IST (Asia/Kolkata) */
function formatLocalDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

export function UpcomingSessionsCard({ sessions }: Props) {
  // Countdown to next session
  const nextSession = sessions.find(
    (session) =>
      session.scheduled_at &&
      new Date(session.scheduled_at).getTime() > Date.now()
  );
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const scheduledAt = nextSession?.scheduled_at;

    if (!scheduledAt) {
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      return;
    }

    const target = new Date(scheduledAt).getTime();

    function calculateTime() {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (diff / (1000 * 60 * 60)) % 24
        ),
        minutes: Math.floor(
          (diff / (1000 * 60)) % 60
        ),
        seconds: Math.floor(
          (diff / 1000) % 60
        ),
      });
    }

    calculateTime();

    const interval = setInterval(
      calculateTime,
      1000
    );

    return () => clearInterval(interval);
  }, [nextSession?.scheduled_at]);
  return (
    <div className="card-custom flex flex-col justify-between h-full space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-base">Upcoming Sessions</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live &amp; Working
          </span>
        </div>

        {/* Real-time Countdown Banner */}
        {nextSession && (
          <div
            className="relative mt-4 p-3 rounded-xl text-white flex items-center justify-between shadow-xs overflow-hidden"
            style={{ background: "linear-gradient(135deg, #241348, #5b21b6 60%, #9333ea)" }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(240,101,61,0.35), transparent 70%)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-violet-300 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Next Session Countdown
                </p>
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">
                  Session {nextSession.session_number}: {nextSession.title}
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-1.5 font-mono font-bold text-xs">
              <div className="px-1.5 py-1 rounded bg-white/10 text-center min-w-[28px]">
                <span>{timeLeft.days}</span>
                <span className="text-[8px] block font-sans text-violet-300">d</span>
              </div>
              <span>:</span>
              <div className="px-1.5 py-1 rounded bg-white/10 text-center min-w-[28px]">
                <span>{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="text-[8px] block font-sans text-violet-300">h</span>
              </div>
              <span>:</span>
              <div className="px-1.5 py-1 rounded bg-white/10 text-center min-w-[28px]">
                <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="text-[8px] block font-sans text-violet-300">m</span>
              </div>
              <span>:</span>
              <div className="px-1.5 py-1 rounded bg-white/10 text-center min-w-[28px] text-[#f0653d]">
                <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="text-[8px] block font-sans text-violet-300">s</span>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="divide-y divide-slate-100 mt-2">
          {sessions.length > 0 ? (
            sessions.map((s) => {
              const isGate = s.session_type === "output_review_gate";
              return (
                <div key={s.session_number} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isGate
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : s.session_type === "mentor_session"
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : s.session_type === "output_review"
                            ? "bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300"
                            : "bg-violet-100 text-violet-900 border border-violet-200"
                        }`}
                    >
                      {isGate && <ShieldAlert className="h-3 w-3" />}
                      Session {s.session_number} &bull; {s.type_label}
                    </span>

                    {(s.scheduled_at || s.formatted_date) && (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {s.scheduled_at ? formatLocalDate(s.scheduled_at) : s.formatted_date}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{s.focus}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      Duration: {s.duration_minutes || 90} mins
                    </span>
                    {s.meeting_link ? (
                      <a
                        href={s.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gradient-primary !py-1.5 !px-3 !text-xs"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Join Room</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-400 cursor-not-allowed">
                        <Video className="h-3.5 w-3.5" />
                        <span>Link Soon</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-600">
                No upcoming sessions scheduled yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Sessions will appear here once they are scheduled by the program team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-slate-100 text-center">
        <Link
          href="/student/sessions"
          className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 hover:underline"
        >
          <span>View Complete 12-Session Schedule</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
