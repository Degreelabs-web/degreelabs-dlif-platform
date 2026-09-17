export interface QualityGateDefinition {
  name: string;
  rule: string;
  evaluator?: string;
}

export interface StudentDashboardTemplate {
  id: string;
  name: string;
  type: string;
  status: string;
  url?: string;
  description?: string;
}

export interface StudentDashboardSession {
  session_number: number;
  week_number?: number;
  title: string;
  session_type: "learn_work" | "output_review_gate" | string;
  type_label: string;
  focus: string;
  required_working_evidence?: string;
  duration_minutes?: number;
  scheduled_at?: string;
  formatted_date?: string;
  meeting_link?: string;
}

export interface StudentDashboardWeek {
  week_number: number;
  title: string;
  strategic_question: string;
  output_title: string;
  output_description?: string;
  quality_gate: QualityGateDefinition;
  sessions: StudentDashboardSession[];
  templates: StudentDashboardTemplate[];
  is_current: boolean;
  is_completed: boolean;
  status: "completed" | "in_progress" | "upcoming" | "revision_required";
  gate_status: "passed" | "pending" | "revision_required" | "locked";
  sessions_completed: number;
  total_sessions: number;
}

export interface StudentDashboardCapability {
  id: string;
  name: string;
  description: string;
  level: string;
  score: number;
  benchmark: string;
}

export interface StudentDashboardChallenge {
  id: string;
  title: string;
  company_name: string;
  challenge_owner: string;
  industry: string;
  description: string;
  problem_statement: string;
  expected_outcome?: string | null;
  difficulty: string;
  logo_url?: string | null;
}

export interface StudentDashboardNextAction {
  title: string;
  desc: string;
  link: string;
  btn_text: string;
  alert_level: "info" | "warning" | "gate" | "success";
  is_gate_alert: boolean;
}

export interface StudentDashboardMetrics {
  completed_sessions: number;
  total_sessions: number;
  completed_outputs: number;
  total_outputs: number;
  assigned_mentor: string;
}

export interface StudentDashboardData {
  student: {
    id: string;
    full_name: string;
    email: string;
    student_id?: string;
    institution_name?: string;
    status: string;
  };
  team: {
    id: string;
    name: string;
    current_week: number;
    current_session: number;
    members_count: number;
    members: Array<{
      student_id: string;
      name: string;
      role: string;
      email?: string | null;
      status?: string | null;
      roll_no?: string | null;
      institution_name?: string | null;
      course?: string | null;
      branch?: string | null;
      current_year_semester?: string | null;
      graduation_year?: number | null;
      phone?: string | null;
      gender?: string | null;
      photo_url?: string | null;
      batch_name?: string | null;
    }>;
  };
  cohort: {
    name: string;
    status: string;
  };
  mentor: {
    id?: string;
    full_name: string;
    designation: string;
    company_name: string;
    headshot_url?: string | null;
  };
  assigned_challenge: StudentDashboardChallenge;
  current_week: StudentDashboardWeek;
  current_session: StudentDashboardSession;
  weeks: StudentDashboardWeek[];
  upcoming_sessions: StudentDashboardSession[];
  next_action: StudentDashboardNextAction;
  capabilities: StudentDashboardCapability[];
  templates: StudentDashboardTemplate[];
  ongoing_deliverables: Array<{
    id: string;
    name: string;
    scope: string;
  }>;
  metrics: StudentDashboardMetrics;
}
