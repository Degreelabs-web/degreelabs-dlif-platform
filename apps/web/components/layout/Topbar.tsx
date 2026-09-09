import { Bell, Search } from "lucide-react";

type TopbarProps = {
  role: "student" | "admin";
};

export default function Topbar({ role }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {role === "student" ? "Student Workspace" : "Admin Workspace"}
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

        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          U
        </div>
      </div>
    </header>
  );
}