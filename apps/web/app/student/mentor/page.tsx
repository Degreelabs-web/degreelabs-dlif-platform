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
  Loader2,
} from "lucide-react";
import { PageHeader, SectionCard, StatusBadge, EmptyState } from "@/components/student/ui";

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

  return (
    <div className="page-container">
      <PageHeader
        badge={
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Advisory &amp; Guidance
          </span>
        }
        title="Assigned Industry Mentor"
        subtitle="Meet the industry technology architect guiding your squad's reasoning and quality gates."
      />

      {loading ? (
        <div className="card-custom flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <span className="text-sm font-medium">Loading mentor profile…</span>
          </div>
        </div>
      ) : !mentor ? (
        <EmptyState
          icon={<UserRound className="h-6 w-6" />}
          headline="No mentor assigned yet"
          description="Your dedicated mentor pairing will appear here once squad allocations conclude."
        />
      ) : (
        <div className="space-y-6">
          {/* Mentor Profile Hero Card */}
          <div className="card-custom !p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/40 p-6 sm:p-7 border-b border-slate-100">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <MentorHeadshot
                  name={mentor.full_name}
                  src={mentor.headshot_url}
                  failed={headshotFailed}
                  onError={() => setHeadshotFailed(true)}
                />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {mentor.full_name}
                    </h2>
                    {mentor.status && (
                      <StatusBadge variant={mentor.status === "active" ? "success" : "warning"}>
                        {mentor.status}
                      </StatusBadge>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-brand-700 sm:text-base">
                    {mentorTitle}
                  </p>

                  {mentor.professional_headline && (
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 max-w-3xl">
                      {mentor.professional_headline}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Content & Aside Grid */}
            <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                {/* Professional Bio */}
                <div>
                  <h3 className="card-title mb-2">Professional Biography</h3>
                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700">
                    {mentor.bio || "A professional biography has not been added yet."}
                  </p>
                </div>

                {/* Mentor Statement */}
                {mentor.mentor_statement && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <Quote className="h-5 w-5 text-brand-600 mb-2" />
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 italic">
                      &ldquo;{mentor.mentor_statement}&rdquo;
                    </p>
                  </div>
                )}

                {/* Expertise & Industry Tags */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Areas of Expertise
                    </h4>
                    {mentor.expertise && mentor.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.expertise.map((item) => (
                          <StatusBadge key={item} variant="primary">
                            {item}
                          </StatusBadge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Not specified yet.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Industries
                    </h4>
                    {mentor.industries && mentor.industries.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.industries.map((item) => (
                          <StatusBadge key={item} variant="secondary">
                            {item}
                          </StatusBadge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Not specified yet.</p>
                    )}
                  </div>
                </div>

                {/* Support Preferences */}
                {mentor.support_preferences && mentor.support_preferences.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UsersRound className="h-4 w-4 text-brand-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        How Mentor Supports You
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.support_preferences.map((preference) => (
                        <span
                          key={preference}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {preference}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Aside: Contact & Meta */}
              <aside className="h-fit rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                <h3 className="card-title">Contact &amp; Details</h3>
                <div className="space-y-3 text-xs text-slate-700">
                  {mentor.email && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <a href={`mailto:${mentor.email}`} className="break-all hover:underline text-brand-700 font-medium">
                        {mentor.email}
                      </a>
                    </div>
                  )}
                  {mentor.phone && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{mentor.phone}</span>
                    </div>
                  )}
                  {mentorLocation && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{mentorLocation}</span>
                    </div>
                  )}
                  {mentor.years_of_experience != null && (
                    <div className="flex items-start gap-2.5">
                      <Award className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{mentor.years_of_experience} years of experience</span>
                    </div>
                  )}
                  {context?.team && (
                    <div className="flex items-start gap-2.5">
                      <UserRound className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>Supporting squad: {context.team.name}</span>
                    </div>
                  )}
                </div>

                {mentor.linkedin_url && (
                  <a
                    href={mentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gradient-primary w-full justify-center !py-2.5 !text-xs mt-4"
                  >
                    <span>View LinkedIn Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} profile photo`}
        onError={onError}
        className="h-24 w-24 shrink-0 rounded-2xl border-2 border-white object-cover shadow-sm sm:h-28 sm:w-28"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-2xl font-bold text-white shadow-sm ring-2 ring-white sm:h-28 sm:w-28">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
