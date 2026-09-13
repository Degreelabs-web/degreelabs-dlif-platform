"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminNavigation,
  mentorNavigation,
  studentNavigation,
} from "@/lib/constants/navigation";
import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-slate-100 bg-white shadow-2xl shadow-blue-950/10 transition-[transform,width,border-color] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${desktopCollapsed ? "lg:w-24" : "lg:w-72"}`}
      >
        <div
          className={`flex h-20 items-center border-b border-slate-100 ${
            desktopCollapsed ? "justify-center gap-1 px-2" : "justify-between px-5"
          }`}
        >
          {desktopCollapsed ? (
            <Link
              href="/"
              onClick={onClose}
              className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-xl p-1 lg:block"
              aria-label="DegreeLabs home"
            >
              <Image
                src="/degreelabs-logo.png"
                alt="DegreeLabs"
                width={1754}
                height={372}
                priority
                className="h-auto w-[170px] !max-w-none"
              />
            </Link>
          ) : (
            <Link
              href="/"
              onClick={onClose}
              className="flex min-w-0 items-center rounded-xl"
              aria-label="DegreeLabs home"
            >
              <DegreeLabsLogo size="compact" priority />
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleDesktop}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-500 transition hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
            aria-label={desktopCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={desktopCollapsed ? "Expand navigation" : "Collapse navigation"}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className={`flex-1 space-y-1.5 overflow-y-auto ${
            desktopCollapsed ? "p-2" : "p-4"
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
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                    aria-label={item.label}
                    className={`group flex h-11 w-full items-center justify-center rounded-xl transition ${
                      isActive
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    <Icon
                      className={`h-[19px] w-[19px] ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-brand-500"
                      }`}
                    />
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
                    aria-expanded={isExpanded}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-brand-500" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-6 space-y-1 border-l border-brand-100 pl-3">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            aria-current={isChildActive ? "page" : undefined}
                            className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              isChildActive
                                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm"
                                : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
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
                aria-current={isActive ? "page" : undefined}
                title={desktopCollapsed ? item.label : undefined}
                className={`group flex items-center rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                } ${
                  desktopCollapsed
                    ? "h-11 w-full justify-center"
                    : "gap-3 px-3.5 py-2.5"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-brand-500"
                  }`}
                />
                {!desktopCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`border-t border-slate-100 p-4 ${
            desktopCollapsed ? "lg:hidden" : ""
          }`}
        >
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
