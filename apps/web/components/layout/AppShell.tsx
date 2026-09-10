"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getStoredToken, getStoredUser } from "@/lib/api/auth";
import { Loader2 } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
  role: "student" | "mentor" | "admin";
};

export default function AppShell({
  children,
  role,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    // 1. If not authenticated, redirect to login with target role
    if (!token || !user) {
      router.replace(`/login?role=${role}&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Role-based route guard
    // Admins can inspect any portal. Students and mentors can only access their designated portal.
    if (user.role !== role && user.role !== "admin") {
      if (user.role === "student") {
        router.replace("/student");
      } else if (user.role === "mentor") {
        router.replace("/mentor");
      } else {
        router.replace(`/login?role=${role}`);
      }
      return;
    }

    setIsAuthorized(true);
  }, [role, pathname, router]);

  // Loading / verifying state
  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-sm font-medium text-slate-600">
            Verifying authentication & credentials...
          </p>
        </div>
      </div>
    );
  }

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