// src/app/(learner)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Award, ChevronRight, Play, TrendingUp } from "lucide-react";
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

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function DashboardPage(): React.ReactNode {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState<EnrolledSeries[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/progress/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setEnrolled(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inProgress  = enrolled.filter((s) => s.progress > 0 && s.progress < 100);
  const notStarted  = enrolled.filter((s) => s.progress === 0);
  const completed   = enrolled.filter((s) => s.progress === 100);
  const pendingExams = enrolled.filter((s) => s.hasPendingExam);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-muted mb-1">{formatDate()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back,{" "}
            <span className="text-primary">{user?.name?.split(" ")[0] ?? "there"}</span>
          </h1>
          <p className="text-muted text-sm mt-1">Here&apos;s what you&apos;re working on.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Enrolled",   value: enrolled.length,    icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "In Progress", value: inProgress.length, icon: <Clock className="w-5 h-5" />,    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
          { label: "Completed",  value: completed.length,   icon: <TrendingUp className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: "Pending Exams", value: pendingExams.length, icon: <Award className="w-5 h-5" />, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Continue Learning</h2>
            <Link href="/library" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {inProgress.map((s) => (
              <Link
                key={s.id}
                href={`/library/${s.id}`}
                className="shrink-0 w-64 group"
              >
                <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-primary fill-primary" />
                    </div>
                    {s.hasPendingExam && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="warning">Exam due</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-2">{s.title}</p>
                    <p className="text-xs text-muted mb-3">
                      {s.completedModules}/{s.totalModules} modules
                    </p>
                    <ProgressBar value={s.progress} size="sm" showLabel />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Assigned to You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notStarted.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted group-hover:text-primary transition-colors" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1">{s.title}</p>
                    <p className="text-xs text-muted">{s.totalModules} modules</p>
                    <div className="mt-3">
                      <Badge variant="neutral">Not started</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && enrolled.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted-bg flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No courses yet</h3>
          <p className="text-sm text-muted max-w-xs">
            You haven&apos;t been enrolled in any courses. Browse the library to get started.
          </p>
          <Link
            href="/library"
            className="mt-4 inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Browse Library
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted-bg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
