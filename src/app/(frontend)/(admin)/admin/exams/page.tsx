// src/app/(frontend)/(admin)/admin/exams/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, ClipboardList, ChevronDown, Timer } from "lucide-react";
import Card from "@/components/UI/Card";
import { useToast } from "@/context/ToastContext";
import type { ExamItem, ExamScope } from "@/app/(backend)/api/exams/route";
import ExamFormModal from "./components/ExamFormModal";

const SCOPE_STYLES: Record<ExamScope, string> = {
  VIDEO:  "bg-info/10 text-info",
  MODULE: "bg-warning/10 text-warning",
  SERIES: "bg-primary/10 text-primary",
};

export default function AdminExamsPage(): React.ReactNode {
  const { success, error } = useToast();

  const [exams, setExams]             = useState<ExamItem[]>([]);
  const [search, setSearch]           = useState("");
  const [scopeFilter, setScopeFilter] = useState<ExamScope | "ALL">("ALL");
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<ExamItem | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/exams");
      const data = await res.json() as { data?: ExamItem[] };
      setExams(data.data ?? []);
    } catch {
      error("Load failed", "Could not load exams.");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { void fetchExams(); }, [fetchExams]);

  const filtered = exams.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.linkedTo.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === "ALL" || e.scope === scopeFilter;
    return matchSearch && matchScope;
  });

  async function handleDelete(exam: ExamItem) {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    setDeletingId(exam.id);
    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: "DELETE" });
      if (!res.ok) { error("Delete failed", "Could not delete exam."); return; }
      setExams((prev) => prev.filter((e) => e.id !== exam.id));
      success("Exam deleted", `"${exam.title}" has been removed.`);
    } catch {
      error("Delete failed", "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted text-sm mt-1">Manage exam questions for videos, modules, and series.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 gradient-bg hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.30)] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Exam
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Exams",    value: exams.length },
          { label: "Video Exams",    value: exams.filter((e) => e.scope === "VIDEO").length },
          { label: "Module Exams",   value: exams.filter((e) => e.scope === "MODULE").length },
          { label: "Series Exams",   value: exams.filter((e) => e.scope === "SERIES").length },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ExamScope | "ALL")}
            className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
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
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-10 h-10 text-muted mb-3" />
          <p className="text-sm font-medium text-foreground">No exams found</p>
          <p className="text-xs text-muted mt-1">Try adjusting your search or create a new exam.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/30">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Exam Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Scope</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Linked To</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Questions</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Pass %</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Attempts</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">Time</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filtered.map((exam) => (
                  <tr key={exam.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{exam.title}</p>
                      <p className="text-xs text-muted mt-0.5">{new Date(exam.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SCOPE_STYLES[exam.scope]}`}>
                        {exam.scope.charAt(0) + exam.scope.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs hidden md:table-cell max-w-48 truncate">{exam.linkedTo}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-foreground">{exam.questionCount}</td>
                    <td className="px-5 py-3.5 text-center text-muted hidden lg:table-cell">{exam.passingScore}%</td>
                    <td className="px-5 py-3.5 text-center text-muted hidden lg:table-cell">
                      {exam.maxAttempts === 0 ? <span className="text-success text-xs font-medium">Unlimited</span> : exam.maxAttempts}
                    </td>
                    <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                      {exam.timeLimitMin ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Timer className="w-3 h-3" />{exam.timeLimitMin}m
                        </span>
                      ) : (
                        <span className="text-muted/50 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(exam); setShowModal(true); }}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam)}
                          disabled={deletingId === exam.id}
                          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ExamFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initial={editing ?? undefined}
        onSuccess={fetchExams}
      />
    </div>
  );
}
