"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect } from "react";

import {
  adminNavigation,
  mentorNavigation,
  studentNavigation,
} from "@/lib/constants/navigation";
import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";

type SidebarProps = {
  role: "student" | "mentor" | "admin";
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();

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

  const portalTitle =
    role === "student"
      ? "Student Portal"
      : role === "mentor"
        ? "Mentor Portal"
        : "Admin Portal";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-100 bg-white shadow-2xl shadow-blue-950/10 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/"
            onClick={onClose}
            className="flex min-w-0 items-center rounded-xl"
          >
            <DegreeLabsLogo size="compact" priority />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-brand-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg shadow-blue-950/10">
            <div className="absolute -right-5 -top-6 h-20 w-20 rounded-full bg-brand-400/20 blur-xl" />
            <p className="relative text-xs font-bold text-white">{portalTitle}</p>
            <p className="relative mt-1 text-[11px] text-blue-100/70">
              DegreeLabs Workspace
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
