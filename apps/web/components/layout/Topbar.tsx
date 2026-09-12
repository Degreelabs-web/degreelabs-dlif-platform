"use client";

import { useSyncExternalStore } from "react";
import { LogOut, Menu } from "lucide-react";
import { logoutUser, UserSession } from "@/lib/api/auth";

type TopbarProps = {
  role: "student" | "mentor" | "admin";
  onOpenNavigation: () => void;
};

const getSessionSnapshot = () => localStorage.getItem("dlif_user") ?? "";
const getServerSessionSnapshot = () => "";

function parseUserSession(value: string): UserSession | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as UserSession;
  } catch {
    return null;
  }
}

export default function Topbar({ role, onOpenNavigation }: TopbarProps) {
  const serializedUser = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const user = parseUserSession(serializedUser);

  const workspaceTitle =
    role === "student"
      ? "Student Workspace"
      : role === "mentor"
      ? "Mentor Workspace"
      : "Admin Workspace";

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/80 bg-white/85 px-4 shadow-sm shadow-blue-950/[0.03] backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            {workspaceTitle}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            Learn. Solve. Grow
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <div className="hidden flex-col text-right md:flex">
            <span className="text-xs font-bold text-slate-900">
              {user.full_name}
            </span>
            <span className="max-w-52 truncate text-[10px] capitalize text-slate-500">
              {user.role} · {user.email}
            </span>
          </div>
        )}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-2 ring-white">
          {initial}
        </div>

        <button
          type="button"
          onClick={() => logoutUser()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-3"
          title="Sign out of your session"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
