"use client";

import { useEffect, useState } from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { getStoredUser, logoutUser, UserSession } from "@/lib/api/auth";

type TopbarProps = {
  role: "student" | "mentor" | "admin";
};

export default function Topbar({ role }: TopbarProps) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const workspaceTitle =
    role === "student"
      ? "Student Workspace"
      : role === "mentor"
      ? "Mentor Workspace"
      : "Admin Workspace";

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {workspaceTitle}
        </p>

        <p className="text-xs text-slate-500">
          DegreeLabs Impact Fellowship
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {user && (
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900">
              {user.full_name}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">
              {user.role} &bull; {user.email}
            </span>
          </div>
        )}

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm">
          {initial}
        </div>

        <button
          onClick={() => logoutUser()}
          className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-red-600 transition"
          title="Sign out of your session"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}