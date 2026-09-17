"use client";

import { useEffect, useState } from "react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import {
  Award,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Quote,
  UserRound,
  UsersRound,
} from "lucide-react";

export default function StudentMentorPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [headshotFailed, setHeadshotFailed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = getStoredUser();
        setContext(await fetchStudentPortalContext(user?.id));
      } catch (error) {
        console.error("Failed to load mentor profile", error);
        setContext(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const mentor = context?.mentor;

  const mentorLocation =
    mentor?.location ||
    [mentor?.city, mentor?.country].filter(Boolean).join(", ");
  const mentorRole = mentor?.designation || "Industry Mentor";
  const mentorTitle = mentor?.company_name
    ? `${mentorRole} at ${mentor.company_name}`
    : mentorRole;

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <UserRound className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            No mentor assigned yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your assigned mentor will appear here once the project assignment
            has been completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeading />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <MentorHeadshot
              name={mentor.full_name}
              src={mentor.headshot_url}
              failed={headshotFailed}
              onError={() => setHeadshotFailed(true)}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {mentor.full_name}
                </h2>
                {mentor.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${mentor.status === "active"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                  >
                    {mentor.status}
                  </span>
                )}
              </div>

              <p className="mt-2 text-base font-semibold text-blue-700 sm:text-lg">
                {mentorTitle}
              </p>

              {mentor.professional_headline && (
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                  {mentor.professional_headline}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <section>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Professional bio
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">
                {mentor.bio || "A professional biography has not been added yet."}
              </p>
            </section>

            {mentor.mentor_statement && (
              <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
                <Quote className="h-7 w-7 text-blue-600" />
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-800">
                  “{mentor.mentor_statement}”
                </p>
              </section>
            )}

            <div className="grid gap-7 sm:grid-cols-2">
              <ProfileTags
                title="Areas of expertise"
                values={mentor.expertise}
                emptyMessage="Expertise details have not been added yet."
                tone="blue"
              />
              <ProfileTags
                title="Industries"
                values={mentor.industries}
                emptyMessage="Industry details have not been added yet."
                tone="slate"
              />
            </div>

            {mentor.support_preferences && mentor.support_preferences.length > 0 && (
              <section>
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    How your mentor can support you
                  </h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mentor.support_preferences.map((preference) => (
                    <span
                      key={preference}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      {preference}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
            <h3 className="text-base font-bold text-slate-900">
              Contact and experience
            </h3>
            <div className="mt-5 space-y-4">
              {mentor.email && (
                <ContactItem icon={<Mail className="h-5 w-5" />}>
                  <a href={`mailto:${mentor.email}`} className="break-all hover:underline">
                    {mentor.email}
                  </a>
                </ContactItem>
              )}
              {mentor.phone && (
                <ContactItem icon={<Phone className="h-5 w-5" />}>
                  {mentor.phone}
                </ContactItem>
              )}
              {mentorLocation && (
                <ContactItem icon={<MapPin className="h-5 w-5" />}>
                  {mentorLocation}
                </ContactItem>
              )}
              {mentor.years_of_experience != null && (
                <ContactItem icon={<Award className="h-5 w-5" />}>
                  {mentor.years_of_experience} years of professional experience
                </ContactItem>
              )}
              {context?.team && (
                <ContactItem icon={<UserRound className="h-5 w-5" />}>
                  Supporting team: {context.team.name}
                </ContactItem>
              )}
            </div>

            {mentor.linkedin_url && (
              <a
                href={mentor.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                View professional profile
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function PageHeading() {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">Student Portal</p>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Assigned Industry Mentor
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Meet the industry mentor supporting your team throughout the fellowship.
      </p>
    </div>
  );
}

function MentorHeadshot({
  name,
  src,
  failed,
  onError,
}: {
  name: string;
  src?: string | null;
  failed: boolean;
  onError: () => void;
}) {
  if (src && !failed) {
    return (
      // Signed Supabase Storage URLs are intentionally rendered directly.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} profile photo`}
        onError={onError}
        className="h-28 w-28 shrink-0 rounded-3xl border-4 border-white object-cover shadow-md sm:h-32 sm:w-32"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-300 to-blue-500 text-3xl font-bold text-white shadow-md ring-4 ring-white sm:h-32 sm:w-32">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ContactItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-slate-700">
      <span className="mt-0.5 shrink-0 text-blue-600">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function ProfileTags({
  title,
  values,
  emptyMessage,
  tone,
}: {
  title: string;
  values?: string[];
  emptyMessage: string;
  tone: "blue" | "slate";
}) {
  const tagClass =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-slate-100 text-slate-700";

  return (
    <section>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {values && values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={value} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tagClass}`}>
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
}
