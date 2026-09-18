"use client";

import { ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getStoredToken, getStoredUser, UserSession } from "@/lib/api/auth";
import { apiClient } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

type AppShellProps = {
  children: ReactNode;
  role: "student" | "mentor" | "admin";
};

const subscribeToHydration = () => () => {};

export default function AppShell({ children, role }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [desktopNavigationCollapsed, setDesktopNavigationCollapsed] = useState(false);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const token = hydrated ? getStoredToken() : null;
  const user = hydrated ? getStoredUser() : null;
  const userRole = user?.role;
  const isAuthorized = Boolean(
    token && userRole && (userRole === role || userRole === "admin")
  );

  // Auth + role guard
  useEffect(() => {
    if (!hydrated) return;

    // 1. Not authenticated — redirect to login
    if (!token || !userRole) {
      router.replace(`/login?role=${role}&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Role-based route guard
    // Admins can inspect any portal. Students and mentors can only access their designated portal.
    if (userRole !== role && userRole !== "admin") {
      if (userRole === "student") {
        router.replace("/student");
      } else if (userRole === "mentor") {
        router.replace("/mentor");
      } else {
        router.replace(`/login?role=${role}`);
      }
    }
  }, [hydrated, pathname, role, router, token, userRole]);

  // Restore sidebar collapse preference
  useEffect(() => {
    setDesktopNavigationCollapsed(
      localStorage.getItem("dlif_sidebar_collapsed") === "true"
    );
  }, []);

  // Silently refresh the user session from the API to get latest photo_url etc.
  useEffect(() => {
    if (!hydrated || !token) return;
    apiClient<UserSession>("/auth/me")
      .then((fresh) => {
        localStorage.setItem("dlif_user", JSON.stringify(fresh));
        window.dispatchEvent(new Event("dlif_user_updated"));
      })
      .catch(() => {
        // Network failure — keep using the cached session
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Loading / verifying state
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#dff1ff,_#f5f9ff_48%)]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-8 py-7 shadow-xl shadow-blue-950/5 backdrop-blur">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-600">
            Verifying authentication &amp; credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#f2f7ff_52%,#f8fbff_100%)]">
      <Sidebar
        role={role}
        open={mobileNavigationOpen}
        desktopCollapsed={desktopNavigationCollapsed}
        onToggleDesktop={() =>
          setDesktopNavigationCollapsed((collapsed) => {
            const next = !collapsed;
            localStorage.setItem("dlif_sidebar_collapsed", String(next));
            return next;
          })
        }
        onClose={() => setMobileNavigationOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar role={role} onOpenNavigation={() => setMobileNavigationOpen(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-3 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
