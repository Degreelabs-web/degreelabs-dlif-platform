import {
  LayoutDashboard,
  Users,
  UserRound,
  UsersRound,
  Building2,
  Target,
  CalendarDays,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Bell,
  BarChart3,
  ShieldCheck,
  Settings,
  Route,
  FolderOpen,
  Trophy,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const studentNavigation: NavigationItem[] = [
  {
    label: "Home",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    label: "My Journey",
    href: "/student/journey",
    icon: Route,
  },
  {
    label: "My Team",
    href: "/student/team",
    icon: UsersRound,
  },
  {
    label: "Challenge",
    href: "/student/challenge",
    icon: Target,
  },
  {
    label: "Sessions",
    href: "/student/sessions",
    icon: CalendarDays,
  },
  {
    label: "Resources",
    href: "/student/resources",
    icon: FolderOpen,
  },
  {
    label: "Submissions",
    href: "/student/submissions",
    icon: FileText,
  },
  {
    label: "Feedback",
    href: "/student/feedback",
    icon: MessageSquare,
  },
];

export const adminNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    label: "Mentors",
    href: "/admin/mentors",
    icon: UserRound,
  },
  {
    label: "Cohorts",
    href: "/admin/cohorts",
    icon: Building2,
  },
  {
    label: "Teams",
    href: "/admin/teams",
    icon: UsersRound,
  },
  {
    label: "Challenges",
    href: "/admin/challenges",
    icon: Target,
  },
  {
    label: "Sessions",
    href: "/admin/sessions",
    icon: CalendarDays,
  },
  {
    label: "Resources",
    href: "/admin/resources",
    icon: FolderOpen,
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: FileText,
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];