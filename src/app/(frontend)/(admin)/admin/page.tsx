// src/app/(admin)/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Video, ClipboardList, Users, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

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
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-40 bg-muted-bg animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted text-sm mt-1">Platform-wide summary and recent activity.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5 text-primary" />} label="Series" value={stats.totalSeries} bg="bg-primary/10" />
        <StatCard icon={<Video className="w-5 h-5 text-info" />} label="Videos" value={stats.totalVideos} bg="bg-info/10" />
        <StatCard icon={<Users className="w-5 h-5 text-success" />} label="Employees" value={stats.totalEmployees} bg="bg-success/10" />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-warning" />} label="Exams" value={stats.totalExams} bg="bg-warning/10" />
      </div>

      {/* Secondary stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide font-semibold">Total Attempts</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.totalAttempts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide font-semibold">Pass Rate</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.passRate}%</p>
          <div className="mt-2 h-1.5 bg-muted-bg rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${stats.passRate}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide font-semibold">Total Modules</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.totalModules}</p>
        </div>
      </div>

      {/* Recent attempts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted" />
            Recent Exam Attempts
          </h2>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Exam</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Score</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((a) => (
                <tr key={a.id} className="hover:bg-muted-bg/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{a.employeeName}</td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell truncate max-w-45">{a.examTitle}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{a.score}%</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {a.passed ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted text-xs hidden lg:table-cell">
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
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}): React.ReactNode {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
