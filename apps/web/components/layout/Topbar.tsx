
"use client";

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Camera,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  logoutUser,
  updateCurrentUserProfile,
  uploadProfilePhoto,
  UserSession,
} from "@/lib/api/auth";

type TopbarProps = {
  role: "student" | "mentor" | "admin";
  onOpenNavigation: () => void;
};

const getSessionSnapshot = () => localStorage.getItem("dlif_user") ?? "";
const getServerSessionSnapshot = () => "";

function parseUserSession(value: string): UserSession | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as UserSession;
  } catch {
    return null;
  }
}

function userInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Topbar({ role, onOpenNavigation }: TopbarProps) {
  /* ── Reactive user from localStorage ── */
  const serializedUser = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("dlif_user_updated", onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("dlif_user_updated", onStoreChange);
      };
    },
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const user = parseUserSession(serializedUser);

  /* ── UI state ── */
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  /* Form field state */
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  /* Photo upload state */
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  /* Save state */
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const workspaceTitle =
    role === "student"
      ? "Student Workspace"
      : role === "mentor"
        ? "Mentor Workspace"
        : "Admin Workspace";

  const initials = userInitials(user?.full_name);
  const photoUrl = user?.photo_url ?? null;

  /* ── Handlers ── */
  const openProfile = () => {
    setProfileOpen((open) => !open);
    setEditingProfile(false);
    setProfileError("");
    setPhotoPreview(null);
    setPendingPhotoFile(null);
  };

  const startEditing = () => {
    setDisplayName(user?.full_name ?? "");
    setPhone(user?.phone ?? "");
    setCourse(user?.course ?? "");
    setBranch(user?.branch ?? "");
    setSemester(user?.current_year_semester ?? "");
    setPhotoPreview(null);
    setPendingPhotoFile(null);
    setProfileError("");
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditingProfile(false);
    setProfileError("");
    setPhotoPreview(null);
    setPendingPhotoFile(null);
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = displayName.trim();
    if (normalizedName.length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    try {
      /* 1. Upload photo first if one was selected */
      if (pendingPhotoFile) {
        setUploadingPhoto(true);
        try {
          await uploadProfilePhoto(pendingPhotoFile);
        } finally {
          setUploadingPhoto(false);
        }
      }

      /* 2. Update text profile fields */
      await updateCurrentUserProfile({
        full_name: normalizedName,
        phone: phone.trim() || undefined,
        course: course.trim() || undefined,
        branch: branch.trim() || undefined,
        current_year_semester: semester.trim() || undefined,
      });

      setEditingProfile(false);
      setPhotoPreview(null);
      setPendingPhotoFile(null);
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Avatar element (shared) ── */
  const AvatarElement = ({
    size = "sm",
    preview,
  }: {
    size?: "sm" | "lg";
    preview?: string | null;
  }) => {
    const src = preview ?? photoUrl;
    const dim = size === "lg" ? "h-16 w-16 text-2xl" : "h-9 w-9 text-sm";
    return (
      <div
        className={`relative shrink-0 rounded-xl p-[2px] shadow-md shadow-violet-500/20 ${dim}`}
        style={{ background: "conic-gradient(from 200deg, #7C3AED, #F0653D, #0E9B8A, #7C3AED)" }}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white overflow-hidden">
          <span>{initials}</span>
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={user?.full_name ?? "Profile"}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/80 bg-white/85 px-4 shadow-sm shadow-violet-950/[0.03] backdrop-blur-xl sm:px-6 lg:h-20 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
            {workspaceTitle}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            Learn. Solve. Grow
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <div className="hidden flex-col text-right md:flex">
            <span className="text-xs font-bold text-slate-900">
              {user.full_name}
            </span>
            <span className="max-w-52 truncate text-[10px] capitalize text-slate-500">
              {user.role} · {user.email}
            </span>
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={openProfile}
            className="ring-2 ring-white rounded-xl transition hover:ring-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2"
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
            aria-label="Open profile menu"
            title="Account profile"
          >
            <AvatarElement size="sm" />
          </button>

          {profileOpen && user && (
            <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-violet-950/15">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-brand-50 via-white to-violet-50 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <AvatarElement size="lg" preview={photoPreview} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    {user.course && (
                      <p className="truncate text-[11px] text-brand-600 font-medium">
                        {user.course}{user.branch ? ` · ${user.branch}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3 p-5">
                {/* Access / Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                      {user.role}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Account</p>
                    <p className="mt-1 text-xs font-semibold capitalize text-emerald-700">{user.status}</p>
                  </div>
                </div>

                {/* Edit form or view */}
                {editingProfile ? (
                  <form onSubmit={saveProfile} className="space-y-3 border-t border-slate-100 pt-4">
                    {/* Photo upload */}
                    {role === "student" && (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <AvatarElement size="lg" preview={photoPreview} />
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition"
                            title="Change photo"
                          >
                            <Camera className="h-3 w-3" />
                          </button>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handlePhotoChange}
                          />
                        </div>
                        <div className="text-xs text-slate-500">
                          <p className="font-semibold text-slate-700">Profile Photo</p>
                          <p>JPG, PNG, or WebP · max 5 MB</p>
                          {pendingPhotoFile && (
                            <p className="text-brand-600 font-medium mt-0.5">
                              {pendingPhotoFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Name */}
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoFocus
                        maxLength={255}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </label>

                    {/* Student-only fields */}
                    {role === "student" && (
                      <>
                        <label className="block text-xs font-semibold text-slate-700">
                          Phone / WhatsApp
                          <div className="relative mt-1.5">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              maxLength={30}
                              placeholder="+91 98765 43210"
                              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                            />
                          </div>
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Course
                            <div className="relative mt-1.5">
                              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                              <input
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                maxLength={255}
                                placeholder="B.Tech"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                              />
                            </div>
                          </label>
                          <label className="block text-xs font-semibold text-slate-700">
                            Branch
                            <input
                              value={branch}
                              onChange={(e) => setBranch(e.target.value)}
                              maxLength={255}
                              placeholder="CSE"
                              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                            />
                          </label>
                        </div>

                        <label className="block text-xs font-semibold text-slate-700">
                          Current Year / Semester
                          <input
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            maxLength={50}
                            placeholder="3rd Year – Semester 5"
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                          />
                        </label>
                      </>
                    )}

                    {profileError && (
                      <p className="text-xs font-medium text-rose-600">{profileError}</p>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        {(savingProfile || uploadingPhoto) && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Save changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {(user.course || user.branch) && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        <span className="truncate">
                          {[user.course, user.branch].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={startEditing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit profile
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => logoutUser()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-3"
          title="Sign out of your session"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
