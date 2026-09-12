export type MentorStatus = "pending" | "active" | "rejected" | "inactive";
export type MentorCategory = "dlif" | "external_specialist";

export interface Mentor {
  id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  expertise: string[];
  years_of_experience?: number | null;
  company_name?: string | null;
  designation?: string | null;
  organisation?: string | null;
  current_role?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  professional_headline?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  headshot_url?: string | null;
  professional_headshot_url?: string | null;
  industries: string[];
  support_preferences: string[];
  mentor_statement?: string | null;
  mentoring_statement?: string | null;
  status: MentorStatus;
  mentor_category: MentorCategory;
  assigned_teams_count: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  profile: string;
  industry: string;
  website?: string | null;
  contact_email: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  logo_url?: string | null;
  status: string;
  projects_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_industry?: string | null;
  title: string;
  description: string;
  objectives: string;
  expected_deliverables: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  difficulty: string;
  max_teams: number;
  assigned_teams_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMentorAssignment {
  id: string;
  team_id: string;
  mentor_id: string;
  status: string;
  assigned_at: string;
  unassigned_at?: string | null;
  notes?: string | null;
  team_name?: string | null;
  mentor_name?: string | null;
  mentor_email?: string | null;
  mentor_company?: string | null;
}

export interface TeamProjectAssignment {
  id: string;
  team_id: string;
  project_id: string;
  company_id: string;
  status: string;
  assigned_at: string;
  completed_at?: string | null;
  notes?: string | null;
  team_name?: string | null;
  project_title?: string | null;
  company_name?: string | null;
  company_logo_url?: string | null;
}

export interface StudentCohortAssignment {
  id: string;
  student_id: string;
  cohort_id: string;
  status: string;
  assigned_at: string;
  completed_at?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  cohort_name?: string | null;
  institution_name?: string | null;
}

export interface StudentPortalContext {
  student: {
    profile_id: string;
    student_id: string;
    full_name: string;
    email: string;
    institution_name?: string | null;
    course?: string | null;
    branch?: string | null;
    graduation_year?: number | null;
  };
  cohort: {
    id: string;
    name: string;
    academic_year?: string | null;
    status: string;
  } | null;
  team: {
    id: string;
    name: string;
    role: string;
    members: Array<{
      student_id: string;
      name: string;
      role: string;
    }>;
  } | null;
  mentor: {
    id: string;
    full_name: string;
    designation?: string | null;
    company_name?: string | null;
    email?: string | null;
    linkedin_url?: string | null;
    expertise?: string[];
  } | null;
  company: {
    id: string;
    name: string;
    industry: string;
    website?: string | null;
    logo_url?: string | null;
    profile?: string | null;
  } | null;
  project: {
    id: string;
    title: string;
    description: string;
    objectives: string;
    expected_deliverables: string;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
    difficulty: string;
  } | null;
  stats: {
    sessions_attended: number;
    submissions_count: number;
    journey_stage: string;
  };
}

export interface MentorPortalContext {
  mentor: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string | null;
    designation?: string | null;
    expertise?: string[];
  };
  teams: Array<{
    id: string;
    name: string;
    cohort_name?: string | null;
    members_count: number;
    project?: {
      id: string;
      title: string;
      company_name?: string | null;
    } | null;
  }>;
  stats: {
    teams_count: number;
    students_count: number;
    pending_reviews_count: number;
  };
  recent_submissions: Array<{
    id: string;
    team_id: string;
    challenge_id?: string | null;
    submitted_at: string;
    status: string;
  }>;
}

// ==================== Institutions ====================

export interface Institution {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionCreate {
  name: string;
  code: string;
  status?: string;
}

export interface InstitutionUpdate {
  name?: string;
  code?: string;
  status?: string;
}

// ==================== Cohorts ====================

export interface Cohort {
  id: string;
  institution_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CohortCreate {
  institution_id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status?: string;
}

export interface CohortUpdate {
  name?: string;
  academic_year?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

// ==================== Students ====================

export interface StudentProfile {
  id: string;
  user_id: string;
  institution_id: string;
  student_id: string;
  phone?: string | null;
  course?: string | null;
  branch?: string | null;
  graduation_year?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  profile?: StudentProfile | null;
}

export interface StudentProvisionRequest {
  institution_id: string;
  student_id: string;
  email: string;
  full_name: string;
  password?: string;
  phone?: string;
  course?: string;
  branch?: string;
  graduation_year?: number;
}

export interface StudentCreate {
  institution_id: string;
  student_id: string;
  email: string;
  full_name: string;
  phone?: string;
  course?: string;
  branch?: string;
  graduation_year?: number;
}

export interface StudentUpdate {
  full_name?: string;
  status?: string;
  student_id?: string;
  phone?: string;
  course?: string;
  branch?: string;
  graduation_year?: number;
}

// ==================== Teams ====================

export interface TeamMember {
  id: string;
  team_id: string;
  student_id: string;
  role: string;
  joined_at: string;
  left_at?: string | null;
}

export interface TeamMemberCreate {
  student_id: string;
  role?: string;
}

export interface Team {
  id: string;
  cohort_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
}

export interface TeamCreate {
  cohort_id: string;
  name: string;
  status?: string;
  member_student_ids?: string[];
  leader_student_id?: string;
}

export interface TeamUpdate {
  name?: string;
  status?: string;
}

// ==================== Challenges ====================

export interface Challenge {
  id: string;
  title: string;
  company_name: string;
  description: string;
  problem_statement: string;
  expected_outcome?: string | null;
  difficulty: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ChallengeCreate {
  title: string;
  company_name: string;
  description: string;
  problem_statement: string;
  expected_outcome?: string | null;
  difficulty?: string;
  status?: string;
}

export interface ChallengeUpdate {
  title?: string;
  company_name?: string;
  description?: string;
  problem_statement?: string;
  expected_outcome?: string | null;
  difficulty?: string;
  status?: string;
}

export interface ChallengeAssignment {
  id: string;
  cohort_id: string;
  challenge_id: string;
  is_mandatory: boolean;
  assigned_at: string;
  due_date?: string | null;
}

// ==================== Sessions & Curriculum ====================

export interface SessionTask {
  id: string;
  session_id: string;
  title: string;
  description: string;
  task_type: string;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface SessionTaskCreate {
  title: string;
  description: string;
  task_type?: string;
  is_required?: boolean;
  order_index?: number;
}

export interface SessionResource {
  id: string;
  session_id: string;
  title: string;
  resource_type: string;
  url: string;
  description?: string | null;
  created_at: string;
}

export interface SessionResourceCreate {
  title: string;
  resource_type: string;
  url: string;
  description?: string;
}

export interface Session {
  id: string;
  cohort_id: string;
  week_number: number;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  tasks?: SessionTask[];
  resources?: SessionResource[];
}

export interface SessionCreate {
  cohort_id: string;
  week_number: number;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes?: number;
  meeting_url?: string;
  status?: string;
}

export interface SessionUpdate {
  week_number?: number;
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  meeting_url?: string;
  status?: string;
}

// ==================== Submissions ====================

export interface SubmissionFile {
  id: string;
  submission_version_id: string;
  file_name: string;
  storage_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  created_at: string;
}

export interface SubmissionVersion {
  id: string;
  submission_id: string;
  version_number: number;
  content?: string | null;
  created_by: string;
  created_at: string;
  files: SubmissionFile[];
}

export interface Submission {
  id: string;
  task_id: string;
  team_id: string;
  submitted_by: string;
  status: string;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  latest_version?: SubmissionVersion | null;
  versions?: SubmissionVersion[];
}

export interface SubmissionCreate {
  task_id: string;
  team_id: string;
  submitted_by: string;
  content?: string;
  status?: string;
}

export interface SubmissionVersionSubmit {
  submitted_by: string;
  content?: string;
  status?: string;
}

// ==================== Feedback ====================

export interface Feedback {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name?: string | null;
  reviewer_role?: string | null;
  feedback_text: string;
  score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreate {
  submission_id: string;
  reviewer_id: string;
  feedback_text: string;
  score?: number;
}

export interface FeedbackUpdate {
  feedback_text?: string;
  score?: number;
}

// ==================== Attendance ====================

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: string;
  marked_at: string;
  notes?: string | null;
}

export interface AttendanceMarkRequest {
  session_id: string;
  student_id: string;
  status: string;
  notes?: string;
}
