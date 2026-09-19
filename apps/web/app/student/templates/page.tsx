"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  BookOpen,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Send,
  Layers,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileCheck2,
} from "lucide-react";
import { fetchStudentDashboard } from "@/lib/api/student_dashboard";
import { StudentDashboardData } from "@/types/student_dashboard";
import { PageHeader } from "@/components/student/ui";

// Comprehensive fallback curriculum template data in case dashboard data is loading or offline
const DEFAULT_TEMPLATES = [
  // Week 1
  {
    id: "t-1",
    week_number: 1,
    session_number: 1,
    name: "Company Context & Challenge Sheet",
    type: "Core Template",
    status: "ready",
    description: "Decode the company brief — map revenue model, operational drivers, customer segments, and the commercial stakes of the challenge.",
    required_evidence: "Audit of revenue streams, operational constraints, and current hypothesis framing.",
    sections: [
      "1. Company Overview & Industry Context",
      "2. Commercial Mechanics & Revenue Streams",
      "3. Core Operational Bottlenecks",
      "4. Initial Problem Statement & Hypotheses",
    ],
  },
  {
    id: "t-3",
    week_number: 1,
    session_number: 1,
    name: "Evidence / Assumption / Unknowns Log",
    type: "Living Document",
    status: "active",
    description: "Continuously track what you know (evidence), what you believe (assumptions), and what you still need to prove (unknowns).",
    required_evidence: "Initial log with at least 5 validated evidence items and 5 tagged critical assumptions.",
    sections: [
      "1. Confirmed Evidence (Primary & Secondary Citations)",
      "2. Critical Business Assumptions (Unverified)",
      "3. Key Unknowns & Research Priorities",
      "4. Validation Plan & Method",
    ],
  },
  {
    id: "t-2",
    week_number: 1,
    session_number: 2,
    name: "Workflow + Stakeholder Map",
    type: "Core Template",
    status: "ready",
    description: "Visualise end-to-end workflows, identify friction points, and plot all stakeholders with their interests, power, and influence.",
    required_evidence: "Workflow diagram with friction heatmaps and stakeholder matrix.",
    sections: [
      "1. End-to-End Operational Workflow",
      "2. Friction Points & Latency Sources",
      "3. Stakeholder Power vs. Interest Grid",
      "4. Voice of the User / Operator Quotes",
    ],
  },
  {
    id: "t-4",
    week_number: 1,
    session_number: 3,
    name: "Problem Framing + Outcome Definition Pack",
    type: "Quality Gate Pack",
    status: "gate",
    description: "Synthesize the root cause diagnosis, define bounded 'How Might We' problem statements, and establish measurable success metrics for Week 1 Quality Gate.",
    required_evidence: "Complete Business Diagnosis & Problem Framing Pack ready for mentor defense.",
    sections: [
      "1. Executive Problem Framing Statement",
      "2. Root Cause Analysis (5-Whys / Fishbone)",
      "3. Bounded Scope & Out-of-Scope Constraints",
      "4. Target Measurable Impact & Key Results",
    ],
  },

  // Week 2
  {
    id: "t-5",
    week_number: 2,
    session_number: 4,
    name: "Industry Benchmark & Analogy Sheet",
    type: "Core Template",
    status: "ready",
    description: "Analyse analogous solutions from adjacent industries and evaluate existing competitive responses.",
    required_evidence: "Comparative matrix of 3 analogous industry solutions with key takeaways.",
    sections: [
      "1. Analogous Industry Precedents",
      "2. Competitive Landscape & Defensibility",
      "3. Architectural Analogies & Transferable Mechanics",
    ],
  },
  {
    id: "t-6",
    week_number: 2,
    session_number: 5,
    name: "What Would Have To Be True (WWHTBT) Matrix",
    type: "Core Template",
    status: "ready",
    description: "Reverse-engineer strategic possibilities by isolating the barriers to belief that must hold true for each option to succeed.",
    required_evidence: "WWHTBT matrix across customer, company, competitor, and economic dimensions.",
    sections: [
      "1. Possibility Hypotheses (3 Distinct Options)",
      "2. Customer & User Conditions",
      "3. Technical & Operational Feasibility",
      "4. Commercial & Cost Model Viability",
    ],
  },
  {
    id: "t-7",
    week_number: 2,
    session_number: 6,
    name: "Strategic Choice & Tradeoff Pack",
    type: "Quality Gate Pack",
    status: "gate",
    description: "Present defensible strategic choices, document trade-offs, and recommend the primary architecture for Week 2 Quality Gate.",
    required_evidence: "Strategic Possibility & Choice Pack with formal mentor sign-off.",
    sections: [
      "1. Possibility Evaluation Scorecard",
      "2. Explicit Tradeoffs & Concessions",
      "3. Selected Strategic Direction & Rationale",
      "4. Risk Profile & Critical Path Dependencies",
    ],
  },

  // Week 3
  {
    id: "t-8",
    week_number: 3,
    session_number: 7,
    name: "Strategy & Architecture Blueprint",
    type: "Core Template",
    status: "ready",
    description: "Architect the solution topology, data pipelines, user touchpoints, and integration contracts.",
    required_evidence: "System architecture diagram and operational blueprint.",
    sections: [
      "1. System Architecture & Topology",
      "2. Data Flows & Integration Points",
      "3. User Journey & Touchpoint Architecture",
    ],
  },
  {
    id: "t-9",
    week_number: 3,
    session_number: 8,
    name: "Risk Assessment & Mitigation Matrix",
    type: "Core Template",
    status: "ready",
    description: "Categorise technical, regulatory, and adoption risks with proactive mitigations and fallback protocols.",
    required_evidence: "Risk log mapped with severity, likelihood, and mitigation owners.",
    sections: [
      "1. Technical & Engineering Risks",
      "2. Adoption & Change Management Risks",
      "3. Regulatory & Compliance Mitigations",
    ],
  },
  {
    id: "t-10",
    week_number: 3,
    session_number: 9,
    name: "Strategy & Execution Blueprint Pack",
    type: "Quality Gate Pack",
    status: "gate",
    description: "Consolidate the full strategic blueprint and phase-gated execution plan for Week 3 Quality Gate.",
    required_evidence: "Strategy & Execution Blueprint ready for Faculty & Mentor Panel review.",
    sections: [
      "1. Architectural Blueprint",
      "2. 90-Day Execution Roadmap",
      "3. Resource & Capability Requirements",
      "4. Quality Gate Deliverable Pack",
    ],
  },

  // Week 4
  {
    id: "t-11",
    week_number: 4,
    session_number: 10,
    name: "Financial Impact & ROI Model",
    type: "Core Template",
    status: "ready",
    description: "Model the financial return, unit economics, payback schedule, and cost of inaction for executive sponsors.",
    required_evidence: "Financial model with conservative, base, and aggressive cases.",
    sections: [
      "1. Cost Structure & Implementation Capex/Opex",
      "2. Direct & Indirect Value Creation",
      "3. 3-Year ROI & Payback Estimation",
    ],
  },
  {
    id: "t-12",
    week_number: 4,
    session_number: 11,
    name: "Executive Deck Storyboard & Narrative Arch",
    type: "Core Template",
    status: "ready",
    description: "Structure the final board-ready pitch deck using the Pyramid Principle and persuasive storytelling.",
    required_evidence: "10-slide storyboard outline with supporting charts and quotes.",
    sections: [
      "1. Situation & Complication",
      "2. Diagnostic Proof & Friction",
      "3. Proposed Solution & Architecture",
      "4. Business Case & Call to Action",
    ],
  },
  {
    id: "t-13",
    week_number: 4,
    session_number: 12,
    name: "Final Executive Proposal & Portfolio",
    type: "Quality Gate Pack",
    status: "gate",
    description: "Graduation Gate: Final Executive Portfolio and Strategic Presentation for Enterprise Leadership.",
    required_evidence: "Full Fellowship Capstone Dossier & Presentation Deck.",
    sections: [
      "1. Executive Summary",
      "2. Discovery Evidence Synthesis",
      "3. Strategic Choice & Blueprint",
      "4. Implementation Roadmap & Financial Case",
    ],
  },
];

const LIVING_MASTERS = [
  {
    id: "od-1",
    name: "Living Evidence & Unknowns Log",
    type: "Continuous Dossier",
    scope: "Weeks 1–4 Ongoing",
    description: "Central repository of all primary interviews, stakeholder quotes, secondary research datasets, and hypothesis validation logs.",
  },
  {
    id: "od-2",
    name: "Master Decision & Tradeoff Record",
    type: "Continuous Dossier",
    scope: "Weeks 1–4 Ongoing",
    description: "Chronological log of critical strategic forks, evaluated alternatives, concessions, and team consensus rationale.",
  },
  {
    id: "od-3",
    name: "Executive Summary & Working Portfolio",
    type: "Continuous Dossier",
    scope: "Weeks 1–4 Ongoing",
    description: "The cumulative single source of truth updated after each quality gate to represent the squad's validated solution.",
  },
];

function TemplatesContent() {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");
  const initialWeek = weekParam ? Number(weekParam) : "all";

  const [activeTab, setActiveTab] = useState<number | "all" | "living">(
    !isNaN(Number(initialWeek)) && Number(initialWeek) >= 1 && Number(initialWeek) <= 4
      ? (Number(initialWeek) as number)
      : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStudentDashboard()
      .then((data) => setDashboardData(data))
      .catch(() => { });
  }, []);

  // Sync tab if URL changes
  useEffect(() => {
    if (weekParam && !isNaN(Number(weekParam))) {
      setActiveTab(Number(weekParam));
    }
  }, [weekParam]);

  const filteredTemplates = useMemo(() => {
    return DEFAULT_TEMPLATES.filter((tpl) => {
      const matchesWeek = activeTab === "all" || tpl.week_number === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.required_evidence.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesWeek && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const handleCopyMarkdown = (tpl: any) => {
    const md = `# ${tpl.name}
**Fellowship Track:** Discover (Phase 1)
**Week:** ${tpl.week_number} | **Session:** ${tpl.session_number}
**Template Type:** ${tpl.type}

## Purpose & Scope
${tpl.description}

## Required Working Evidence
${tpl.required_evidence}

## Document Structure & Key Sections
${tpl.sections.map((s: string) => `### ${s}\n[Enter team working notes, primary evidence, and findings here...]\n`).join("\n")}

---
*Created by DegreeLabs Impact Fellowship (DLIF)*
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = (tpl: any) => {
    const md = `# ${tpl.name}
**Fellowship Track:** Discover (Phase 1)
**Week:** ${tpl.week_number} | **Session:** ${tpl.session_number}
**Template Type:** ${tpl.type}

## Purpose & Scope
${tpl.description}

## Required Working Evidence
${tpl.required_evidence}

## Document Structure & Key Sections
${tpl.sections.map((s: string) => `### ${s}\n[Enter team working notes, primary evidence, and findings here...]\n`).join("\n")}

---
*DegreeLabs Impact Fellowship (DLIF)*
`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-template.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const currentWeekNumber = dashboardData?.team?.current_week || 1;

  return (
    <div className="page-container">
      <PageHeader
        breadcrumbs={
          <div className="flex items-center gap-2">
            <Link
              href="/student"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-semibold text-brand-600">Curriculum Templates</span>
          </div>
        }
        title="Session Templates & Evidence Dossiers"
        subtitle="Official DegreeLabs frameworks, diagnostic sheets, and strategy artifacts for each session."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/student/materials"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span>Materials Library</span>
            </Link>
            <Link
              href="/student/submissions"
              className="btn-gradient-primary !py-2 !px-3.5 !text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Evidence</span>
            </Link>
          </div>
        }
      />

      {/* ── Search & Filter Controls ── */}
      <div className="card-custom flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3">
        {/* Week Filter Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Weeks (12)
          </button>
          {[1, 2, 3, 4].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setActiveTab(w as number)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === w
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>Week {w}</span>
              {w === currentWeekNumber && (
                <span className="rounded-full bg-amber-400 px-1 text-[9px] font-black text-amber-950">
                  Current
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveTab("living")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "living"
                ? "bg-brand-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Living Masters (3)
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates or evidence…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* ── Active Week Context Banner ── */}
      {typeof activeTab === "number" && (
        <div className="card-custom !p-4 bg-gradient-to-r from-violet-50/80 via-violet-50/40 to-white border-violet-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-block rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800 border border-violet-300">
                Week {activeTab} of 4 Focus
              </span>
              <h2 className="mt-1 text-sm font-bold text-slate-900">
                {activeTab === 1 && "Discover the Real Problem — 'What is really happening here?'"}
                {activeTab === 2 && "Create Strategic Possibilities — 'What could we choose to do?'"}
                {activeTab === 3 && "Design the Strategy — 'If this is our choice, how will it work?'"}
                {activeTab === 4 && "Build the Case for Action — 'Why should the company believe us?'"}
              </h2>
            </div>
            <Link
              href={`/student/submissions?week=${activeTab}`}
              className="btn-gradient-primary !py-1.5 !px-3 !text-xs self-start sm:self-center"
            >
              <Send className="h-3 w-3" />
              <span>Turn in Week {activeTab} Output</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Living Masters Section ── */}
      {(activeTab === "living" || activeTab === "all") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>Living Master Dossiers (Continuous Weeks 1–4)</span>
            </h2>
            <span className="text-xs text-slate-500">Maintained across all sprints</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LIVING_MASTERS.map((lm) => (
              <div
                key={lm.id}
                className="card-custom flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="status-pill badge-purple">
                      {lm.type}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{lm.scope}</span>
                  </div>
                  <h3 className="card-title mb-1">{lm.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{lm.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Team Repository</span>
                  <Link
                    href="/student/team"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    <span>Open in Workspace</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Core Session Templates Grid ── */}
      {activeTab !== "living" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-brand-600" />
              <span>Session Working Evidence Templates</span>
            </h2>
            <span className="text-xs text-slate-500">
              Showing {filteredTemplates.length} template(s)
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="empty-state">
              <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No templates match your criteria</p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-bold text-brand-600 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((tpl) => {
                const isGate = tpl.type === "Quality Gate Pack";
                return (
                  <div
                    key={tpl.id}
                    className={`card-custom flex flex-col justify-between ${
                      isGate ? "border-amber-300 bg-amber-50/20" : ""
                    }`}
                  >
                    <div>
                      {/* Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Week {tpl.week_number} • Session {tpl.session_number}
                        </span>
                        <span
                          className={`status-pill ${
                            isGate ? "badge-warning" : "badge-primary"
                          }`}
                        >
                          {isGate && <ShieldCheck className="h-3 w-3 mr-1" />}
                          {tpl.type}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="card-title mb-1.5 leading-snug">
                        {tpl.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                        {tpl.description}
                      </p>

                      {/* Evidence Tag */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-[11px] text-slate-700 space-y-1">
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Required Output:</span>
                        </p>
                        <p className="text-slate-600 leading-normal line-clamp-2">{tpl.required_evidence}</p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(tpl)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadMarkdown(tpl)}
                          title="Download starter markdown"
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>.md</span>
                        </button>
                        <Link
                          href={`/student/submissions?task=${tpl.id}`}
                          title="Submit evidence for this session"
                          className="btn-gradient-primary !py-1.5 !px-2.5 !text-xs"
                        >
                          <Send className="h-3 w-3" />
                          <span>Turn in</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Template Spec Modal ── */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Week {selectedTemplate.week_number} • Session {selectedTemplate.session_number}
                    </span>
                    <span className="status-pill badge-primary">
                      {selectedTemplate.type}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedTemplate.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Scope &amp; Intent
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedTemplate.description}
                </p>
              </div>

              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5 text-xs text-brand-900">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-700" />
                  Required Working Evidence
                </p>
                <p className="text-slate-700 leading-relaxed">
                  {selectedTemplate.required_evidence}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Recommended Dossier Structure
                </h3>
                <div className="space-y-1.5">
                  {selectedTemplate.sections?.map((sec: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <span>{sec.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => handleCopyMarkdown(selectedTemplate)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied Starter!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadMarkdown(selectedTemplate)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .md</span>
                </button>
                <Link
                  href={`/student/submissions?task=${selectedTemplate.id}`}
                  className="btn-gradient-primary !py-2 !px-3.5 !text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Work</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-600 border-t-transparent" />
            <span className="font-medium text-slate-700">Loading Session Templates…</span>
          </div>
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
