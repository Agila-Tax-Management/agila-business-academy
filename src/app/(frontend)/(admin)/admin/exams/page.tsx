// src/app/(admin)/admin/exams/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, ClipboardList, ChevronDown } from "lucide-react";

type ExamScope = "VIDEO" | "MODULE" | "SERIES";

interface Exam {
  id: string;
  title: string;
  scope: ExamScope;
  linkedTo: string;
  questionCount: number;
  passingScore: number;
  maxAttempts: number;
  createdAt: string;
}

const MOCK: Exam[] = [
  { id: "1", title: "Company Policies Quiz", scope: "VIDEO", linkedTo: "Introduction to Company Policies", questionCount: 10, passingScore: 75, maxAttempts: 3, createdAt: "2026-04-20" },
  { id: "2", title: "Employee Benefits Assessment", scope: "MODULE", linkedTo: "Company Overview Module", questionCount: 8, passingScore: 75, maxAttempts: 2, createdAt: "2026-04-21" },
  { id: "3", title: "Onboarding Final Exam", scope: "SERIES", linkedTo: "New Employee Onboarding", questionCount: 20, passingScore: 80, maxAttempts: 1, createdAt: "2026-04-22" },
];

const SCOPE_COLORS: Record<ExamScope, string> = {
  VIDEO: "bg-info/10 text-info",
  MODULE: "bg-warning/10 text-warning",
  SERIES: "bg-primary/10 text-primary",
};

export default function AdminExamsPage(): React.ReactNode {
  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ExamScope | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call to GET /api/exams
    const timer = setTimeout(() => {
      setExams(MOCK);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = exams.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.linkedTo.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === "ALL" || e.scope === scopeFilter;
    return matchSearch && matchScope;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted text-sm mt-1">Manage exam questions for videos, modules, and series.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0">
          <Plus className="w-4 h-4" />
          New Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ExamScope | "ALL")}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            <option value="ALL">All Scopes</option>
            <option value="VIDEO">Video</option>
            <option value="MODULE">Module</option>
            <option value="SERIES">Series</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-10 h-10 text-muted mb-3" />
          <p className="text-sm font-medium text-foreground">No exams found</p>
          <p className="text-xs text-muted mt-1">Try adjusting your search or create a new exam.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Exam Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Scope</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Linked To</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Questions</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Pass Score</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Attempts</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((exam) => (
                <tr key={exam.id} className="hover:bg-muted-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{exam.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SCOPE_COLORS[exam.scope]}`}>
                      {exam.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs hidden md:table-cell truncate max-w-50">{exam.linkedTo}</td>
                  <td className="px-4 py-3 text-center text-foreground font-medium">{exam.questionCount}</td>
                  <td className="px-4 py-3 text-center text-muted hidden lg:table-cell">{exam.passingScore}%</td>
                  <td className="px-4 py-3 text-center text-muted hidden lg:table-cell">
                    {exam.maxAttempts === 0 ? "Unlimited" : exam.maxAttempts}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
