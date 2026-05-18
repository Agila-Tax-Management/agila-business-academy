// src/app/(frontend)/(admin)/admin/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight,
  BarChart3, ClipboardEdit, User,
} from "lucide-react";
import Card from "@/components/UI/Card";
import { useToast } from "@/context/ToastContext";
import GradeModal from "./components/GradeModal";
import type { AttemptItem } from "@/app/(backend)/api/attempts/route";

type ScopeFilter = "ALL" | "VIDEO" | "MODULE" | "SERIES";

const SCOPE_STYLES: Record<string, string> = {
  VIDEO:  "bg-info/10 text-info",
  MODULE: "bg-warning/10 text-warning",
  SERIES: "bg-primary/10 text-primary",
};

interface LearnerGroup {
  email: string;
  name: string;
  image: string | null;
  attempts: AttemptItem[];
}

export default function AdminResultsPage(): React.ReactNode {
  const { error } = useToast();

  const [results, setResults]             = useState<AttemptItem[]>([]);
  const [search, setSearch]               = useState("");
  const [scopeFilter, setScopeFilter]     = useState<ScopeFilter>("ALL");
  const [passFilter, setPassFilter]       = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [reviewFilter, setReviewFilter]   = useState<"ALL" | "PENDING">("ALL");
  const [loading, setLoading]             = useState(true);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null);

  function fetchResults() {
    setLoading(true);
    fetch("/api/attempts")
      .then((r) => r.json())
      .then((d: { data?: AttemptItem[] }) => { setResults(d.data ?? []); })
      .catch(() => { error("Load failed", "Could not load exam results."); })
      .finally(() => { setLoading(false); });
  }
  useEffect(() => { fetchResults(); }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingCount  = results.filter((r) => r.hasPendingReview).length;
  const totalPassed   = results.filter((r) => r.passed).length;
  const passRate      = results.length > 0 ? Math.round((totalPassed / results.length) * 100) : 0;

  // Group by learner
  const groupMap = new Map<string, LearnerGroup>();
  for (const r of results) {
    const key = r.employeeEmail;
    if (!groupMap.has(key)) groupMap.set(key, { email: r.employeeEmail, name: r.employeeName, image: r.employeeImage, attempts: [] });
    groupMap.get(key)!.attempts.push(r);
  }

  // Apply filters to each group's attempts
  const filteredGroups: (LearnerGroup & { filteredAttempts: AttemptItem[] })[] = [];
  for (const group of groupMap.values()) {
    const matchesSearch =
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      group.email.toLowerCase().includes(search.toLowerCase()) ||
      group.attempts.some((a) => a.examTitle.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) continue;

    const filteredAttempts = group.attempts.filter((a) => {
      const matchScope  = scopeFilter  === "ALL" || a.scope === scopeFilter;
      const matchPass   = passFilter   === "ALL" || (passFilter === "PASSED" ? a.passed : !a.passed);
      const matchReview = reviewFilter === "ALL" || a.hasPendingReview;
      return matchScope && matchPass && matchReview;
    });

    if (filteredAttempts.length === 0) continue;
    filteredGroups.push({ ...group, filteredAttempts });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
        <p className="text-muted text-sm mt-1">Browse results by learner. Click a learner to see their exams.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          {loading ? <div className="h-8 w-12 bg-muted/20 rounded-lg animate-pulse mx-auto mb-1" /> : <p className="text-2xl font-bold text-foreground">{results.length}</p>}
          <p className="text-xs text-muted mt-0.5">Total Attempts</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          {loading ? <div className="h-8 w-12 bg-muted/20 rounded-lg animate-pulse mx-auto mb-1" /> : <p className="text-2xl font-bold text-success">{totalPassed}</p>}
          <p className="text-xs text-muted mt-0.5">Passed</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-4 h-4 text-danger" />
          </div>
          {loading ? <div className="h-8 w-12 bg-muted/20 rounded-lg animate-pulse mx-auto mb-1" /> : <p className="text-2xl font-bold text-danger">{results.length - totalPassed}</p>}
          <p className="text-xs text-muted mt-0.5">Failed</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-2">
            <ClipboardEdit className="w-4 h-4 text-warning" />
          </div>
          {loading ? <div className="h-8 w-12 bg-muted/20 rounded-lg animate-pulse mx-auto mb-1" /> : <p className="text-2xl font-bold text-warning">{pendingCount}</p>}
          <p className="text-xs text-muted mt-0.5">Pending Review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by employee or exam…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
            className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
          >
            <option value="ALL">All Scopes</option>
            <option value="VIDEO">Content</option>
            <option value="MODULE">Module</option>
            <option value="SERIES">Series</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={passFilter}
            onChange={(e) => setPassFilter(e.target.value as "ALL" | "PASSED" | "FAILED")}
            className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
          >
            <option value="ALL">All Results</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as "ALL" | "PENDING")}
            className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Needs Review</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Learner list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No results found</p>
          <p className="text-xs text-muted">Try adjusting your filters or search.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((group) => {
            const isOpen    = expandedLearner === group.email;
            const passed    = group.filteredAttempts.filter((a) => a.passed).length;
            const pending   = group.filteredAttempts.filter((a) => a.hasPendingReview).length;
            const rate      = Math.round((passed / group.filteredAttempts.length) * 100);

            return (
              <Card key={group.email} className="overflow-hidden">
                {/* Learner header row */}
                <button
                  type="button"
                  onClick={() => setExpandedLearner(isOpen ? null : group.email)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/40 transition-colors text-left"
                >
                  {/* Avatar */}
                  {group.image ? (
                    <Image
                      src={group.image}
                      alt={group.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {group.name[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  {/* Name / email */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{group.name}</p>
                    <p className="text-xs text-muted truncate">{group.email}</p>
                  </div>
                  {/* Stats chips */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted bg-muted-bg px-2.5 py-1 rounded-full">
                      {group.filteredAttempts.length} attempt{group.filteredAttempts.length !== 1 ? "s" : ""}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rate >= 75 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                      {rate}% pass rate
                    </span>
                    {pending > 0 && (
                      <span className="text-xs font-semibold bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                        {pending} review{pending !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {/* Chevron */}
                  <div className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </button>

                {/* Expanded attempts */}
                {isOpen && (
                  <div className="border-t border-white/30">
                    <table className="w-full text-sm">
                      <thead className="border-b border-white/20">
                        <tr>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Exam</th>
                          <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Scope</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Score</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Attempt</th>
                          <th className="text-right px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
                          <th className="text-center px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {group.filteredAttempts.map((a) => (
                          <tr key={a.id} className="hover:bg-white/20 transition-colors">
                            <td className="px-5 py-3 text-foreground font-medium">{a.examTitle}</td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SCOPE_STYLES[a.scope]}`}>
                                {a.scope.charAt(0) + a.scope.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-foreground">{a.score}%</td>
                            <td className="px-5 py-3 text-center">
                              {a.passed ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-medium">
                                  <CheckCircle2 className="w-3 h-3" />Passed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2.5 py-1 rounded-full font-medium">
                                  <XCircle className="w-3 h-3" />Failed
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center text-muted hidden lg:table-cell">#{a.attemptNumber}</td>
                            <td className="px-5 py-3 text-right text-muted text-xs hidden lg:table-cell">
                              <span className="inline-flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {a.hasPendingReview ? (
                                <button
                                  type="button"
                                  onClick={() => setReviewAttemptId(a.id)}
                                  className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning border border-warning/30 px-2.5 py-1 rounded-full font-semibold hover:bg-warning/20 transition-colors"
                                >
                                  <ClipboardEdit className="w-3 h-3" />Review
                                </button>
                              ) : (
                                <span className="text-xs text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pass rate footer note */}
      {!loading && results.length > 0 && (
        <p className="text-xs text-muted text-center">
          Overall pass rate: <span className="font-semibold text-foreground">{passRate}%</span> across {groupMap.size} learner{groupMap.size !== 1 ? "s" : ""}
        </p>
      )}

      <GradeModal
        attemptId={reviewAttemptId}
        onClose={() => setReviewAttemptId(null)}
        onSaved={() => fetchResults()}
      />
    </div>
  );
}

