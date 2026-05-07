// src/app/(admin)/admin/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";

type ScopeFilter = "ALL" | "VIDEO" | "MODULE" | "SERIES";

interface ExamResult {
  id: string;
  employeeName: string;
  examTitle: string;
  scope: "VIDEO" | "MODULE" | "SERIES";
  score: number;
  passed: boolean;
  submittedAt: string;
  attemptNumber: number;
}

const MOCK: ExamResult[] = [
  { id: "1", employeeName: "Juan dela Cruz", examTitle: "Company Policies Quiz", scope: "VIDEO", score: 90, passed: true, submittedAt: "2026-05-07T09:15:00Z", attemptNumber: 1 },
  { id: "2", employeeName: "Maria Santos", examTitle: "Safety Procedures", scope: "VIDEO", score: 60, passed: false, submittedAt: "2026-05-07T08:40:00Z", attemptNumber: 1 },
  { id: "3", employeeName: "Carlo Reyes", examTitle: "Company Policies Quiz", scope: "VIDEO", score: 85, passed: true, submittedAt: "2026-05-06T16:20:00Z", attemptNumber: 1 },
  { id: "4", employeeName: "Juan dela Cruz", examTitle: "Onboarding Final Exam", scope: "SERIES", score: 80, passed: true, submittedAt: "2026-05-06T14:00:00Z", attemptNumber: 1 },
  { id: "5", employeeName: "Maria Santos", examTitle: "Safety Procedures", scope: "VIDEO", score: 75, passed: true, submittedAt: "2026-05-06T12:00:00Z", attemptNumber: 2 },
  { id: "6", employeeName: "Carlo Reyes", examTitle: "Employee Benefits Assessment", scope: "MODULE", score: 90, passed: true, submittedAt: "2026-05-05T15:00:00Z", attemptNumber: 1 },
  { id: "7", employeeName: "Juan dela Cruz", examTitle: "Employee Benefits Assessment", scope: "MODULE", score: 70, passed: false, submittedAt: "2026-05-05T11:30:00Z", attemptNumber: 1 },
];

const SCOPE_COLORS: Record<string, string> = {
  VIDEO: "bg-info/10 text-info",
  MODULE: "bg-warning/10 text-warning",
  SERIES: "bg-primary/10 text-primary",
};

export default function AdminResultsPage(): React.ReactNode {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [passFilter, setPassFilter] = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call to GET /api/attempts
    const timer = setTimeout(() => {
      setResults(MOCK);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = results.filter((r) => {
    const matchSearch =
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === "ALL" || r.scope === scopeFilter;
    const matchPass = passFilter === "ALL" || (passFilter === "PASSED" ? r.passed : !r.passed);
    return matchSearch && matchScope && matchPass;
  });

  const totalPassed = results.filter((r) => r.passed).length;
  const passRate = results.length > 0 ? Math.round((totalPassed / results.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
        <p className="text-muted text-sm mt-1">All employee exam submissions and scores.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{results.length}</p>
          <p className="text-xs text-muted mt-0.5">Total Attempts</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalPassed}</p>
          <p className="text-xs text-muted mt-0.5">Passed</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-danger">{results.length - totalPassed}</p>
          <p className="text-xs text-muted mt-0.5">Failed</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{passRate}%</p>
          <p className="text-xs text-muted mt-0.5">Pass Rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by employee or exam…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="ALL">All Scopes</option>
            <option value="VIDEO">Video</option>
            <option value="MODULE">Module</option>
            <option value="SERIES">Series</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={passFilter}
            onChange={(e) => setPassFilter(e.target.value as "ALL" | "PASSED" | "FAILED")}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="ALL">All Results</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Exam</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Scope</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Score</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Attempt #</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.employeeName}</td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell truncate max-w-45">{r.examTitle}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SCOPE_COLORS[r.scope]}`}>
                      {r.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{r.score}%</td>
                  <td className="px-4 py-3 text-center">
                    {r.passed ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-muted hidden lg:table-cell">#{r.attemptNumber}</td>
                  <td className="px-4 py-3 text-right text-muted text-xs hidden lg:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted text-sm">No results match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
