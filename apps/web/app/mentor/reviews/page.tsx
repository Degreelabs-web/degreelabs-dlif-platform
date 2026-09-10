"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { FileText, CheckCircle, MessageSquare, ExternalLink } from "lucide-react";

interface SubmissionItem {
  id: string;
  team_id: string;
  challenge_id?: string | null;
  status: string;
  submitted_at: string;
}

export default function MentorReviewsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rubricScore, setRubricScore] = useState(85);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await apiClient<SubmissionItem[]>("/submissions");
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    try {
      await apiClient(`/feedback`, {
        method: "POST",
        body: JSON.stringify({
          submission_id: selectedSub.id,
          comments: feedback,
          score: rubricScore,
        }),
      });
      alert("Evaluation and feedback submitted successfully!");
      setSelectedSub(null);
      setFeedback("");
      loadSubmissions();
    } catch (err) {
      alert("Failed to submit feedback: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Submission Reviews & Rubric Scoring
        </h1>
        <p className="text-sm text-slate-600">
          Evaluate project deliverables and provide constructive mentorship feedback.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No submissions in queue</h3>
          <p className="mt-1 text-xs text-slate-500">Student submissions will appear here for grading and feedback.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={`cursor-pointer rounded-xl border p-4 transition bg-white shadow-sm hover:border-slate-400 ${
                  selectedSub?.id === sub.id ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs">
                      SUB
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Submission ID: {sub.id.slice(0, 8)}...
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      sub.status === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Form / Drawer */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mentor Feedback & Evaluation
            </h2>

            {selectedSub ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Reviewing Submission</p>
                  <p className="font-mono text-xs font-bold text-slate-900">{selectedSub.id}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Rubric Score (0 - 100): <strong className="text-slate-900">{rubricScore}</strong>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={rubricScore}
                    onChange={(e) => setRubricScore(Number(e.target.value))}
                    className="mt-2 w-full accent-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Constructive Feedback & Notes
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide actionable guidance on architecture, code quality, presentation..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-500">
                Select a submission from the queue on the left to grade and provide mentor notes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
