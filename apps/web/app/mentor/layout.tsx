import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export default function MentorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell role="mentor">{children}</AppShell>;
}
