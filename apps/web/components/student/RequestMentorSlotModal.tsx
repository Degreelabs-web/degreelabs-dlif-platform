"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Video,
  CheckCircle2,
} from "lucide-react";
import { requestMentorSlot, MentorSlotRequest } from "@/lib/api/mentor_slots";

interface RequestMentorSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess: (newRequest: MentorSlotRequest) => void;
}

export function RequestMentorSlotModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSuccess,
}: RequestMentorSlotModalProps) {
  // Default preferred date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [preferredDate, setPreferredDate] = useState(defaultDateStr);
  const [preferredTimeStart, setPreferredTimeStart] = useState("14:00");
  const [preferredTimeEnd, setPreferredTimeEnd] = useState("15:00");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!preferredDate) {
      setError("Please choose a preferred date.");
      return;
    }
    if (!preferredTimeStart || !preferredTimeEnd) {
      setError("Please select a valid time window.");
      return;
    }
    if (preferredTimeStart >= preferredTimeEnd) {
      setError("End time must be later than start time.");
      return;
    }
    if (topic.trim().length < 10) {
      setError("Please describe the consultation topic/agenda (at least 10 characters).");
      return;
    }

    try {
      setLoading(true);
      // format times as HH:MM:00
      const startFormatted = preferredTimeStart.length === 5 ? `${preferredTimeStart}:00` : preferredTimeStart;
      const endFormatted = preferredTimeEnd.length === 5 ? `${preferredTimeEnd}:00` : preferredTimeEnd;

      const created = await requestMentorSlot(teamId, {
        preferred_date: preferredDate,
        preferred_time_start: startFormatted,
        preferred_time_end: endFormatted,
        topic: topic.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess(created);
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err: any) {
      const detail = err?.data?.detail || err?.message || "Failed to submit mentor slot request.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                Lead Exclusive
              </span>
              <span className="text-xs text-slate-500">{teamName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Request Mentor Slot
            </h2>
            <p className="text-xs text-slate-500">
              Submit an advisory consultation request for your team. The DLIF admin will assign an industry mentor and provide a Google Meet link.
            </p>
          </div>
        </div>

        {/* Body Form */}
        {success ? (
          <div className="py-10 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Request Submitted!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your request has been dispatched to the DLIF Admin Team. You will receive an email confirmation once scheduled.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Preferred Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                <span>Preferred Date</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Preferred Time Window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-600" />
                  <span>Start Window</span>
                </label>
                <input
                  type="time"
                  value={preferredTimeStart}
                  onChange={(e) => setPreferredTimeStart(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>End Window</span>
                </label>
                <input
                  type="time"
                  value={preferredTimeEnd}
                  onChange={(e) => setPreferredTimeEnd(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {/* Topic & Agenda */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
                <span>Consultation Topic &amp; Focus Questions</span>
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., We need guidance on validating our supply chain root cause analysis and framing strategic choices for Week 2 deliverables..."
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Be specific so the program administrator can match an appropriately specialized mentor.
              </p>
            </div>

            {/* Info notice */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Team Calendar Integration:</span> Once approved, the meeting link and calendar invite will be automatically dispatched to all 5 team members.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Submit Slot Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
