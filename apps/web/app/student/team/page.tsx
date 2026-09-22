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
  Info,
  Mail,
  Check,
  X,
  GraduationCap,
  Phone,
  User as UserIcon,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RequestMentorSlotModal } from "@/components/student/RequestMentorSlotModal";
import {
  fetchTeamMentorSlots,
  updateMentorSlot,
  cancelMentorSlot,
  MentorSlotRequest,
} from "@/lib/api/mentor_slots";
import { getStoredUser } from "@/lib/api/auth";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";
import { StudentDashboardData } from "@/types/student_dashboard";
import { PageHeader, StatusBadge } from "@/components/student/ui";

interface TeamMemberProfile {
  student_id: string;
  name: string;
  role: string;
  is_team_lead?: boolean;
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
  if (source.startsWith("/") || source.startsWith("data:")) return source;
  try {
    const url = new URL(source);
    const isGoogleDrive =
      url.hostname === "drive.google.com" || url.hostname === "docs.google.com";
    if (isGoogleDrive) {
      const pathMatch = url.pathname.match(/\/(?:file\/)?d\/([^/?]+)/);
      const fileId = url.searchParams.get("id") || pathMatch?.[1];
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
      }
    }
  } catch {
    return source;
  }
  return source;
}

function getLocalStudentFallback(rollNo?: string | null, name?: string | null): string | null {
  const normRoll = (rollNo || "").trim();
  const normName = (name || "").toLowerCase();
  if (normRoll === "DL-IF/2026/001" || normName.includes("shrihari")) {
    return "/students/DL-IF_2026_001_Photo.jpeg";
  }
  if (normRoll === "DL-IF/2026/009" || normName.includes("sreehari")) {
    return "/students/DL-IF_2026_009_Photo.png";
  }
  if (normRoll === "DL-IF/2026/019" || normName.includes("midhun")) {
    return "/students/DL-IF_2026_019_Photo.jpeg";
  }
  if (normRoll === "DL-IF/2026/028" || normName.includes("sara")) {
    return "/students/DL-IF_2026_028_Photo.png";
  }
  if (normRoll === "DL-IF/2026/032" || normName.includes("pranav")) {
    return "/students/DL-IF_2026_032_Photo.jpeg";
  }
  if (normName.includes("samatha") || normRoll.toLowerCase().includes("test")) {
    return "/students/samatha_photo.jpeg";
  }
  return null;
}

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

function isTeamLeadRole(role?: string, isTeamLead?: boolean): boolean {
  if (isTeamLead === true) return true;
  const r = (role || "").toLowerCase().trim();
  return r === "fellow lead" || r === "lead" || r === "team_lead" || r === "leader";
}

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400";

export default function StudentTeamWorkspacePage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentorHeadshotFailed, setMentorHeadshotFailed] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberProfile | null>(null);
  const [mentorSlotModalOpen, setMentorSlotModalOpen] = useState(false);
  const [existingSlotRequest, setExistingSlotRequest] = useState<MentorSlotRequest | null>(null);
  const [editSlotOpen, setEditSlotOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [slotActionLoading, setSlotActionLoading] = useState(false);
  const [slotActionError, setSlotActionError] = useState<string | null>(null);

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

  // Fetch existing mentor slot requests for this team (once team id is known)
  useEffect(() => {
    const teamId = (dashboardData?.team as any)?.id || (context?.team as any)?.id;
    if (!teamId) return;
    fetchTeamMentorSlots(teamId)
      .then((slots) => {
        if (slots && slots.length > 0) {
          // Surface the most recent request (first in list)
          setExistingSlotRequest(slots[0]);
        }
      })
      .catch(() => {
        // Silently ignore; this is non-critical
      });
  }, [dashboardData, context]);

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
      <div className="card-custom flex min-h-[280px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="font-medium text-slate-700">Loading Team Workspace...</span>
        </div>
      </div>
    );
  }

  const team = dashboardData?.team || context?.team;
  if (!team) {
    return (
      <div className="page-container">
        <div className="card-custom flex min-h-[320px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Users className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Team assignment pending
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            You have not been assigned to a fellowship team yet.
            Your team workspace will appear here once the administrator
            assigns you to a team.
          </p>
        </div>
      </div>
    );
  }
  const teamName = team.name;
  const cohortName = dashboardData?.cohort?.name || context?.cohort?.name || "Discover Cohort 2026";
  const currentWeek = dashboardData?.team?.current_week || 1;
  const mentor = dashboardData?.mentor || context?.mentor;

  // Prepare 5-member roster
  const rawMembers =
    context?.team?.members?.length
      ? context.team.members
      : dashboardData?.team?.members ?? [];

  // Guarantee 5 items for the 5-member multidisciplinary grid with full profile fields
  const members: TeamMemberProfile[] = rawMembers.slice(0, 5).map((m, idx) => ({
    student_id: (m as any).student_id || `member-${idx}`,
    name: m.name,
    role: (m as any).role || "Member",
    is_team_lead: (m as any).is_team_lead,
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

  // Determine if the current user is the team lead
  // Match by email (always present in both stored session and team member data)
  const storedUser = getStoredUser();
  const currentEmail = storedUser?.email?.toLowerCase();
  const currentUserMember = currentEmail
    ? members.find((m) => m.email?.toLowerCase() === currentEmail)
    : undefined;
  const isCurrentUserTeamLead = currentUserMember
    ? isTeamLeadRole(currentUserMember.role, currentUserMember.is_team_lead)
    : false;

  const teamId = (dashboardData?.team as any)?.id || (context?.team as any)?.id || "";

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
    <div className="page-container">
      {/* Mentor Slot Request Status Banner */}
      {existingSlotRequest && (
        <div
          className={`flex items-start gap-3.5 rounded-2xl px-5 py-4 text-sm ring-1 ${existingSlotRequest.status === "approved"
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : existingSlotRequest.status === "declined"
              ? "bg-red-50 text-red-800 ring-red-200"
              : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-xs ring-1 ring-black/5">
            {existingSlotRequest.status === "approved" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : existingSlotRequest.status === "declined" ? (
              <X className="h-5 w-5 text-red-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {existingSlotRequest.status === "approved"
                ? "Mentor Slot Approved!"
                : existingSlotRequest.status === "declined"
                  ? "Mentor Slot Request Declined"
                  : "Mentor Slot Request Pending Review"}
            </p>
            <p className="mt-0.5 text-xs opacity-80">
              {existingSlotRequest.status === "approved" && existingSlotRequest.meet_link ? (
                <>
                  Scheduled for{" "}
                  <strong>{existingSlotRequest.confirmed_start_time?.slice(0, 16).replace("T", " ")}</strong>.
                  {" "}Your Google Meet link is available on the{" "}
                  <Link href="/student" className="underline font-semibold">Student Dashboard</Link>.
                </>
              ) : existingSlotRequest.status === "declined" ? (
                existingSlotRequest.admin_note || "Admin has declined the request. You may submit a new request."
              ) : (
                `Request submitted on ${existingSlotRequest.created_at?.slice(0, 10) || "—"
                }. The DLIF admin will respond shortly.`
              )}
            </p>
          </div>
          {existingSlotRequest.status === "pending" && isCurrentUserTeamLead && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => { setSlotActionError(null); setEditSlotOpen(true); }}
                className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs ring-1 ring-amber-300 transition-colors hover:bg-amber-100"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { setSlotActionError(null); setCancelConfirmOpen(true); }}
                className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-red-700 shadow-xs ring-1 ring-red-300 transition-colors hover:bg-red-50"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. Page Header (Matching DL_DISCOVER Team Workspace) */}
      <PageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
              5-Member Team
            </span>
            <span className="text-xs font-medium text-slate-500">
              &bull; Multi-disciplinary Cohort
            </span>
          </div>
        }
        title={`${teamName} Workspace`}
        subtitle="Collaborative research scratchpad, member roster across disciplines, mentor engagements, and deliverables log."
        action={
          <div className="flex items-center gap-3">
            {isCurrentUserTeamLead ? (
              <button
                type="button"
                onClick={() => setMentorSlotModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3.5 py-2.5 text-xs font-semibold text-brand-700 shadow-xs ring-1 ring-brand-200 transition-colors hover:bg-brand-100 sm:text-sm"
                title="Request a mentor consultation slot for your team"
              >
                <Video className="h-4 w-4 text-brand-600" />
                <span>Request Mentor Slot</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-400 shadow-xs ring-1 ring-slate-200 sm:text-sm"
                title="Only the Team Lead can request a mentor slot"
              >
                <Video className="h-4 w-4 text-slate-300" />
                <span>Request Mentor Slot</span>
              </button>
            )}
            <Link
              href={`/student/deliverables?week=${currentWeek}`}
              className="btn-gradient-primary !py-2.5 !px-4 !text-xs sm:!text-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Week {currentWeek} Output</span>
            </Link>
          </div>
        }
      />

      {/* 2. 5-Member Team Roster Card (DL_DISCOVER Team Composition) */}
      <div className="card-custom !p-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-brand-800 via-brand-600 to-fuchsia-500" />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="card-title flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Users className="h-[18px] w-[18px]" />
              </span>
              <span>Team Composition (5 Cross-Functional Disciplines)</span>
            </h3>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              {cohortName}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {members.map((member, idx) => {
              const initial = studentInitials(member.name);
              const fallbackPhoto = getLocalStudentFallback(member.roll_no, member.name);
              const photo = resolveStudentPhotoUrl(member.photo_url) || fallbackPhoto;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="group flex w-full cursor-pointer flex-col items-center rounded-2xl bg-slate-50/70 p-5 text-center shadow-xs ring-1 ring-slate-200/80 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:ring-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <div className="relative mb-3.5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-fuchsia-600 text-xl font-bold text-white shadow-md ring-4 ring-white transition-all group-hover:ring-brand-200">
                    <span>{initial}</span>
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={member.name}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const current = e.currentTarget.src;
                          if (fallbackPhoto && !current.includes(fallbackPhoto)) {
                            e.currentTarget.src = fallbackPhoto;
                            return;
                          }
                          if (current.includes("lh3.googleusercontent.com/d/")) {
                            const fileId = current.split("/d/")[1]?.split(/[?=&]/)[0];
                            if (fileId) {
                              e.currentTarget.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                              return;
                            }
                          } else if (current.includes("drive.google.com/thumbnail")) {
                            const fileId = new URL(current).searchParams.get("id");
                            if (fileId) {
                              e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                              return;
                            }
                          }
                          e.currentTarget.style.display = "none";
                        }}
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    )}
                  </div>
                  <h4 className="flex min-h-[40px] items-center justify-center text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-700">
                    {member.name}
                  </h4>
                  <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200">
                    {member.role}
                  </span>
                  <p className="mt-3 line-clamp-2 text-[11px] leading-snug text-slate-500">
                    {member.discipline}
                  </p>
                  <span className="mt-2 text-[10px] font-semibold text-brand-600 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    View Profile &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Scratchpad (Left 7 cols) + Mentor & Outputs (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Live Team Scratchpad */}
        <div className="min-w-0 lg:col-span-7">
          <div className="card-custom flex h-full flex-col">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <FileText className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="card-title">Live Team Scratchpad (Week {currentWeek})</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Collaborative workspace for research notes, data schemas, and draft hypotheses.
                  </p>
                </div>
              </div>
              {lastSaved && (
                <span className="self-start rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200 sm:self-auto">
                  {lastSaved}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveScratchpad} className="mt-4 flex flex-1 flex-col gap-4">
              <textarea
                value={scratchpadContent}
                onChange={(e) => setScratchpadContent(e.target.value)}
                rows={14}
                className="min-h-[320px] w-full flex-1 resize-y rounded-2xl border border-slate-200 bg-slate-50/80 p-5 font-mono text-xs leading-relaxed text-slate-800 shadow-inner"
                placeholder="Draft hypothesis notes, interview insights, and evidence formulas here..."
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Info className="h-4 w-4 shrink-0 text-brand-600" />
                  <span>Visible to all 5 team members and assigned mentor.</span>
                </span>

                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="btn-gradient-primary !py-2 !px-4 !text-xs justify-center disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Right Column: Assigned Mentor Card + Team Output History */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          {/* Assigned Mentor Card */}
          <div className="card-custom space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="card-title">Assigned Team Mentor</h3>
              <StatusBadge variant="success">Active</StatusBadge>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70">
              {mentor?.headshot_url && !mentorHeadshotFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.headshot_url}
                  alt={mentor.full_name || "Mentor"}
                  onError={() => setMentorHeadshotFailed(true)}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover object-center shadow-xs ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-lg font-bold text-white shadow-md shadow-brand-600/20">
                  {mentor?.full_name ? mentor.full_name.charAt(0) : "M"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-slate-900">
                  {mentor?.full_name || "Dedicated Industry Mentor"}
                </h4>
                <p className="truncate text-xs font-semibold text-brand-700">
                  {mentor?.designation || "Senior Enterprise Advisor"}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {mentor?.company_name || "DegreeLabs Mentor Council"}
                </p>
              </div>
            </div>

            {/* Mentor Notes Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Mentor Session Feedback &amp; Guidance:
              </h4>

              <div className="space-y-4">
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200">
                      Problem Bounding &amp; Scope
                    </span>
                    <span className="text-[10px] text-slate-400">Recent Sync</span>
                  </div>
                  <p className="rounded-xl border-l-4 !border-l-brand-600 bg-gradient-to-r from-violet-50/70 to-slate-50 p-3.5 text-xs italic leading-relaxed text-slate-700">
                    &ldquo;Ensure your Problem Framing Pack clearly isolates root operational causes before drafting solution vectors. Test if freight latency is systemic or carrier-specific.&rdquo;
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-700 ring-1 ring-fuchsia-200">
                      WWHTBT Barrier-to-Belief
                    </span>
                    <span className="text-[10px] text-slate-400">Week 2 Prep</span>
                  </div>
                  <p className="rounded-xl border-l-4 !border-l-fuchsia-600 bg-gradient-to-r from-fuchsia-50/70 to-slate-50 p-3.5 text-xs italic leading-relaxed text-slate-700">
                    &ldquo;For Week 2 choices, remember a preferred idea is not a strategy. You must demonstrate at least 3 distinct alternatives with What Would Have to Be True tests.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Output History Card */}
          <div className="card-custom space-y-3">
            <h3 className="card-title border-b border-slate-100 pb-3">Team Output History</h3>

            <div className="space-y-2.5">
              {outputHistory.map((item) => (
                <div
                  key={item.week}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/70 px-4 py-3 ring-1 ring-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-900" title={`Week ${item.week}: ${item.title}`}>
                      Week {item.week}: {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.submittedAt}</p>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="absolute right-5 top-5 cursor-pointer rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {(() => {
                  const modalFallback = getLocalStudentFallback(selectedMember.roll_no, selectedMember.name);
                  const modalPhoto = resolveStudentPhotoUrl(selectedMember.photo_url) || modalFallback;
                  return (
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-700 text-2xl font-bold text-white shadow-lg ring-4 ring-white sm:h-32 sm:w-32">
                      <span>{studentInitials(selectedMember.name)}</span>
                      {modalPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={modalPhoto}
                          alt={`${selectedMember.name} photo`}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const current = e.currentTarget.src;
                            if (modalFallback && !current.includes(modalFallback)) {
                              e.currentTarget.src = modalFallback;
                              return;
                            }
                            if (current.includes("lh3.googleusercontent.com/d/")) {
                              const fileId = current.split("/d/")[1]?.split(/[?=&]/)[0];
                              if (fileId) {
                                e.currentTarget.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                                return;
                              }
                            } else if (current.includes("drive.google.com/thumbnail")) {
                              const fileId = new URL(current).searchParams.get("id");
                              if (fileId) {
                                e.currentTarget.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                                return;
                              }
                            }
                            e.currentTarget.style.display = "none";
                          }}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                        />
                      )}
                    </div>
                  );
                })()}

                <div className="min-w-0 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                      {selectedMember.name}
                    </h2>
                    <StatusBadge variant={selectedMember.status === "active" ? "success" : "secondary"}>
                      {selectedMember.status || "Active"}
                    </StatusBadge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge variant="primary">{selectedMember.batch_name || cohortName}</StatusBadge>
                    <StatusBadge variant="pink">{selectedMember.role}</StatusBadge>
                  </div>

                  <p className="mt-2.5 font-mono text-xs font-semibold text-brand-700">
                    Roll No: {selectedMember.roll_no || "—"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {selectedMember.institution_name || "Partner Institution"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Assigned Discipline: <strong className="text-slate-700">{selectedMember.discipline}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 sm:p-8">
              {/* Academic & Enrollment Information */}
              <div className="rounded-2xl bg-slate-50/70 p-5 ring-1 ring-slate-200/80">
                <h3 className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  Academic &amp; Enrollment Information
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70">
                    <span className="text-xs font-medium text-slate-500">Institution</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.institution_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70">
                    <span className="text-xs font-medium text-slate-500">Course</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.course || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70">
                    <span className="text-xs font-medium text-slate-500">Branch</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.branch || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70">
                    <span className="text-xs font-medium text-slate-500">Current Year / Semester</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedMember.current_year_semester || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70">
                    <span className="text-xs font-medium text-slate-500">Batch Assigned</span>
                    <p className="mt-0.5 text-sm font-semibold text-brand-700">
                      {selectedMember.batch_name || cohortName || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal & Contact Info (with Proper Alignment, No Identity/Verification) */}
              <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200/80">
                <h3 className="flex items-center gap-2.5 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  Personal &amp; Contact Info
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5 text-sm ring-1 ring-slate-100">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div className="min-w-0">
                      <span className="block text-xs font-medium text-slate-500">Email Address</span>
                      {selectedMember.email ? (
                        <a
                          href={`mailto:${selectedMember.email}`}
                          className="block truncate text-xs font-semibold text-brand-700 hover:underline sm:text-sm"
                        >
                          {selectedMember.email}
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700 sm:text-sm">Not provided</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5 text-sm ring-1 ring-slate-100">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">WhatsApp / Phone</span>
                      <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                        {selectedMember.phone || "Not provided"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5 text-sm ring-1 ring-slate-100">
                    <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Gender</span>
                      <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                        {selectedMember.gender || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3.5 text-sm ring-1 ring-slate-100">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Fellowship Role &amp; Focus</span>
                      <span className="text-xs font-semibold text-brand-800 sm:text-sm">
                        {selectedMember.role} &bull; {selectedMember.discipline}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Mentor Slot Modal (new request) */}
      <RequestMentorSlotModal
        isOpen={mentorSlotModalOpen}
        onClose={() => setMentorSlotModalOpen(false)}
        teamId={teamId}
        teamName={teamName}
        onSuccess={(newRequest) => {
          setExistingSlotRequest(newRequest);
          setMentorSlotModalOpen(false);
        }}
      />

      {/* Edit Slot Request Modal */}
      {editSlotOpen && existingSlotRequest && (
        <EditSlotModal
          request={existingSlotRequest}
          teamId={teamId}
          onClose={() => setEditSlotOpen(false)}
          onSaved={(updated) => {
            setExistingSlotRequest(updated);
            setEditSlotOpen(false);
          }}
        />
      )}

      {/* Cancel Confirm Dialog */}
      {cancelConfirmOpen && existingSlotRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <X className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Slot Request?</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">This will permanently delete your pending request. You can submit a new one anytime.</p>
              </div>
            </div>
            {slotActionError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{slotActionError}</span>
              </div>
            )}
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={slotActionLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Request
              </button>
              <button
                type="button"
                disabled={slotActionLoading}
                onClick={async () => {
                  setSlotActionLoading(true);
                  setSlotActionError(null);
                  try {
                    await cancelMentorSlot(teamId, existingSlotRequest.id);
                    setExistingSlotRequest(null);
                    setCancelConfirmOpen(false);
                  } catch (err: any) {
                    setSlotActionError(err?.data?.detail || err?.message || "Failed to cancel.");
                  } finally {
                    setSlotActionLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {slotActionLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : <X className="h-4 w-4" />}
                Yes, Cancel It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Slot Modal ─────────────────────────────────────────────────────────

function EditSlotModal({
  request,
  teamId,
  onClose,
  onSaved,
}: {
  request: MentorSlotRequest;
  teamId: string;
  onClose: () => void;
  onSaved: (updated: MentorSlotRequest) => void;
}) {
  const [date, setDate] = useState(request.preferred_date || "");
  const [startTime, setStartTime] = useState(
    typeof request.preferred_time_start === "string"
      ? request.preferred_time_start.slice(0, 5)
      : ""
  );
  const [endTime, setEndTime] = useState(
    typeof request.preferred_time_end === "string"
      ? request.preferred_time_end.slice(0, 5)
      : ""
  );
  const [topic, setTopic] = useState(request.topic || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date || !startTime || !endTime) { setError("All fields are required."); return; }
    if (startTime >= endTime) { setError("End time must be after start time."); return; }
    if (topic.trim().length < 10) { setError("Topic must be at least 10 characters."); return; }
    try {
      setLoading(true);
      const updated = await updateMentorSlot(teamId, request.id, {
        preferred_date: date,
        preferred_time_start: startTime.length === 5 ? `${startTime}:00` : startTime,
        preferred_time_end: endTime.length === 5 ? `${endTime}:00` : endTime,
        topic: topic.trim(),
      });
      onSaved(updated);
    } catch (err: any) {
      setError(err?.data?.detail || err?.message || "Failed to update request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-md shadow-brand-600/25">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">Edit Slot Request</h2>
              <p className="text-xs text-slate-500">Update your preferred date, time, or consultation topic.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-7">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-brand-600" />
                <span>Preferred Date</span>
              </label>
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-brand-600" />
                  <span>Start Window</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>End Window</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MessageSquare className="h-3.5 w-3.5 text-brand-600" />
                <span>Consultation Topic &amp; Focus Questions</span>
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
          </div>

          {/* Fixed footer */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient-primary !py-2.5 !px-5 !text-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : <Check className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}