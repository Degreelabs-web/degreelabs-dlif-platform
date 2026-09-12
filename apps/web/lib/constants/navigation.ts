import {
  LayoutDashboard,
  Users,
  UserRound,
  UsersRound,
  Building2,
  Briefcase,
  FolderGit2,
  GitPullRequest,
  Target,
  CalendarDays,
  FileText,
  MessageSquare,
  BarChart3,
  Route,
  BookOpen,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

export const studentNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
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
    label: "Assigned Mentor",
    href: "/student/mentor",
    icon: UserRound,
  },
  {
    label: "Assigned Company",
    href: "/student/company",
    icon: Building2,
  },
  {
    label: "Assigned Project",
    href: "/student/project",
    icon: FolderGit2,
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

export const mentorNavigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/mentor",
    icon: LayoutDashboard,
  },
  {
    label: "Assigned Teams",
    href: "/mentor/teams",
    icon: UsersRound,
  },
  {
    label: "Assigned Students",
    href: "/mentor/students",
    icon: Users,
  },
  {
    label: "Assigned Projects",
    href: "/mentor/projects",
    icon: FolderGit2,
  },
  {
    label: "Submission Reviews",
    href: "/mentor/reviews",
    icon: FileText,
  },
];

export const adminNavigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Institutions",
    href: "/admin/institutions",
    icon: Building2,
  },
  {
    label: "Enrolled Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    label: "Enrolled Mentors",
    href: "/admin/mentors",
    icon: UserRound,
    children: [
      { label: "DLIF Mentors", href: "/admin/mentors" },
      {
        label: "External Specialist Mentors",
        href: "/admin/mentors/external-specialists",
      },
    ],
  },
  {
    label: "Cohorts",
    href: "/admin/cohorts",
    icon: BookOpen,
  },
  {
    label: "Teams",
    href: "/admin/teams",
    icon: UsersRound,
  },
  {
    label: "Companies",
    href: "/admin/companies",
    icon: Briefcase,
  },
  {
    label: "Projects",
    href: "/admin/projects",
    icon: FolderGit2,
  },
  {
    label: "Assignments Center",
    href: "/admin/assignments",
    icon: GitPullRequest,
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
    label: "Submissions",
    href: "/admin/submissions",
    icon: FileText,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
];
