import { apiClient } from "@/lib/api/client";
import { StudentDashboardData } from "@/types/student_dashboard";

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return apiClient<StudentDashboardData>("/portal/student-dashboard");
}
