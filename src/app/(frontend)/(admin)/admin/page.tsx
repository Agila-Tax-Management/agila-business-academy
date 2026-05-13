// src/app/(frontend)/(admin)/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Video, ClipboardList, Users, TrendingUp, CheckCircle2, XCircle, Clock, Layers, BarChart3 } from "lucide-react";
import Card from "@/components/UI/Card";
import ProgressBar from "@/components/UI/ProgressBar";

interface AdminStats {
  totalSeries: number;
  totalModules: number;
  totalVideos: number;
  totalEmployees: number;
  totalExams: number;
  totalAttempts: number;
  passRate: number;
}

interface RecentAttempt {
  id: string;
  employeeName: string;
  examTitle: string;
  score: number;
  passed: boolean;
  submittedAt: string;
}

const MOCK_STATS: AdminStats = {
  totalSeries: 3,
  totalModules: 5,
  totalVideos: 9,
  totalEmployees: 3,
  totalExams: 3,
  totalAttempts: 12,
  passRate: 75,
};

const MOCK_RECENT: RecentAttempt[] = [
  { id: "1", employeeName: "Juan dela Cruz", examTitle: "Company Policies Quiz", score: 90, passed: true, submittedAt: "2026-05-07T09:15:00Z" },
  { id: "2", employeeName: "Maria Santos", examTitle: "Safety Procedures", score: 60, passed: false, submittedAt: "2026-05-07T08:40:00Z" },
  { id: "3", employeeName: "Carlo Reyes", examTitle: "Company Policies Quiz", score: 85, passed: true, submittedAt: "2026-05-06T16:20:00Z" },
  { id: "4", employeeName: "Juan dela Cruz", examTitle: "Onboarding Series Final", score: 80, passed: true, submittedAt: "2026-05-06T14:00:00Z" },
  { id: "5", employeeName: "Maria Santos", examTitle: "Leadership Module 1", score: 70, passed: false, submittedAt: "2026-05-05T11:30:00Z" },
];

export default function AdminOverviewPage(): React.ReactNode {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API calls
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setRecent(MOCK_RECENT);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-fade-up">
        <div className="h-8 w-40 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Admin Overview</h1>
        <p className="text-muted text-sm mt-1">Platform-wide summary and recent activity.</p>
      </div>

      {/* ── Primary stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,     label: "Series",    value: stats.totalSeries,    color: "text-indigo-500",  bg: "bg-indigo-100/80"  },
          { icon: Video,        label: "Videos",    value: stats.totalVideos,    color: "text-sky-500",     bg: "bg-sky-100/80"     },
          { icon: Users,        label: "Employees", value: stats.totalEmployees, color: "text-emerald-500", bg: "bg-emerald-100/80" },
          { icon: ClipboardList,label: "Exams",     value: stats.totalExams,     color: "text-amber-500",   bg: "bg-amber-100/80"   },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted">{label}</p>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Secondary stats ──────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-100/80 text-rose-500 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-semibold">Total Attempts</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.totalAttempts}</p>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <p className="text-xs text-muted uppercase tracking-wide font-semibold">Pass Rate</p>
          <p className="text-2xl font-extrabold text-foreground">{stats.passRate}%</p>
          <ProgressBar value={stats.passRate} size="sm" />
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-violet-100/80 text-violet-500 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide font-semibold">Total Modules</p>
            <p className="text-2xl font-extrabold text-foreground">{stats.totalModules}</p>
          </div>
        </Card>
      </div>

      {/* ── Recent attempts ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Recent Exam Attempts</h2>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/40">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden sm:table-cell">Exam</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide">Score</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30">
                {recent.map((a) => (
                  <tr key={a.id} className="hover:bg-white/20 transition-colors">
                    <td className="px-5 py-3 font-semibold text-foreground">{a.employeeName}</td>
                    <td className="px-5 py-3 text-muted hidden sm:table-cell truncate max-w-xs">{a.examTitle}</td>
                    <td className="px-5 py-3 text-center font-bold text-foreground">{a.score}%</td>
                    <td className="px-5 py-3 text-center hidden md:table-cell">
                      {a.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-rose-100/80 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-muted text-xs hidden lg:table-cell">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(a.submittedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
