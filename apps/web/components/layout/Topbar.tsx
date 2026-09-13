"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { Loader2, LogOut, Mail, Menu, Pencil, ShieldCheck } from "lucide-react";
import {
  logoutUser,
  updateCurrentUserProfile,
  UserSession,
} from "@/lib/api/auth";

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

export default function Topbar({
  role,
  onOpenNavigation,
}: TopbarProps) {
  const serializedUser = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("dlif_user_updated", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("dlif_user_updated", onStoreChange);
      };
    },
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const user = parseUserSession(serializedUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const workspaceTitle =
    role === "student"
      ? "Student Workspace"
      : role === "mentor"
      ? "Mentor Workspace"
      : "Admin Workspace";

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  const openProfile = () => {
    setProfileOpen((open) => !open);
    setEditingProfile(false);
    setProfileError("");
    setDisplayName(user?.full_name ?? "");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = displayName.trim();
    if (normalizedName.length < 2) {
      setProfileError("Enter a name with at least 2 characters.");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    try {
      await updateCurrentUserProfile(normalizedName);
      setEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/80 bg-white/85 px-4 shadow-sm shadow-blue-950/[0.03] backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          aria-label="Open navigation"
          title="Open navigation"
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

        <div className="relative">
          <button
            type="button"
            onClick={openProfile}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 ring-2 ring-white transition hover:from-brand-500 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2"
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
            aria-label="Open profile menu"
            title="Account profile"
          >
            {initial}
          </button>

          {profileOpen && user && (
            <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-950/15">
              <div className="bg-gradient-to-br from-brand-50 via-white to-blue-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white shadow-md shadow-blue-500/20">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                      {user.role}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Account</p>
                    <p className="mt-1 text-xs font-semibold capitalize text-emerald-700">{user.status}</p>
                  </div>
                </div>

                {editingProfile ? (
                  <form onSubmit={saveProfile} className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-700">
                      Display name
                      <input
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        autoFocus
                        maxLength={255}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </label>
                    {profileError && <p className="text-xs font-medium text-rose-600">{profileError}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Save changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit profile
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
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
