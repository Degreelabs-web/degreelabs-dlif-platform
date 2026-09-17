"use client";

import { useEffect, useState } from "react";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentDashboardData } from "@/types/student_dashboard";
import { StudentPortalContext } from "@/types/fellowship";

import { StudentDashboardHeader } from "@/components/student/StudentDashboardHeader";
import { NextActionBanner } from "@/components/student/NextActionBanner";
import { FourWeekMilestoneProgressBar } from "@/components/student/FourWeekMilestoneProgressBar";
import { AssignedChallengeCard } from "@/components/student/AssignedChallengeCard";
import { UpcomingSessionsCard } from "@/components/student/UpcomingSessionsCard";
import { CapabilitiesSnapshotCard } from "@/components/student/CapabilitiesSnapshotCard";
import { DeliverableChecklistCard } from "@/components/student/DeliverableChecklistCard";

import { UserRound, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [portalContext, setPortalContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        // Fetch student dashboard from API
        const data = await fetchStudentDashboard();
        setDashboardData(data);

        // Also fetch legacy student portal context for profile info if needed
        try {
          const ctx = await fetchStudentPortalContext();
          setPortalContext(ctx);
        } catch {
          // Non-blocking
        }
      } catch (err: any) {
        console.error("Failed to load student dashboard data", err);
        setError(err.message || "Failed to load fellowship dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
          <span className="font-medium text-slate-700">Loading Discover Fellowship Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <h2 className="text-lg font-bold text-red-900">Dashboard Unavailable</h2>
        <p className="text-sm text-red-700">
          {error || "Could not retrieve your team's fellowship progress."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const storedUser = getStoredUser();
  const student = dashboardData.student;
  const team = dashboardData.team;
  const cohort = dashboardData.cohort;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header (Greeting, Week badge, Quick Deliverable & Team actions) */}
      <StudentDashboardHeader data={dashboardData} />

      {/* 2. Next Action Banner (Revisions warning / Gate milestone alert / Working evidence CTA) */}
      {dashboardData.next_action && (
        <NextActionBanner action={dashboardData.next_action} />
      )}

      {/* 3. 4-Week Milestone Progress Bar (Named weeks, Strategic Questions, Gate status) */}
      <FourWeekMilestoneProgressBar
        weeks={dashboardData.weeks}
        cohortName={cohort?.name}
      />

      {/* 4. Main Two-Column Row (Assigned Challenge Card + Upcoming Sessions & Countdown) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AssignedChallengeCard
            challenge={dashboardData.assigned_challenge}
            metrics={dashboardData.metrics}
            mentor={dashboardData.mentor}
          />
        </div>
        <div className="lg:col-span-5">
          <UpcomingSessionsCard sessions={dashboardData.upcoming_sessions} />
        </div>
      </div>

      {/* 5. 5 Core Tracked Capabilities Snapshot */}
      <CapabilitiesSnapshotCard capabilities={dashboardData.capabilities} />

      {/* 6. Current Week Deliverable Templates Checklist (+ Living Masters) */}
      <DeliverableChecklistCard
        templates={dashboardData.templates}
        ongoingDeliverables={dashboardData.ongoing_deliverables}
        currentWeekNumber={team.current_week}
      />

      {/* 7. Collapsible Profile & Credential Information */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowProfileDetails(!showProfileDetails)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-800">
              Fellow Profile &amp; Credential Pathway
            </span>
            <span className="text-[11px] text-slate-400">
              &bull; {student.institution_name} &bull; {student.student_id || "Active"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <span>{showProfileDetails ? "Hide" : "View"} Details</span>
            {showProfileDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {showProfileDetails && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <span className="text-slate-500 block">Fellow Name</span>
                <span className="font-bold text-slate-900">{student.full_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-bold text-slate-900">{student.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Institution</span>
                <span className="font-bold text-slate-900">{student.institution_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fellowship Cohort</span>
                <span className="font-bold text-slate-900">{cohort.name}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Credential Pathway: Discover (Certificate in Problem Analysis &amp; Solution Architecture)</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                Enrolled via DegreeLabs National Fellowship Network
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
