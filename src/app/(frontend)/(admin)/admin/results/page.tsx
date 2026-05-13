// src/app/(frontend)/(admin)/admin/results/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle2, XCircle, Clock, ChevronDown, BarChart3 } from "lucide-react";
import Card from "@/components/UI/Card";
import { useToast } from "@/context/ToastContext";
import type { AttemptItem } from "@/app/(backend)/api/attempts/route";

type ScopeFilter = "ALL" | "VIDEO" | "MODULE" | "SERIES";

const SCOPE_STYLES: Record<string, string> = {
  VIDEO:  "bg-info/10 text-info",
  MODULE: "bg-warning/10 text-warning",
  SERIES: "bg-primary/10 text-primary",
};

export default function AdminResultsPage(): React.ReactNode {
  const { error } = useToast();

  const [results, setResults]         = useState<AttemptItem[]>([]);
  const [search, setSearch]           = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [passFilter, setPassFilter]   = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/attempts")
      .then((r) => r.json())
      .then((d: { data?: AttemptItem[] }) => { if (!cancelled) setResults(d.data ?? []); })
      .catch(() => { if (!cancelled) error("Load failed", "Could not load exam results."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [error]);

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{results.length}</p>
          <p className="text-xs text-muted mt-0.5">Total Attempts</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{totalPassed}</p>
          <p className="text-xs text-muted mt-0.5">Passed</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-4 h-4 text-danger" />
          </div>
          <p className="text-2xl font-bold text-danger">{results.length - totalPassed}</p>
          <p className="text-xs text-muted mt-0.5">Failed</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold gradient-text">{passRate}%</p>
          <p className="text-xs text-muted mt-0.5">Pass Rate</p>
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
            className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
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
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/30">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Exam</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Scope</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Score</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Attempt #</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted text-sm">
                      No results match your filters.
                    </td>
                  </tr>
                ) : filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{r.employeeName}</p>
                      <p className="text-xs text-muted">{r.employeeEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs hidden sm:table-cell max-w-48 truncate">{r.examTitle}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SCOPE_STYLES[r.scope]}`}>
                        {r.scope.charAt(0) + r.scope.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-foreground">{r.score}%</td>
                    <td className="px-5 py-3.5 text-center">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2.5 py-1 rounded-full font-medium">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-muted hidden lg:table-cell">#{r.attemptNumber}</td>
                    <td className="px-5 py-3.5 text-right text-muted text-xs hidden lg:table-cell">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
