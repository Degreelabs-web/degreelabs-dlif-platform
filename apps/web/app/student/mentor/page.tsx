"use client";

import { useEffect, useState } from "react";
import { fetchStudentPortalContext } from "@/lib/api/fellowship";
import { getStoredUser } from "@/lib/api/auth";
import { StudentPortalContext } from "@/types/fellowship";
import {
  Award, Briefcase, CalendarPlus, Code2, ExternalLink, Mail, MapPin,
  Phone, Quote, Sparkles, UserRound, UsersRound, Loader2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/student/ui";
import { RequestMentorSlotModal } from "@/components/student/RequestMentorSlotModal";

export default function StudentMentorPage() {
  const [context, setContext] = useState<StudentPortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [headshotFailed, setHeadshotFailed] = useState(false);
  const [slotModalOpen, setSlotModalOpen] = useState(false);

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
            {/* Cover banner */}
            <div className="relative h-28 sm:h-36 bg-gradient-to-r from-brand-700 via-brand-500 to-fuchsia-500">
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_15%_20%,white,transparent_40%),radial-gradient(circle_at_85%_70%,white,transparent_35%)]" />
            </div>

            <div className="px-6 pb-6 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="relative z-10 -mt-14 sm:-mt-16">
                  <MentorHeadshot
                    name={mentor.full_name}
                    src={mentor.headshot_url}
                    failed={headshotFailed}
                    onError={() => setHeadshotFailed(true)}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5 sm:pt-4">
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
                  <p className="text-sm font-semibold text-brand-700 sm:text-base">{mentorTitle}</p>
                  {mentor.professional_headline && (
                    <p className="max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {mentor.professional_headline}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                      <Sparkles className="h-3 w-3" />
                      {mentor.mentor_category === "external_specialist" ? "External Specialist" : "DLIF Mentor"}
                    </span>
                    {mentorLocation && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <MapPin className="h-3 w-3" /> {mentorLocation}
                      </span>
                    )}
                    {mentor.years_of_experience != null && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Award className="h-3 w-3" /> {mentor.years_of_experience} yrs experience
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:pt-4">
                  {context?.team?.id && (
                    <button type="button" onClick={() => setSlotModalOpen(true)} className="btn-gradient-primary !py-2 !text-xs cursor-pointer">
                      <CalendarPlus className="h-3.5 w-3.5" /> Request Slot
                    </button>
                  )}
                  {mentor.linkedin_url && (
                    <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {mentor.github_url && (
                    <a href={mentor.github_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700">
                      <Code2 className="h-3.5 w-3.5" /> GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-3 border-y border-slate-100 bg-slate-50/60 px-6 py-4 sm:grid-cols-4 sm:px-7">
              {[
                { label: "Experience", value: mentor.years_of_experience != null ? `${mentor.years_of_experience} yrs` : "—", icon: Award },
                { label: "Expertise areas", value: mentor.expertise?.length ?? 0, icon: Sparkles },
                { label: "Industries", value: mentor.industries?.length ?? 0, icon: Briefcase },
                { label: "Your squad", value: context?.team?.name ?? "—", icon: UsersRound },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-xs ring-1 ring-slate-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{value}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
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
                <div className="space-y-3">
                  {mentor.email && (
                    <ContactRow icon={Mail}>
                      <a href={`mailto:${mentor.email}`} className="break-all text-brand-700 hover:underline">
                        {mentor.email}
                      </a>
                    </ContactRow>
                  )}
                  {mentor.phone && <ContactRow icon={Phone}>{mentor.phone}</ContactRow>}
                  {mentorLocation && <ContactRow icon={MapPin}>{mentorLocation}</ContactRow>}
                  {mentor.years_of_experience != null && (
                    <ContactRow icon={Award}>{mentor.years_of_experience} years of experience</ContactRow>
                  )}
                  {context?.team && (
                    <ContactRow icon={UserRound}>Supporting squad: {context.team.name}</ContactRow>
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

      {context?.team?.id && (
        <RequestMentorSlotModal
          isOpen={slotModalOpen}
          onClose={() => setSlotModalOpen(false)}
          teamId={context.team.id}
          teamName={context.team.name}
          onSuccess={() => setSlotModalOpen(false)}
        />
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
        className="h-28 w-28 shrink-0 rounded-2xl border-4 border-white bg-white object-cover object-middle shadow-lg sm:h-32 sm:w-32"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-2xl font-bold text-white shadow-sm ring-2 ring-white sm:h-28 sm:w-28">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ContactRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 text-xs font-medium text-slate-700">{children}</div>
    </div>
  );
}
