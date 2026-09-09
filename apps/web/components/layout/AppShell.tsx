import { ReactNode } from "react";

import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/layout/Topbar";

type AppShellProps = {
  children: ReactNode;
  role: "student" | "admin";
};

export default function AppShell({
  children,
  role,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}