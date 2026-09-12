"use client";

import { useEffect, useState } from "react";
import {
  UsersRound,
  PlusCircle,
  UserPlus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "@/lib/api/teams";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { fetchCohorts } from "@/lib/api/cohorts";
import { fetchStudents } from "@/lib/api/students";
import { Cohort, Student, Team } from "@/types/fellowship";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState("");

  // Create Team Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTeamData, setNewTeamData] = useState({
    name: "",
    cohort_id: "",
    status: "active",
  });

  // Manage Members Modal
  const [activeTeamForMembers, setActiveTeamForMembers] = useState<Team | null>(
    null
  );
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState("member");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [teamsData, cohortsData, studentsData] = await Promise.all([
        fetchTeams({ cohort_id: selectedCohort || undefined }),
        fetchCohorts(),
        fetchStudents(),
      ]);
      setTeams(teamsData);
      setCohorts(cohortsData);
      setStudents(studentsData);
      if (cohortsData.length > 0 && !newTeamData.cohort_id) {
        setNewTeamData((prev) => ({ ...prev, cohort_id: cohortsData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCohort]);

  async function handleSubmitTeam(e: React.FormEvent) {
    e.preventDefault();
    setTeamFormError(null);
    setSubmittingTeam(true);

    try {
      if (!newTeamData.cohort_id) {
        throw new Error("Please select a cohort.");
      }
      if (editingTeam) {
        await updateTeam(editingTeam.id, {
          name: newTeamData.name,
          status: newTeamData.status,
        });
      } else {
        await createTeam(newTeamData);
      }
      setIsCreateModalOpen(false);
      setEditingTeam(null);
      setNewTeamData({
        name: "",
        cohort_id: cohorts[0]?.id || "",
        status: "active",
      });
      await loadData();
    } catch (err: unknown) {
      setTeamFormError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingTeam ? "update" : "create"} team.`
      );
    } finally {
      setSubmittingTeam(false);
    }
  }

  function openCreateModal() {
    setEditingTeam(null);
    setTeamFormError(null);
    setNewTeamData({
      name: "",
      cohort_id: cohorts[0]?.id || "",
      status: "active",
    });
    setIsCreateModalOpen(true);
  }

  function openEditModal(team: Team) {
    setEditingTeam(team);
    setTeamFormError(null);
    setNewTeamData({
      name: team.name,
      cohort_id: team.cohort_id,
      status: team.status,
    });
    setIsCreateModalOpen(true);
  }

  async function handleDeleteTeam(team: Team) {
    if (!confirm(`Delete "${team.name}"? This action cannot be undone.`)) return;
    try {
      setDeletingId(team.id);
      await deleteTeam(team.id);
      await loadData();
    } catch (err) {
      alert("Failed to delete team: " + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeamForMembers || !selectedStudentToAdd) return;
    setMemberError(null);
    setMemberSuccess(null);
    setMemberSubmitting(true);

    try {
      await addTeamMember(activeTeamForMembers.id, {
        student_id: selectedStudentToAdd,
        role: selectedRoleToAdd,
      });

      setMemberSuccess("Student successfully added to team!");
      setSelectedStudentToAdd("");
      await loadData();

      // Refresh active team in modal
      const refreshed = await fetchTeams({ cohort_id: selectedCohort || undefined });
      const current = refreshed.find((t) => t.id === activeTeamForMembers.id);
      if (current) setActiveTeamForMembers(current);
    } catch (err: any) {
      setMemberError(err.message || "Failed to add student to team.");
    } finally {
      setMemberSubmitting(false);
    }
  }

  async function handleRemoveMember(studentId: string) {
    if (!activeTeamForMembers) return;
    try {
      await removeTeamMember(activeTeamForMembers.id, studentId);
      await loadData();
      const refreshed = await fetchTeams({ cohort_id: selectedCohort || undefined });
      const current = refreshed.find((t) => t.id === activeTeamForMembers.id);
      if (current) setActiveTeamForMembers(current);
    } catch (err: any) {
      setMemberError(err.message || "Failed to remove student.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Student Squads
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Assemble student teams, allocate team leads, and manage squad rosters.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Create Team
        </button>
      </div>

      {/* Cohort Selector */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Filter by Cohort:
        </label>
        <select
          value={selectedCohort}
          onChange={(e) => setSelectedCohort(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none sm:w-auto"
        >
          <option value="">All Cohorts</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.academic_year})
            </option>
          ))}
        </select>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            <span className="text-sm font-medium">Loading teams...</span>
          </div>
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
          <UsersRound className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            No teams formed yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create project squads and assign students from the active cohort.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create First Team
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const cohort = cohorts.find((c) => c.id === team.cohort_id);
            const activeMembers = team.members.filter((m) => !m.left_at);

            return (
              <div
                key={team.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                      {team.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">
                        {cohort ? cohort.name : "Cohort"}
                      </span>
                      <EntityActionsMenu
                        label={team.name}
                        onEdit={() => openEditModal(team)}
                        onDelete={() => handleDeleteTeam(team)}
                        deleteLabel={deletingId === team.id ? "Deleting..." : "Delete"}
                      />
                    </div>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {team.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <UsersRound className="h-3.5 w-3.5" />
                    <span>{activeMembers.length} active member(s)</span>
                  </div>

                  {/* Members preview */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {activeMembers.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        No students assigned yet
                      </span>
                    ) : (
                      activeMembers.map((m) => {
                        const student = students.find(
                          (s) => s.profile?.id === m.student_id || s.id === m.student_id
                        );
                        return (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200"
                          >
                            {m.role === "leader" && (
                              <ShieldCheck className="h-3 w-3 text-amber-500" />
                            )}
                            {student ? student.full_name : "Student"}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setActiveTeamForMembers(team)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Manage Squad Members
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTeam ? "Edit Team" : "Create Team"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingTeam
                    ? "Update the team name and status."
                    : "Form a project team within a cohort."}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {teamFormError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{teamFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Cohort *
                </label>
                <select
                  required
                  disabled={Boolean(editingTeam)}
                  value={newTeamData.cohort_id}
                  onChange={(e) =>
                    setNewTeamData({ ...newTeamData, cohort_id: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>
                    Select Cohort
                  </option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Builders"
                  value={newTeamData.name}
                  onChange={(e) =>
                    setNewTeamData({ ...newTeamData, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {editingTeam && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    value={newTeamData.status}
                    onChange={(e) => setNewTeamData({ ...newTeamData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingTeam && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTeam ? "Save Changes" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {activeTeamForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeTeamForMembers.name} — Squad Roster
                </h2>
                <p className="text-xs text-slate-500">
                  Assign or remove student members (enforces single active team rule).
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTeamForMembers(null);
                  setMemberError(null);
                  setMemberSuccess(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {memberError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            {memberSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{memberSuccess}</span>
              </div>
            )}

            {/* Current Member List */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Teammates ({activeTeamForMembers.members.filter((m) => !m.left_at).length})
              </p>

              <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50">
                {activeTeamForMembers.members.filter((m) => !m.left_at).length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">
                    No members assigned yet.
                  </p>
                ) : (
                  activeTeamForMembers.members
                    .filter((m) => !m.left_at)
                    .map((m) => {
                      const student = students.find(
                        (s) => s.profile?.id === m.student_id || s.id === m.student_id
                      );
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-2">
                            {m.role === "leader" && (
                              <ShieldCheck className="h-4 w-4 text-amber-500" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {student ? student.full_name : "Student"}
                              </p>
                              <p className="text-xs text-slate-400">
                                Role: {m.role} {student && `• ${student.email}`}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveMember(m.student_id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Remove Member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="mt-6 space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Add Student to Squad
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <select
                    required
                    value={selectedStudentToAdd}
                    onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Select Candidate Student...</option>
                    {students.map((st) => (
                      <option
                        key={st.id}
                        value={st.profile?.id || st.id}
                      >
                        {st.full_name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedRoleToAdd}
                    onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="member">Member</option>
                    <option value="leader">Leader</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={memberSubmitting || !selectedStudentToAdd}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {memberSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
