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


import { UserRound, ChevronDown, ChevronUp, ShieldCheck, GraduationCap, Mail, Building2, BookOpen } from "lucide-react";

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
        const data = await fetchStudentDashboard();
        setDashboardData(data);

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
        <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
          <div className="relative h-12 w-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-violet-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-base">Loading Your Dashboard</p>
            <p className="text-sm text-slate-500 mt-0.5">Fetching fellowship progress…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-100">
          <ShieldCheck className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-900">Dashboard Unavailable</h2>
        <p className="text-sm text-red-700 max-w-md mx-auto">
          {error || "Could not retrieve your team's fellowship progress."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-gradient-primary mx-auto"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const student = dashboardData.student;
  const team = dashboardData.team;
  const cohort = dashboardData.cohort;

  const profileFields = [
    { icon: UserRound, label: "Fellow Name", value: student.full_name },
    { icon: Mail, label: "Email Address", value: student.email },
    { icon: Building2, label: "Assigned Institution", value: student.institution_name },
    { icon: BookOpen, label: "Fellowship Cohort", value: cohort.name },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* 1. Header */}
      <StudentDashboardHeader data={dashboardData} />

      {/* 2. Next Action Banner */}
      {dashboardData.next_action && (
        <NextActionBanner action={dashboardData.next_action} />
      )}

      {/* 3. 4-Week Milestone Progress Bar */}
      <FourWeekMilestoneProgressBar
        weeks={dashboardData.weeks}
        cohortName={cohort?.name}
      />

      {/* 4. Main Two-Column Row */}
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

      {/* 5. Capabilities Snapshot */}
      <CapabilitiesSnapshotCard capabilities={dashboardData.capabilities} />



      {/* 7. Collapsible Profile & Credential Section */}
      <div className="card-custom overflow-hidden !p-0">
        <button
          type="button"
          onClick={() => setShowProfileDetails(!showProfileDetails)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <UserRound className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">
                Fellow Profile &amp; Credential Pathway
              </span>
              <span className="ml-2 text-xs text-slate-400">
                &bull; {student.institution_name} &bull; {student.student_id || "Active"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
            <span>{showProfileDetails ? "Hide" : "View"} Details</span>
            {showProfileDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {showProfileDetails && (
          <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50 space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {profileFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{value}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Credential Pathway: Discover (Certificate in Problem Analysis &amp; Solution Architecture)</span>
              </span>
              <span className="text-xs text-slate-500 shrink-0">
                Enrolled via DegreeLabs National Fellowship Network
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
