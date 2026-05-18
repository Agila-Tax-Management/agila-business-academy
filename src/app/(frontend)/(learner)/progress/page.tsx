// src/app/(frontend)/(learner)/progress/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock, Trophy, TrendingUp, Video, XCircle } from "lucide-react";
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
        <div className="h-36 skeleton rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, series } = data;

  const overallPct = series.length > 0
    ? Math.round(series.reduce((acc, s) => {
        const pct = s.totalModules > 0 ? (s.completedModules / s.totalModules) * 100 : 0;
        return acc + pct;
      }, 0) / series.length)
    : 0;

  const heroR    = 36;
  const heroCirc = 2 * Math.PI * heroR;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto animate-fade-up">

      {/* ── Hero banner ──────────────────────────────────────── */}
      <div className="gradient-bg rounded-3xl p-6 lg:p-8 flex items-center justify-between gap-6 shadow-[0_8px_32px_rgba(99,102,241,0.30)] overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 left-32 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">My Progress</h1>
          <p className="text-white/70 text-sm mt-1">Track your learning journey across all enrolled series.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {stats.enrolledSeries} enrolled
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.completedSeries} completed
            </div>
            {stats.avgScore !== null && (
              <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                {stats.avgScore}% avg score
              </div>
            )}
          </div>
        </div>

        {/* Overall ring meter */}
        <div className="shrink-0 hidden sm:flex flex-col items-center gap-1.5 relative z-10">
          <div className="relative">
            <svg width={88} height={88} className="-rotate-90">
              <circle cx={44} cy={44} r={heroR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <circle
                cx={44} cy={44} r={heroR} fill="none"
                stroke="white" strokeWidth="6"
                strokeDasharray={heroCirc}
                strokeDashoffset={heroCirc * (1 - overallPct / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-extrabold text-base">{overallPct}%</span>
            </div>
          </div>
          <p className="text-white/60 text-xs font-medium">Overall</p>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: BookOpen,     label: "Enrolled",     value: stats.enrolledSeries,                                    accent: "bg-indigo-400",  text: "text-indigo-500",  iconBg: "bg-indigo-100/80"  },
          { icon: CheckCircle2, label: "Completed",    value: stats.completedSeries,                                   accent: "bg-emerald-400", text: "text-emerald-500", iconBg: "bg-emerald-100/80" },
          { icon: BarChart3,    label: "Modules Done", value: stats.totalModulesCompleted,                             accent: "bg-amber-400",   text: "text-amber-500",   iconBg: "bg-amber-100/80"   },
          { icon: Trophy,       label: "Avg. Score",   value: stats.avgScore !== null ? `${stats.avgScore}%` : "—",   accent: "bg-violet-400",  text: "text-violet-500",  iconBg: "bg-violet-100/80"  },
        ].map(({ icon: Icon, label, value, accent, text, iconBg }) => (
          <Card key={label} className="p-5 overflow-hidden relative flex flex-col gap-3">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${text}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Series progress ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Series Progress</h2>
          </div>
          <span className="text-xs text-muted glass px-2.5 py-0.5 rounded-full">{series.length}</span>
        </div>

        {series.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl glass flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(99,102,241,0.12)]">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground font-semibold text-sm">No series enrolled yet</p>
            <p className="text-muted text-xs mt-1 mb-4">Visit the library to start a learning path.</p>
            <Link href="/library" className="inline-flex items-center gap-1.5 gradient-bg text-white text-xs font-semibold px-4 py-2 rounded-xl shadow hover:opacity-90 transition-opacity">
              Browse Library <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((s) => {
            const modulesPct = s.totalModules > 0 ? Math.round((s.completedModules / s.totalModules) * 100) : 0;
            const videosPct  = s.totalVideos  > 0 ? Math.round((s.watchedVideos  / s.totalVideos)  * 100) : 0;
            const isComplete = s.completedModules === s.totalModules && s.totalModules > 0;
            const isStarted  = s.watchedVideos > 0 || s.completedModules > 0;
            const totalExams = s.examsPassed + s.examsFailed;

            const accentBg  = isComplete ? "bg-emerald-400" : isStarted ? "bg-indigo-400"  : "bg-slate-300";
            const ringStroke= isComplete ? "#10b981"        : isStarted ? "var(--primary)"  : "#94a3b8";
            const pctColor  = isComplete ? "text-emerald-600" : isStarted ? "text-primary"  : "text-muted";

            const ringR    = 22;
            const ringCirc = 2 * Math.PI * ringR;

            return (
              <Card key={s.id} className="overflow-hidden relative flex flex-col">
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBg}`} />

                <div className="p-5 flex flex-col gap-4 pt-6">
                  {/* Header: title + mini ring */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{s.title}</h3>
                      {s.lastActivity ? (
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      ) : (
                        <p className="text-xs text-muted mt-0.5">Not started</p>
                      )}
                    </div>

                    {/* Mini ring */}
                    <div className="shrink-0 flex flex-col items-center gap-0.5">
                      <div className="relative">
                        <svg width={52} height={52} className="-rotate-90">
                          <circle cx={26} cy={26} r={ringR} fill="none" stroke={ringStroke} strokeWidth="4" opacity="0.15" />
                          <circle
                            cx={26} cy={26} r={ringR} fill="none"
                            stroke={ringStroke} strokeWidth="4"
                            strokeDasharray={ringCirc}
                            strokeDashoffset={ringCirc * (1 - modulesPct / 100)}
                            strokeLinecap="round"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-[11px] font-extrabold leading-none ${pctColor}`}>{modulesPct}%</span>
                        </div>
                      </div>
                      {isComplete ? (
                        <span className="text-[10px] text-emerald-600 font-semibold">Complete</span>
                      ) : isStarted ? (
                        <span className="text-[10px] text-primary font-semibold">In Progress</span>
                      ) : (
                        <span className="text-[10px] text-muted font-medium">Not Started</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted">
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Modules</span>
                        <span className="font-medium text-foreground">{s.completedModules} / {s.totalModules}</span>
                      </div>
                      <ProgressBar value={modulesPct} size="sm" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted">
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Videos</span>
                        <span className="font-medium text-foreground">{s.watchedVideos} / {s.totalVideos}</span>
                      </div>
                      <div className="h-1.5 bg-white/40 backdrop-blur-sm rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400 transition-all duration-700" style={{ width: `${videosPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer: exam stats + view link */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    {totalExams > 0 ? (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {s.examsPassed} passed
                        </span>
                        {s.examsFailed > 0 && (
                          <span className="flex items-center gap-1 text-rose-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            {s.examsFailed} failed
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">No exams yet</span>
                    )}
                    <Link href={`/library/${s.id}`} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
