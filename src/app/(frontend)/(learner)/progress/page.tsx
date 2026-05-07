// src/app/(learner)/progress/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart3, BookOpen, CheckCircle2, Clock, Trophy } from "lucide-react";

interface SeriesProgress {
  id: string;
  title: string;
  thumbnail: string | null;
  totalModules: number;
  completedModules: number;
  totalVideos: number;
  watchedVideos: number;
  lastActivity: string | null;
  examsPassed: number;
  examsFailed: number;
}

interface ProgressData {
  stats: {
    enrolledSeries: number;
    completedSeries: number;
    totalModulesCompleted: number;
    avgScore: number | null;
  };
  series: SeriesProgress[];
}

const MOCK: ProgressData = {
  stats: {
    enrolledSeries: 3,
    completedSeries: 1,
    totalModulesCompleted: 4,
    avgScore: 82,
  },
  series: [
    {
      id: "1",
      title: "New Employee Onboarding",
      thumbnail: null,
      totalModules: 3,
      completedModules: 3,
      totalVideos: 9,
      watchedVideos: 9,
      lastActivity: "2026-05-01",
      examsPassed: 3,
      examsFailed: 0,
    },
    {
      id: "2",
      title: "Safety & Compliance Training",
      thumbnail: null,
      totalModules: 2,
      completedModules: 1,
      totalVideos: 6,
      watchedVideos: 3,
      lastActivity: "2026-05-05",
      examsPassed: 1,
      examsFailed: 1,
    },
    {
      id: "3",
      title: "Leadership Fundamentals",
      thumbnail: null,
      totalModules: 4,
      completedModules: 0,
      totalVideos: 12,
      watchedVideos: 0,
      lastActivity: null,
      examsPassed: 0,
      examsFailed: 0,
    },
  ],
};

export default function ProgressPage(): React.ReactNode {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call to /api/progress
    const timer = setTimeout(() => {
      setData(MOCK);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-48 bg-muted-bg animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, series } = data;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
        <p className="text-muted text-sm mt-1">Track your learning journey across all enrolled series.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          label="Enrolled Series"
          value={stats.enrolledSeries}
          bg="bg-primary/10"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          label="Completed"
          value={stats.completedSeries}
          bg="bg-success/10"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-warning" />}
          label="Modules Done"
          value={stats.totalModulesCompleted}
          bg="bg-warning/10"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-info" />}
          label="Avg. Exam Score"
          value={stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
          bg="bg-info/10"
        />
      </div>

      {/* Series progress list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Series Progress</h2>
        {series.map((s) => {
          const modulesPct = s.totalModules > 0 ? Math.round((s.completedModules / s.totalModules) * 100) : 0;
          const videosPct = s.totalVideos > 0 ? Math.round((s.watchedVideos / s.totalVideos) * 100) : 0;
          const isComplete = s.completedModules === s.totalModules && s.totalModules > 0;

          return (
            <div key={s.id} className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{s.title}</h3>
                    {isComplete && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </span>
                    )}
                  </div>
                  {s.lastActivity && (
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last activity: {new Date(s.lastActivity).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-lg font-bold text-foreground">{modulesPct}%</span>
              </div>

              {/* Module progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>Modules</span>
                  <span>{s.completedModules} / {s.totalModules}</span>
                </div>
                <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${modulesPct}%` }}
                  />
                </div>
              </div>

              {/* Videos progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>Videos watched</span>
                  <span>{s.watchedVideos} / {s.totalVideos}</span>
                </div>
                <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info rounded-full transition-all duration-500"
                    style={{ width: `${videosPct}%` }}
                  />
                </div>
              </div>

              {/* Exam stats */}
              {(s.examsPassed + s.examsFailed) > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {s.examsPassed} exams passed
                  </span>
                  {s.examsFailed > 0 && (
                    <span className="text-danger">{s.examsFailed} failed</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
  value: string | number;
  bg: string;
}): React.ReactNode {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
