"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  User as UserIcon,
  FolderOpen,
  ImagePlus,
} from "lucide-react";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { DeleteConfirmationDialog } from "@/components/admin/DeleteConfirmationDialog";
import { EnrollmentSyncStatus } from "@/components/admin/EnrollmentSyncStatus";
import {
  deleteStudent,
  fetchStudents,
  provisionStudent,
  uploadStudentPhoto,
  updateStudent,
} from "@/lib/api/students";
import { fetchInstitutions } from "@/lib/api/institutions";
import { Institution, Student } from "@/types/fellowship";


function studentInitials(name?: string | null): string {
  return (name || "Student")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function studentPhotoUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;

  if (source.startsWith("/") || source.startsWith("data:")) return source;
  try {
    const url = new URL(source);
    const isGoogleDrive =
      url.hostname === "drive.google.com" ||
      url.hostname === "docs.google.com";

    if (isGoogleDrive) {
      const pathMatch = url.pathname.match(/\/(?:file\/)?d\/([^/?]+)/);
      const fileId = url.searchParams.get("id") || pathMatch?.[1];
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
      }
    }
  } catch {
    return source;
  }

  return source;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Selected Student Profile Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [studentPendingDelete, setStudentPendingDelete] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [directoryRefreshKey, setDirectoryRefreshKey] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    institution_id: "",
    full_name: "",
    email: "",
    student_id: "",
    password: "",
    phone: "",
    gender: "",
    current_year_semester: "",
    aadhaar_number: "",
    pan_number: "",
    document_url: "",
    course: "Computer Science & Engineering",
    branch: "Information Technology",
    graduation_year: 2026,
    status: "active",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsData, institutionsData] = await Promise.all([
        fetchStudents({
          institution_id: selectedInstitution || undefined,
          status: selectedStatus || undefined,
        }),
        fetchInstitutions(),
      ]);
      setStudents(studentsData);
      setInstitutions(institutionsData);
      if (institutionsData.length > 0) {
        setFormData((prev) =>
          prev.institution_id
            ? prev
            : { ...prev, institution_id: institutionsData[0].id }
        );
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  }, [selectedInstitution, selectedStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  async function handleSubmitStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.institution_id) {
        throw new Error("Please select an institution.");
      }
      const profileFields = {
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        current_year_semester: formData.current_year_semester || undefined,
        aadhaar_number: formData.aadhaar_number || undefined,
        pan_number: formData.pan_number || undefined,
        document_url: formData.document_url || undefined,
        course: formData.course || undefined,
        branch: formData.branch || undefined,
        graduation_year: Number(formData.graduation_year),
      };

      const savedStudent = editingStudent
        ? await updateStudent(editingStudent.id, {
            full_name: formData.full_name,
            status: formData.status,
            student_id: formData.student_id,
            ...profileFields,
          })
        : await provisionStudent({
            institution_id: formData.institution_id,
            full_name: formData.full_name,
            email: formData.email,
            student_id: formData.student_id,
            password: formData.password || undefined,
            ...profileFields,
          });

      if (photoFile) {
        try {
          await uploadStudentPhoto(savedStudent.id, photoFile);
        } catch (photoError) {
          console.error("Failed to upload student profile photo", photoError);
          setFormError(
            `Student details were saved, but the profile photo failed to upload: ${
              photoError instanceof Error ? photoError.message : "Upload error"
            }`
          );
          setSubmitting(false);
          await loadData();
          return;
        }
      }

      setFormSuccess(
        editingStudent
          ? "Student successfully updated!"
          : "Student successfully added through the manual fallback."
      );
      if (!editingStudent) {
        setDirectoryRefreshKey((value) => value + 1);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingStudent(null);
        setPhotoFile(null);
        setFormSuccess(null);
        loadData();
      }, 1200);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingStudent ? "update" : "provision"} student.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateModal() {
    setEditingStudent(null);
    setPhotoFile(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      institution_id: institutions[0]?.id || "",
      full_name: "",
      email: "",
      student_id: "",
      password: "",
      phone: "",
      gender: "",
      current_year_semester: "",
      aadhaar_number: "",
      pan_number: "",
      document_url: "",
      course: "Computer Science & Engineering",
      branch: "Information Technology",
      graduation_year: 2026,
      status: "active",
    });
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setPhotoFile(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      institution_id: student.profile?.institution_id || "",
      full_name: student.full_name,
      email: student.email,
      student_id: student.profile?.student_id || "",
      password: "",
      phone: student.profile?.phone || "",
      gender: student.profile?.gender || "",
      current_year_semester: student.profile?.current_year_semester || "",
      aadhaar_number: student.profile?.aadhaar_number || "",
      pan_number: student.profile?.pan_number || "",
      document_url: student.profile?.document_url || "",
      course: student.profile?.course || "",
      branch: student.profile?.branch || "",
      graduation_year: student.profile?.graduation_year || 2026,
      status: student.status,
    });
    setIsModalOpen(true);
  }

  function requestDeleteStudent(student: Student) {
    setDeleteError(null);
    setStudentPendingDelete(student);
  }

  async function confirmDeleteStudent() {
    if (!studentPendingDelete) return;

    try {
      setDeletingId(studentPendingDelete.id);
      setDeleteError(null);
      await deleteStudent(studentPendingDelete.id);
      setStudents((current) =>
        current.filter((student) => student.id !== studentPendingDelete.id)
      );
      setDirectoryRefreshKey((value) => value + 1);
      setStudentPendingDelete(null);
      await loadData();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete the student."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function changeStudentStatus(
    student: Student,
    nextStatus: "active" | "inactive"
  ) {
    if (student.status === nextStatus) return;

    try {
      setStatusUpdatingId(student.id);
      const updatedStudent = await updateStudent(student.id, { status: nextStatus });
      setStudents((current) =>
        current.map((item) =>
          item.id === student.id ? { ...item, status: updatedStudent.status } : item
        )
      );
      await loadData();
    } catch (err) {
      alert(
        `Failed to update ${student.full_name}'s status: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const filteredStudents = students.filter((s) => {
    const query = search.toLowerCase();
    const matchSearch =
      s.full_name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.profile?.student_id &&
        s.profile.student_id.toLowerCase().includes(query)) ||
      (s.batch?.name && s.batch.name.toLowerCase().includes(query));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Enrollment Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Enrolled Students
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review the synchronized student roster across partner institutions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Add Student Manually
        </button>
      </div>

      <EnrollmentSyncStatus
        entity="students"
        onSynced={loadData}
        refreshKey={directoryRefreshKey}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or student roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium">Loading student roster...</span>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              No students found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Connect the enrollment workbook or add a student manually.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Add First Student Manually
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Roll No / ID</th>
                  <th className="px-6 py-3.5">Institution</th>
                  <th className="px-6 py-3.5">Batch</th>
                  <th className="px-6 py-3.5">Course & Branch</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const institution = institutions.find(
                    (inst) => inst.id === student.profile?.institution_id
                  );
                  return (
                    <tr key={student.id} className="transition hover:bg-slate-50/75">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-xs font-bold text-indigo-800 ring-1 ring-indigo-200">
                            <span>{studentInitials(student.full_name)}</span>
                            {studentPhotoUrl(student.profile?.photo_url) && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={studentPhotoUrl(student.profile?.photo_url) || undefined}
                                alt={`${student.full_name} photo`}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="text-left font-semibold text-slate-900 transition hover:text-indigo-600 hover:underline"
                            >
                              {student.full_name}
                            </button>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {student.profile?.student_id || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {institution ? institution.name : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {student.batch ? (
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                            {student.batch.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">
                          {student.profile?.course || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {student.profile?.branch || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          aria-label={`Status for ${student.full_name}`}
                          value={student.status === "inactive" ? "inactive" : "active"}
                          disabled={statusUpdatingId === student.id}
                          onChange={(event) =>
                            void changeStudentStatus(
                              student,
                              event.target.value as "active" | "inactive"
                            )
                          }
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize outline-none transition disabled:cursor-wait disabled:opacity-60 ${
                            student.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <EntityActionsMenu
                          label={student.full_name}
                          onView={() => setSelectedStudent(student)}
                          onEdit={() => openEditModal(student)}
                          onDelete={() => requestDeleteStudent(student)}
                          deleteLabel={deletingId === student.id ? "Deleting..." : "Delete"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        open={Boolean(studentPendingDelete)}
        entityLabel="Student"
        entityName={studentPendingDelete?.full_name || "this student"}
        deleting={Boolean(deletingId)}
        error={deleteError}
        onCancel={() => {
          setStudentPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmDeleteStudent}
      />


      {/* Student Profile Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-profile-title"
        >
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            {/* Modal Header */}
            <div className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 sm:p-8">
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-2xl font-bold text-white shadow-lg ring-4 ring-white">
                  <span>{studentInitials(selectedStudent.full_name)}</span>
                  {studentPhotoUrl(selectedStudent.profile?.photo_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={studentPhotoUrl(selectedStudent.profile?.photo_url) || undefined}
                      alt={`${selectedStudent.full_name} photo`}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="student-profile-title" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {selectedStudent.full_name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                        selectedStudent.status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-700 ring-slate-600/20"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {selectedStudent.status}
                    </span>
                    {selectedStudent.batch && (
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                        {selectedStudent.batch.name}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 font-mono text-xs font-semibold text-indigo-700">
                    Roll No: {selectedStudent.profile?.student_id || "—"}
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {institutions.find((i) => i.id === selectedStudent.profile?.institution_id)?.name || "Partner Institution"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* Academic & Batch Overview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  Academic & Enrollment Information
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Institution</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {institutions.find((i) => i.id === selectedStudent.profile?.institution_id)?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Course</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedStudent.profile?.course || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Branch</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedStudent.profile?.branch || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Current Year / Semester</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedStudent.profile?.current_year_semester || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Batch Assigned</span>
                    <p className="mt-0.5 text-sm font-semibold text-indigo-700">
                      {selectedStudent.batch?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal & Contact Details */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                    Personal & Contact Info
                  </h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-xs font-medium text-slate-500">Email Address</span>
                        <a href={`mailto:${selectedStudent.email}`} className="font-semibold text-indigo-600 hover:underline">
                          {selectedStudent.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-xs font-medium text-slate-500">WhatsApp / Phone</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStudent.profile?.phone || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-xs font-medium text-slate-500">Gender</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStudent.profile?.gender || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government & Identity Verification */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    Identity & Verification
                  </h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-xs font-medium text-slate-500">Aadhaar Number</span>
                        <span className="font-mono font-semibold tracking-wider text-slate-900">
                          {selectedStudent.profile?.aadhaar_number || "Not provided"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-xs font-medium text-slate-500">PAN Number</span>
                        <span className="font-mono font-semibold tracking-wider text-slate-900 uppercase">
                          {selectedStudent.profile?.pan_number || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document & External Links */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FolderOpen className="h-4 w-4 text-indigo-600" />
                  Documents & Verification Files
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selectedStudent.profile?.document_url ? (
                    <a
                      href={selectedStudent.profile.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderOpen className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-800">Student Document Folder</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-3.5 text-xs text-slate-400">
                      No document folder link provided
                    </div>
                  )}


                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const st = selectedStudent;
                    setSelectedStudent(null);
                    openEditModal(st);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Edit Student
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add/Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingStudent ? "Edit Student" : "Add Student Manually"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingStudent
                    ? "Update the student profile and account status."
                    : "Creates platform user, student profile, and authentication access."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitStudent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Partner Institution *
                </label>
                <select
                  required
                  disabled={Boolean(editingStudent)}
                  value={formData.institution_id}
                  onChange={(e) =>
                    setFormData({ ...formData, institution_id: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>
                    Select Institution
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-3">
                <div className="flex items-start gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-xs font-bold text-indigo-800 ring-1 ring-indigo-200">
                    {photoFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Photo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : editingStudent?.profile?.photo_url && studentPhotoUrl(editingStudent.profile.photo_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={studentPhotoUrl(editingStudent.profile.photo_url) || undefined}
                        alt="Current photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Profile Photo
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">
                      JPG, PNG, or WebP up to 5 MB. The image is stored privately.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            setPhotoFile(null);
                            event.currentTarget.value = "";
                            setFormError("Profile photo must be 5 MB or smaller.");
                            return;
                          }
                          setFormError(null);
                          setPhotoFile(file);
                        }}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                      />
                      {photoFile && (
                        <button
                          type="button"
                          onClick={() => setPhotoFile(null)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {photoFile && (
                      <p className="mt-1.5 text-xs text-emerald-700">
                        Selected: {photoFile.name}
                      </p>
                    )}
                    {!photoFile && editingStudent?.profile?.photo_url && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        The existing photo remains unless you select a replacement.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Student ID / Roll No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-2026-102"
                    value={formData.student_id}
                    onChange={(e) =>
                      setFormData({ ...formData, student_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingStudent)}
                    placeholder="student@institution.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {!editingStudent && <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Temporary Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Set temporary password (min 8 chars)"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Course
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Current Year / Semester
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4th Year / 7th Sem"
                    value={formData.current_year_semester}
                    onChange={(e) =>
                      setFormData({ ...formData, current_year_semester: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="12-digit Aadhaar"
                    value={formData.aadhaar_number}
                    onChange={(e) =>
                      setFormData({ ...formData, aadhaar_number: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit PAN"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Verification Document URL
                </label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional secure URL for an approved enrollment or verification file.
                </p>
              </div>

              {editingStudent && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingStudent ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
