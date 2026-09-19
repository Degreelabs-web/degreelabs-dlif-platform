"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminNavigation,
  mentorNavigation,
  studentNavigation,
} from "@/lib/constants/navigation";
import { getStoredUser, logoutUser } from "@/lib/api/auth";

type SidebarProps = {
  role: "student" | "mentor" | "admin";
  open: boolean;
  desktopCollapsed: boolean;
  onToggleDesktop: () => void;
  onClose: () => void;
};

export default function Sidebar({
  role,
  open,
  desktopCollapsed,
  onToggleDesktop,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    email?: string;
    role?: string;
    photo_url?: string | null;
  } | null>(null);

  useEffect(() => {
    const refresh = () => {
      const user = getStoredUser();
      if (user) setCurrentUser(user);
    };
    refresh();
    window.addEventListener("dlif_user_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("dlif_user_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  const navigation =
    role === "student"
      ? studentNavigation
      : role === "mentor"
        ? mentorNavigation
        : adminNavigation;

  const roleLabel =
    role === "student"
      ? "Discover Fellow"
      : role === "mentor"
        ? "Dedicated Mentor"
        : "Program Director";

  const handleSignOut = () => {
    logoutUser();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-gradient-to-b from-[#150c2e] via-[#1e1042] to-[#2a1454] text-white shadow-2xl border-r border-white/10 transition-[transform,width] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"
          } ${desktopCollapsed ? "lg:w-20" : "lg:w-[270px]"}`}
      >
        {/* Brand Header */}
        <div
          className={`relative flex h-24 items-center border-b border-white/10 ${desktopCollapsed ? "justify-center px-3" : "px-4"
            }`}
        >
          {desktopCollapsed ? (
            <Link
              href="/student"
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shadow-violet-950/20"
              aria-label="DegreeLabs Discover"
            >
              <Image
                src="/icon.png"
                alt="DegreeLabs"
                width={420}
                height={372}
                className="h-full w-full object-contain"
                priority
              />
            </Link>
          ) : (
            <Link
              href="/student"
              onClick={onClose}
              className="flex min-w-0 flex-1 items-center gap-2 pr-10 group"
              aria-label="DegreeLabs Discover"
            >
              <div className="flex h-12 w-[120px] shrink-0 items-center justify-center rounded-xl bg-white px-3 shadow-md shadow-violet-950/20">
                <Image
                  src="/degreelabs-logo.png"
                  alt="DegreeLabs"
                  width={1754}
                  height={372}
                  className="max-h-7 w-auto max-w-full object-contain"
                  priority
                />
              </div>
              <div className="w-16 shrink-0 leading-tight">
                <div className="flex w-full items-center justify-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #f0653d)" }}>
                  Discover
                </div>
                <div className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Capability Engine
                </div>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleDesktop}
            className="absolute right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            aria-label={desktopCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {desktopCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section title */}
        {!desktopCollapsed && (
          <div className="px-5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Discover Program (Active)
          </div>
        )}

        {/* Navigation links */}
        <nav
          className={`flex-1 space-y-1 overflow-y-auto ${desktopCollapsed ? "p-2" : "px-3 py-2"
            }`}
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));
            const isExpanded = Boolean(expandedGroups[item.href] || isActive);

            if (item.children) {
              if (desktopCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={item.label}
                    className={`flex h-10 w-full items-center justify-center rounded-xl transition ${isActive
                      ? "nav-item-active"
                      : "text-slate-400 hover:bg-white/8 hover:text-white"
                      }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-violet-300" : ""}`} />
                  </Link>
                );
              }

              return (
                <div key={item.href} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroups((groups) => ({
                        ...groups,
                        [item.href]: !isExpanded,
                      }))
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${isActive
                      ? "nav-item-active"
                      : "text-slate-400 hover:bg-white/8 hover:text-white"
                      }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-violet-300" : "text-slate-400"}`} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-5 space-y-1 border-l border-white/10 pl-3">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`block rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${isChildActive
                              ? "bg-violet-400/20 text-violet-200 font-bold"
                              : "text-slate-400 hover:text-white hover:bg-white/8"
                              }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={desktopCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition ${isActive
                  ? "nav-item-active"
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
                  } ${desktopCollapsed
                    ? "h-10 w-full justify-center"
                    : "gap-3 px-3.5 py-2.5"
                  }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-violet-300" : "text-slate-400"
                    }`}
                />
                {!desktopCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer (Matching DL_DISCOVER base layout) */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-[2px]"
                style={{ background: "conic-gradient(from 200deg, #7C3AED, #F0653D, #0E9B8A, #7C3AED)" }}
              >
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1e1042] font-bold text-xs text-white uppercase overflow-hidden">
                  <span>{currentUser?.full_name ? currentUser.full_name.charAt(0) : "S"}</span>
                  {currentUser?.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.photo_url}
                      alt={currentUser.full_name ?? "Profile"}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                </div>
              </div>
              {!desktopCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white leading-tight">
                    {currentUser?.full_name || "Discover Fellow"}
                  </p>
                  <span className="inline-block mt-0.5 rounded bg-violet-400/20 px-1.5 py-0.2 text-[9px] font-bold text-violet-300">
                    {roleLabel}
                  </span>
                </div>
              )}
            </div>

            {!desktopCollapsed && (
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
