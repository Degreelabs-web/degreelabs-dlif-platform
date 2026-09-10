"use client";

import { useEffect, useState } from "react";
import { fetchMentors, fetchMentorAssignments } from "@/lib/api/fellowship";
import { apiClient } from "@/lib/api/client";
import { Mentor, TeamMentorAssignment } from "@/types/fellowship";
import { Users, Mail, Award, CheckCircle2 } from "lucide-react";

interface TeamDetail {
  id: string;
  name: string;
  members: Array<{
    id: string;
    student_id: string;
    role: string;
  }>;
}

export default function MentorStudentsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [teamsWithMembers, setTeamsWithMembers] = useState<TeamDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const mList = await fetchMentors({ status: "active" });
      setMentors(mList);
      if (mList.length > 0) {
        setSelectedMentor(mList[0]);
        const mAssignments = await fetchMentorAssignments({ mentor_id: mList[0].id, status: "active" });
        const teamDetails = await Promise.all(
          mAssignments.map((a) => apiClient<TeamDetail>(`/teams/${a.team_id}`))
        );
        setTeamsWithMembers(teamDetails);
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Mentor Portal</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Assigned Students Roster
        </h1>
        <p className="text-sm text-slate-600">
          Individual fellows across your advised fellowship teams.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading students...</div>
      ) : teamsWithMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No students under guidance</h3>
          <p className="mt-1 text-xs text-slate-500">Students will appear once teams are assigned.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teamsWithMembers.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900">{t.name}</h2>
                <span className="text-xs text-slate-500">{t.members.length} members</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {t.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      S
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        Student Fellow ({m.student_id.slice(0, 8)}...)
                      </p>
                      <span className="inline-block rounded bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200 mt-1 capitalize">
                        {m.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
