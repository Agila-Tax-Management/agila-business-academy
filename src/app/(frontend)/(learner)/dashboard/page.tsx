// src/app/(frontend)/(learner)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Clock, Award, ChevronRight, Play,
  TrendingUp, CheckCircle2, AlertCircle, Sunrise,
  Sun, Sunset, Moon, Zap, Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import ProgressBar from "@/components/UI/ProgressBar";

interface EnrolledSeries {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  progress: number;
  totalModules: number;
  completedModules: number;
  lastWatchedAt: string | null;
  hasPendingExam: boolean;
}

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function getGreeting(): { text: string; Icon: React.ElementType } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning",   Icon: Sunrise };
  if (h < 17) return { text: "Good afternoon", Icon: Sun    };
  if (h < 20) return { text: "Good evening",   Icon: Sunset };
  return             { text: "Good night",      Icon: Moon   };
}

/* ── Circular progress ring ──────────────────────────────────────── */
function RingProgress({ value, size = 72 }: { value: number; size?: number }) {
  const r     = (size - 8) / 2;
  const circ  = 2 * Math.PI * r;
  const fill  = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="white" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function DashboardPage(): React.ReactNode {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState<EnrolledSeries[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/progress/dashboard")
      .then((r) => r.json())
      .then((data) => { if (data.data) setEnrolled(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inProgress   = enrolled.filter((s) => s.progress > 0 && s.progress < 100);
  const notStarted   = enrolled.filter((s) => s.progress === 0);
  const completed    = enrolled.filter((s) => s.progress === 100);
  const pendingExams = enrolled.filter((s) => s.hasPendingExam);
  const overallPct   = enrolled.length
    ? Math.round(enrolled.reduce((a, s) => a + s.progress, 0) / enrolled.length)
    : 0;

  const { text: greetingText, Icon: GreetingIcon } = getGreeting();

  /* loading skeleton */
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-up">
        <div className="h-48 rounded-3xl skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-up">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl gradient-bg px-8 py-8 shadow-[0_8px_40px_rgba(99,102,241,0.35)]">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/8 blur-xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 h-32 w-32 rounded-full bg-white/5 blur-lg" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-white/70 text-sm">
              <GreetingIcon className="w-4 h-4" />
              <span>{formatDate()}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              {greetingText},{" "}
              <span className="text-white/90">{user?.name?.split(" ")[0] ?? "there"}</span>
            </h1>
            <p className="mt-2 text-white/70 text-sm max-w-md">
              {inProgress.length > 0
                ? `You have ${inProgress.length} course${inProgress.length > 1 ? "s" : ""} in progress. Keep the momentum!`
                : enrolled.length > 0
                ? "Courses are waiting. Start one today!"
                : "Your learning journey begins here. Explore the library."}
            </p>

            {/* Overall progress */}
            {enrolled.length > 0 && (
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
                  <span>Overall progress</span>
                  <span className="font-bold text-white">{overallPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            {inProgress.length > 0 && (
              <Link
                href={`/library/${inProgress[0].id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-primary font-semibold text-sm px-5 py-2.5 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <Play className="w-4 h-4 fill-primary" />
                Continue Learning
              </Link>
            )}
          </div>

          {/* Ring meter */}
          {enrolled.length > 0 && (
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="relative">
                <RingProgress value={overallPct} size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{overallPct}%</span>
                </div>
              </div>
              <span className="text-white/60 text-xs">completion</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Pending exam alert ────────────────────────────────── */}
      {pendingExams.length > 0 && (
        <div className="glass flex items-start gap-3 rounded-2xl px-5 py-4 border-l-4 border-l-warning">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {pendingExams.length} exam{pendingExams.length > 1 ? "s" : ""} pending
            </p>
            <p className="text-xs text-muted mt-0.5 truncate">
              {pendingExams.map((s) => s.title).join(" · ")}
            </p>
          </div>
          <Link href="/library" className="shrink-0 text-xs font-bold text-warning hover:underline">
            View
          </Link>
        </div>
      )}

      {/* ── Stats grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled",      value: enrolled.length,      icon: BookOpen,      color: "text-indigo-500",  bg: "bg-indigo-100/80" },
          { label: "In Progress",   value: inProgress.length,    icon: Clock,         color: "text-amber-500",   bg: "bg-amber-100/80"  },
          { label: "Completed",     value: completed.length,     icon: TrendingUp,    color: "text-emerald-500", bg: "bg-emerald-100/80"},
          { label: "Pending Exams", value: pendingExams.length,  icon: AlertCircle,   color: "text-rose-500",    bg: "bg-rose-100/80"   },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-5 flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Continue Learning ─────────────────────────────────── */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Continue Learning</h2>
            </div>
            <Link href="/library" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-thin">
            {inProgress.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`} className="shrink-0 w-60 snap-start group">
                <Card hover className="overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-linear-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/80 shadow flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Play className="w-5 h-5 text-primary fill-primary ml-0.5" />
                    </div>
                    {s.hasPendingExam && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="warning">Exam due</Badge>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{s.title}</p>
                    <p className="text-xs text-muted mb-3">{s.completedModules}/{s.totalModules} modules</p>
                    <ProgressBar value={s.progress} size="sm" showLabel />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Not Started ───────────────────────────────────────── */}
      {notStarted.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Assigned to You</h2>
            </div>
            <span className="text-xs text-muted glass px-2.5 py-0.5 rounded-full">{notStarted.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notStarted.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`} className="group">
                <Card hover className="overflow-hidden">
                  <div className="h-28 bg-linear-to-br from-slate-50/80 to-indigo-50/60 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{s.title}</p>
                    <p className="text-xs text-muted mb-3">{s.totalModules} modules</p>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Play className="w-3 h-3 fill-current" /> Start Course
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ─────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold text-foreground">Completed</h2>
            </div>
            <Link href="/certificates" className="text-sm text-primary hover:underline flex items-center gap-1">
              Certificates <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {completed.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`} className="group">
                <Card hover className="overflow-hidden">
                  <div className="h-28 bg-linear-to-br from-emerald-50/80 to-teal-50/60 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/80 shadow flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{s.title}</p>
                    <p className="text-xs text-muted mb-3">{s.totalModules} modules</p>
                    <Badge variant="success">Completed</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!loading && enrolled.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
          <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-5 shadow-[0_4px_20px_rgba(99,102,241,0.15)]">
            <BookOpen className="w-9 h-9 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No courses yet</h3>
          <p className="text-sm text-muted max-w-xs mb-6">
            You haven&apos;t been enrolled in any courses. Browse the library or contact your HR administrator.
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 gradient-bg text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all"
          >
            <BookOpen className="w-4 h-4" /> Browse Library
          </Link>
        </div>
      )}
    </div>
  );
}
