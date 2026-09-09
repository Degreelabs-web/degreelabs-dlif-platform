"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { studentNavigation, adminNavigation } from "@/lib/constants/navigation";

type SidebarProps = {
  role: "student" | "admin";
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navigation =
    role === "student" ? studentNavigation : adminNavigation;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <div className="text-lg font-bold text-slate-900">
            DegreeLabs
          </div>

          <div className="text-xs text-slate-500">
            Impact Fellowship
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}` &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-900">
            {role === "student" ? "Student Portal" : "Admin Portal"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            DLIF Platform
          </p>
        </div>
      </div>
    </aside>
  );
}