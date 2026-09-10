"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Building2,
  GraduationCap,
  Mail,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { fetchStudents, provisionStudent } from "@/lib/api/students";
import { fetchInstitutions } from "@/lib/api/institutions";
import { Institution, Student } from "@/types/fellowship";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    institution_id: "",
    full_name: "",
    email: "",
    student_id: "",
    password: "",
    phone: "",
    course: "Computer Science & Engineering",
    branch: "Information Technology",
    graduation_year: 2026,
  });

  async function loadData() {
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
      if (institutionsData.length > 0 && !formData.institution_id) {
        setFormData((prev) => ({ ...prev, institution_id: institutionsData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedInstitution, selectedStatus]);

  async function handleProvisionStudent(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!formData.institution_id) {
        throw new Error("Please select an institution.");
      }
      await provisionStudent({
        ...formData,
        graduation_year: Number(formData.graduation_year),
      });

      setFormSuccess("Student successfully provisioned and account created!");
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to provision student.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.profile?.student_id &&
        s.profile.student_id.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Student Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Student Directory
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Onboard, provision credentials, and track candidate profiles across partner institutions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4" />
          Provision Student
        </button>
      </div>

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

        <div className="flex items-center gap-3">
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
              Get started by provisioning university students into the fellowship.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Provision First Student
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
                  <th className="px-6 py-3.5">Course & Branch</th>
                  <th className="px-6 py-3.5">Grad Year</th>
                  <th className="px-6 py-3.5">Status</th>
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
                        <div className="font-semibold text-slate-900">
                          {student.full_name}
                        </div>
                        <div className="text-xs text-slate-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {student.profile?.student_id || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {institution ? institution.name : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">
                          {student.profile?.course || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {student.profile?.branch || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {student.profile?.graduation_year || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            student.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Provision New Student
                </h2>
                <p className="text-xs text-slate-500">
                  Creates platform user, student profile, and authentication access.
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

            <form onSubmit={handleProvisionStudent} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Partner Institution *
                </label>
                <select
                  required
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
                    placeholder="student@institution.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
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
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Grad Year
                  </label>
                  <input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        graduation_year: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

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
                  Provision Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
