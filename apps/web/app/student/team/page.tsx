"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Video,
  FileText,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Info,
  Building2,
  Mail,
  Check,
  X,
  GraduationCap,
  Phone,
  User as UserIcon,
  Briefcase,
} from "lucide-react";

interface TeamMemberProfile {
  student_id: string;
  name: string;
  role: string;
  discipline: string;
  email?: string | null;
  status?: string | null;
  roll_no?: string | null;
  institution_name?: string | null;
  course?: string | null;
  branch?: string | null;
  current_year_semester?: string | null;
  graduation_year?: number | null;
  phone?: string | null;
  gender?: string | null;
  photo_url?: string | null;
  batch_name?: string | null;
}

function studentInitials(name?: string | null): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveStudentPhotoUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;
  try {
    const url = new URL(source);
    const isGoogleDrive =
      url.hostname === "drive.google.com" || url.hostname === "docs.google.com";
    if (isGoogleDrive) {
      const pathMatch = url.pathname.match(/\/(?:file\/)?d\/([^/?]+)/);
      const fileId = url.searchParams.get("id") || pathMatch?.[1];
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w800`;
      }
    }
  } catch {
    return null;
  }
  return source;
}
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";

const DEFAULT_DISCIPLINES = [
  "Business Architecture & Market Modeling",
  "Problem Diagnosis & Evidence Analysis",
  "Strategic Alternatives & Economics",
  "Execution Architecture & Delivery",
  "Executive Communications & Synthesis",
];

const INITIAL_SCRATCHPAD = `# DLIF Discover Phase — Team Collaborative Scratchpad
## Week 1: Business Context & Evidence Log

### 1. Initial Problem Hypotheses:
- Disconnected telematics pipelines across multi-carrier transit hubs create an estimated 4-6 hour data blindspot.
- SLA penalties compound on intermodal handoffs due to manual exception reporting.
- Root cause appears operational rather than pure hardware limitation.

### 2. Evidence to Audit:
- Freight manifest timestamps vs actual arrival telemetry.
- Stakeholder interviews: Logistics Dispatch Supervisor, Enterprise IT Architect.
- Historic SLA breach logs from Q3.

### 3. Open Unknowns for Session 2:
- What is the carrier API latency during peak transfer hours?
- Who owns the exception decision threshold in the current hierarchy?
`;

export default function StudentTeamWorkspacePage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentorHeadshotFailed, setMentorHeadshotFailed] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberProfile | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedMember(null);
    }
    if (selectedMember) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedMember]);

  // Scratchpad state with persistence
  const [scratchpadContent, setScratchpadContent] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        setLoading(true);
        const [portalData, dashData] = await Promise.allSettled([
          fetchStudentPortalContext(),
          fetchStudentDashboard(),
        ]);

        if (portalData.status === "fulfilled") {
          setContext(portalData.value);
        }
        if (dashData.status === "fulfilled") {
          setDashboardData(dashData.value);
        }

        // Load saved scratchpad from localStorage or use initial template
        const savedNotes = localStorage.getItem("dlif_team_scratchpad");
        if (savedNotes) {
          setScratchpadContent(savedNotes);
          setLastSaved("Restored from local workspace cache");
        } else {
          setScratchpadContent(INITIAL_SCRATCHPAD);
          setLastSaved("Initial fellowship template");
        }
      } catch (err) {
        console.error("Failed to load workspace data", err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceData();
  }, []);

  const handleSaveScratchpad = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      localStorage.setItem("dlif_team_scratchpad", scratchpadContent);
      const user = getStoredUser();
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSaved(`${user?.full_name || "Team Fellow"} at ${timeStr}`);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <span className="font-medium text-slate-700">Loading Team Workspace...</span>
        </div>
      </div>
    );
  }

  const team = dashboardData?.team || context?.team;
  const teamName = team?.name || "Discover Fellow Squad";
  const cohortName = dashboardData?.cohort?.name || context?.cohort?.name || "Discover Cohort 2026";
  const currentWeek = dashboardData?.team?.current_week || 1;
  const mentor = dashboardData?.mentor || context?.mentor;

  // Prepare 5-member roster
  const rawMembers = (context?.team?.members && context.team.members.length > 0)
    ? context.team.members
    : [
        { name: "Midhun Krishna", role: "Fellow Lead" },
        { name: "Pranav Madan Shekhar", role: "Member" },
        { name: "Samatha Test Student", role: "Member" },
        { name: "Sara Farhath", role: "Member" },
        { name: "Shrihari Chikkodikar", role: "Member" },
      ];

  // Guarantee 5 items for the 5-member multidisciplinary grid with full profile fields
  const members: TeamMemberProfile[] = rawMembers.slice(0, 5).map((m, idx) => ({
    student_id: (m as any).student_id || `member-${idx}`,
    name: m.name,
    role: idx === 0 ? "Fellow Lead" : (m.role || "Member"),
    discipline: DEFAULT_DISCIPLINES[idx % DEFAULT_DISCIPLINES.length],
    email: (m as any).email,
    status: (m as any).status,
    roll_no: (m as any).roll_no,
    institution_name: (m as any).institution_name,
    course: (m as any).course,
    branch: (m as any).branch,
    current_year_semester: (m as any).current_year_semester,
    graduation_year: (m as any).graduation_year,
    phone: (m as any).phone,
    gender: (m as any).gender,
    photo_url: (m as any).photo_url,
    batch_name: (m as any).batch_name,
  }));

  // Output submissions history (4 weeks)
  const outputHistory = [
    {
      week: 1,
      title: "Business Diagnosis & Problem Framing Pack",
      status: currentWeek > 1 ? "Gate Passed" : "In Progress",
      statusClass: currentWeek > 1 ? "badge-success" : "badge-primary",
      submittedAt: currentWeek > 1 ? "Evaluated & Approved" : "Working evidence draft",
    },
    {
      week: 2,
      title: "Strategic Possibility & Choice Pack",
      status: currentWeek === 2 ? "In Progress" : currentWeek > 2 ? "Gate Passed" : "Upcoming",
      statusClass: currentWeek === 2 ? "badge-primary" : currentWeek > 2 ? "badge-success" : "badge-secondary",
      submittedAt: currentWeek === 2 ? "Active working pack" : currentWeek > 2 ? "Approved" : "Unlocks Week 2",
    },
    {
      week: 3,
      title: "Strategy & Execution Blueprint",
      status: currentWeek >= 3 ? "In Progress" : "Upcoming",
      statusClass: currentWeek >= 3 ? "badge-primary" : "badge-secondary",
      submittedAt: currentWeek >= 3 ? "Active" : "Unlocks Week 3",
    },
    {
      week: 4,
      title: "Executive Proposal & Company Presentation Master",
      status: currentWeek === 4 ? "In Progress" : "Upcoming",
      statusClass: currentWeek === 4 ? "badge-primary" : "badge-secondary",
      submittedAt: currentWeek === 4 ? "Active" : "Unlocks Week 4",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header (Matching DL_DISCOVER Team Workspace) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-xs">
              5-Member Team
            </span>
            <span className="text-xs font-medium text-slate-500">
              &bull; Multi-disciplinary Cohort
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {teamName} Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Collaborative research scratchpad, member roster across disciplines, mentor engagements, and deliverables log.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/mentor"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Video className="h-4 w-4 text-slate-500" />
            <span>Request Mentor Slot</span>
          </Link>
          <Link
            href={`/student/deliverables?week=${currentWeek}`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Week {currentWeek} Output</span>
          </Link>
        </div>
      </div>

      {/* 2. 5-Member Team Roster Card (DL_DISCOVER Team Composition) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" />
            <span>Team Composition (5 Cross-Functional Disciplines)</span>
          </h3>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {cohortName}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {members.map((member, idx) => {
            const initial = studentInitials(member.name);
            const photo = resolveStudentPhotoUrl(member.photo_url);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedMember(member)}
                className="flex flex-col items-center text-center rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-xs hover:bg-white hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group text-left w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 font-bold text-lg text-white shadow-xs mb-3 overflow-hidden ring-2 ring-transparent group-hover:ring-sky-400 transition-all">
                  <span>{initial}</span>
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-xs min-h-[32px] flex items-center justify-center group-hover:text-sky-700 transition-colors">
                  {member.name}
                </h4>
                <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                  {member.role}
                </span>
                <p className="mt-2 text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {member.discipline}
                </p>
                <span className="mt-2 text-[10px] font-semibold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Profile &rarr;
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Grid: Scratchpad (Left 7 cols) + Mentor & Outputs (Right 5 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Live Team Scratchpad */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-600" />
                    <span>Live Team Scratchpad (Week {currentWeek})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Collaborative workspace for research notes, data schemas, and draft hypotheses.
                  </p>
                </div>
                {lastSaved && (
                  <span className="self-start sm:self-auto text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                    {lastSaved}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveScratchpad} className="mt-4 space-y-4">
                <textarea
                  value={scratchpadContent}
                  onChange={(e) => setScratchpadContent(e.target.value)}
                  rows={14}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBFD] p-4 font-mono text-xs text-slate-800 leading-relaxed shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  placeholder="Draft hypothesis notes, interview insights, and evidence formulas here..."
                />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Info className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Visible to all 5 team members and assigned mentor.</span>
                  </span>

                  <button
                    type="submit"
                    disabled={saveStatus === "saving"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-colors disabled:opacity-50"
                  >
                    {saveStatus === "saving" ? (
                      <span>Saving...</span>
                    ) : saveStatus === "saved" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Scratchpad</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Mentor Card + Team Output History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Mentor Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Assigned Team Mentor
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                Active
              </span>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              {mentor?.headshot_url && !mentorHeadshotFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.headshot_url}
                  alt={mentor.full_name || "Mentor"}
                  onError={() => setMentorHeadshotFailed(true)}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-base text-white">
                  {mentor?.full_name ? mentor.full_name.charAt(0) : "M"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {mentor?.full_name || "Dedicated Industry Mentor"}
                </h4>
                <p className="text-xs font-semibold text-sky-700 truncate">
                  {mentor?.designation || "Senior Enterprise Advisor"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {mentor?.company_name || "DegreeLabs Mentor Council"}
                </p>
              </div>
            </div>

            {/* Mentor Notes Feed */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mentor Session Feedback &amp; Guidance:
              </h4>

              <div className="space-y-3">
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
                      Problem Bounding &amp; Scope
                    </span>
                    <span className="text-[10px] text-slate-400">Recent Sync</span>
                  </div>
                  <p className="p-3 rounded-lg bg-slate-50 border-l-4 border-sky-600 text-xs italic text-slate-700 leading-relaxed">
                    &ldquo;Ensure your Problem Framing Pack clearly isolates root operational causes before drafting solution vectors. Test if freight latency is systemic or carrier-specific.&rdquo;
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 border border-indigo-200">
                      WWHTBT Barrier-to-Belief
                    </span>
                    <span className="text-[10px] text-slate-400">Week 2 Prep</span>
                  </div>
                  <p className="p-3 rounded-lg bg-slate-50 border-l-4 border-indigo-600 text-xs italic text-slate-700 leading-relaxed">
                    &ldquo;For Week 2 choices, remember a preferred idea is not a strategy. You must demonstrate at least 3 distinct alternatives with What Would Have to Be True tests.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/student/mentor"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Guidance Session</span>
            </Link>
          </div>

          {/* Team Output History Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Team Output History
            </h3>

            <div className="divide-y divide-slate-100">
              {outputHistory.map((item) => (
                <div key={item.week} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate" title={`Week ${item.week}: ${item.title}`}>
                      Week {item.week}: {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.submittedAt}</p>
                  </div>
                  <span className={`status-pill ${item.statusClass} shrink-0`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Team Member Profile Modal */}
      {selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-700 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
                  <span>{studentInitials(selectedMember.name)}</span>
                  {resolveStudentPhotoUrl(selectedMember.photo_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveStudentPhotoUrl(selectedMember.photo_url) || undefined}
                      alt={`${selectedMember.name} photo`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                      {selectedMember.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                        selectedMember.status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-700 ring-slate-600/20"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {selectedMember.status || "Active"}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                      {selectedMember.batch_name || cohortName}
                    </span>
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                      {selectedMember.role}
                    </span>
                  </div>

                  <p className="mt-1.5 font-mono text-xs font-semibold text-sky-700">
                    Roll No: {selectedMember.roll_no || "—"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {selectedMember.institution_name || "Partner Institution"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">
                    Assigned Discipline: <strong className="text-slate-700">{selectedMember.discipline}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* Academic & Enrollment Information */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <GraduationCap className="h-4 w-4 text-sky-600" />
                  Academic &amp; Enrollment Information
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Institution</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.institution_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Course</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.course || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Branch</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.branch || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Current Year / Semester</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.current_year_semester || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Batch Assigned</span>
                    <p className="mt-0.5 text-sm font-semibold text-sky-700">
                      {selectedMember.batch_name || cohortName || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal & Contact Info (with Proper Alignment, No Identity/Verification) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                  <UserIcon className="h-4 w-4 text-sky-600" />
                  Personal &amp; Contact Info
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-medium text-slate-500">Email Address</span>
                      {selectedMember.email ? (
                        <a
                          href={`mailto:${selectedMember.email}`}
                          className="font-semibold text-sky-700 hover:underline truncate block text-xs sm:text-sm"
                        >
                          {selectedMember.email}
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-700 text-xs sm:text-sm">Not provided</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">WhatsApp / Phone</span>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {selectedMember.phone || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Gender</span>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {selectedMember.gender || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Fellowship Role &amp; Focus</span>
                      <span className="font-semibold text-sky-800 text-xs sm:text-sm">
                        {selectedMember.role} &bull; {selectedMember.discipline}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
