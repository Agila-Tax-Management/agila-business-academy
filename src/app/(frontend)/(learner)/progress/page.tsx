// src/app/(frontend)/(learner)/progress/page.tsx
"use client";

import { useEffect, useState } from "react";
import { BarChart3, BookOpen, CheckCircle2, Clock, Trophy, TrendingUp } from "lucide-react";
import Card from "@/components/UI/Card";
import ProgressBar from "@/components/UI/ProgressBar";

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
      <div className="p-6 lg:p-8 space-y-6 animate-fade-up">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, series } = data;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">My Progress</h1>
        <p className="text-muted text-sm mt-1">Track your learning journey across all enrolled series.</p>
      </div>

      {/* ── Stats grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,     label: "Enrolled",    value: stats.enrolledSeries,                          color: "text-indigo-500",  bg: "bg-indigo-100/80" },
          { icon: CheckCircle2, label: "Completed",   value: stats.completedSeries,                         color: "text-emerald-500", bg: "bg-emerald-100/80"},
          { icon: BarChart3,    label: "Modules Done",value: stats.totalModulesCompleted,                   color: "text-amber-500",   bg: "bg-amber-100/80"  },
          { icon: Trophy,       label: "Avg. Score",  value: stats.avgScore !== null ? `${stats.avgScore}%` : "—", color: "text-violet-500", bg: "bg-violet-100/80" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-extrabold text-foreground">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Series progress list ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Series Progress</h2>
        </div>

        {series.map((s) => {
          const modulesPct = s.totalModules > 0 ? Math.round((s.completedModules / s.totalModules) * 100) : 0;
          const videosPct  = s.totalVideos  > 0 ? Math.round((s.watchedVideos  / s.totalVideos)  * 100) : 0;
          const isComplete = s.completedModules === s.totalModules && s.totalModules > 0;

          return (
            <Card key={s.id} className="p-5 space-y-4">
              {/* Row 1: title + pct */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground truncate">{s.title}</h3>
                    {isComplete && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
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
                <span className="shrink-0 text-lg font-extrabold text-primary">{modulesPct}%</span>
              </div>

              {/* Module progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>Modules</span>
                  <span className="font-medium text-foreground">{s.completedModules} / {s.totalModules}</span>
                </div>
                <ProgressBar value={modulesPct} size="sm" />
              </div>

              {/* Video progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>Videos watched</span>
                  <span className="font-medium text-foreground">{s.watchedVideos} / {s.totalVideos}</span>
                </div>
                <div className="h-1.5 bg-white/40 backdrop-blur-sm rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all duration-700"
                    style={{ width: `${videosPct}%` }}
                  />
                </div>
              </div>

              {/* Exam stats */}
              {(s.examsPassed + s.examsFailed) > 0 && (
                <div className="flex items-center gap-4 text-xs pt-1 border-t border-white/40">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {s.examsPassed} exam{s.examsPassed !== 1 ? "s" : ""} passed
                  </span>
                  {s.examsFailed > 0 && (
                    <span className="text-rose-500 font-medium">{s.examsFailed} failed</span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
