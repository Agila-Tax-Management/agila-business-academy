// src/app/(frontend)/(learner)/library/[seriesId]/[moduleId]/components/ModuleDetailShell.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Play, Clock, FileText, Lock,
  ChevronLeft, ChevronRight, ArrowLeft, Image as ImageIcon,
} from "lucide-react";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import Card from "@/components/UI/Card";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "IMAGE" | "TEXT";
  durationSeconds: number;
  order: number;
  videoExam: { id: string } | null;
  progress: {
    watchedSeconds: number;
    durationSeconds: number;
    completedAt: string | null;
  } | null;
}

interface ModuleDetailData {
  id: string;
  title: string;
  description: string | null;
  order: number;
  series: { id: string; title: string };
  isCompleted: boolean;
  allVideosCompleted: boolean;
  moduleExam: {
    id: string;
    title: string;
    scope: string;
    passingScore: number;
  } | null;
  bestAttempt: { score: number; passed: boolean } | null;
  videos: VideoItem[];
  prevModule: { id: string; title: string } | null;
  nextModule: { id: string; title: string } | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Loading skeleton ────────────────────────────────────────── */
function LoadingSkeleton(): React.ReactNode {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-4 rounded-full skeleton w-64 mb-2" />
      <div className="h-36 rounded-3xl skeleton" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}
      </div>
    </div>
  );
}

/* ── Error state ─────────────────────────────────────────────── */
function ErrorState({ message }: { message: string }): React.ReactNode {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center space-y-3">
        <p className="text-4xl">⚠️</p>
        <p className="font-semibold text-foreground">{message}</p>
        <Link href="/library">
          <Button variant="secondary" size="sm">Back to Library</Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Main shell ──────────────────────────────────────────────── */
export default function ModuleDetailShell({
  seriesId,
  moduleId,
}: {
  seriesId: string;
  moduleId: string;
}): React.ReactNode {
  const router                      = useRouter();
  const [data,       setData]       = useState<ModuleDetailData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/modules/${moduleId}`)
      .then((r) => r.json())
      .then((res: { data?: ModuleDetailData; error?: string }) => {
        if (res.error) { setFetchError(res.error); return; }
        if (!res.data) { setFetchError("Module not found"); return; }
        setData(res.data);
      })
      .catch(() => setFetchError("Failed to load module"))
      .finally(() => setLoading(false));
  }, [moduleId]);

  // First incomplete video (continue/start target)
  const firstIncomplete  = data?.videos.find((v) => !v.progress?.completedAt);
  const continueVideoId  = firstIncomplete?.id ?? data?.videos[0]?.id ?? null;

  if (loading)             return <LoadingSkeleton />;
  if (fetchError || !data) return <ErrorState message={fetchError ?? "Module not found"} />;

  const prevMod = data.prevModule;
  const nextMod = data.nextModule;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-up">

      {/* ── Breadcrumbs ───────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-muted mb-5 flex-wrap">
        <Link href="/library" className="hover:text-primary transition-colors">
          Library
        </Link>
        <span>/</span>
        <Link
          href={`/library/${seriesId}`}
          className="hover:text-primary transition-colors truncate max-w-36"
        >
          {data.series.title}
        </Link>
        <span>/</span>
        <span className="text-foreground/80 font-medium truncate max-w-48">{data.title}</span>
      </nav>

      {/* ── Module header ─────────────────────────────────────── */}
      <div className="glass rounded-3xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Module {data.order + 1}
              </span>
              {data.isCompleted && <Badge variant="success">Completed</Badge>}
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-foreground leading-tight mb-2">
              {data.title}
            </h1>
            {data.description && (
              <p className="text-sm text-muted leading-relaxed">{data.description}</p>
            )}
          </div>
          {continueVideoId && (
            <Button
              variant="primary"
              onClick={() => router.push(`/learn/${continueVideoId}`)}
              className="shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              {data.isCompleted ? "Review" : firstIncomplete ? "Continue" : "Start"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Video list ────────────────────────────────────────── */}
      <h2 className="text-sm font-bold text-foreground mb-3">
        Lessons · {data.videos.length}
      </h2>

      <div className="space-y-2 mb-5">
        {data.videos.map((video, idx) => {
          const isCompleted = !!video.progress?.completedAt;
          const watchPct    = !isCompleted && video.durationSeconds > 0 && video.progress
            ? Math.min(100, Math.round((video.progress.watchedSeconds / video.durationSeconds) * 100))
            : 0;

          return (
            <Card key={video.id} className="p-4">
              <div className="flex items-center gap-3">

                {/* Status icon */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-[11px] text-muted font-semibold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {video.type === "IMAGE" && <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    {video.type === "TEXT"  && <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    {video.type === "VIDEO" && <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                      {video.title}
                    </p>
                  </div>
                  <div className="flex items-center flex-wrap gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      {video.type === "VIDEO" && <><Clock className="w-3 h-3" />{formatDuration(video.durationSeconds)}</>}
                      {video.type === "IMAGE" && <>Image</>}
                      {video.type === "TEXT"  && <>Reading</>}
                    </span>
                    {video.videoExam && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <FileText className="w-3 h-3" /> Has quiz
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs text-emerald-600 font-medium">Completed</span>
                    )}
                    {!isCompleted && watchPct > 0 && (
                      <span className="text-xs text-muted">{watchPct}% watched</span>
                    )}
                  </div>

                  {/* In-progress bar */}
                  {watchPct > 0 && (
                    <div className="mt-1.5 h-0.5 rounded-full bg-border overflow-hidden max-w-xs">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${watchPct}%` }} />
                    </div>
                  )}
                </div>

                {/* Action button */}
                <Link href={`/learn/${video.id}`} className="shrink-0">
                  <Button variant={isCompleted ? "ghost" : "secondary"} size="sm">
                    {video.type === "TEXT"  ? (isCompleted ? "Reread" : "Read") :
                     video.type === "IMAGE" ? (isCompleted ? "View Again" : "View") :
                     isCompleted ? "Rewatch" : watchPct > 0 ? "Resume" : "Watch"}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Module exam card ──────────────────────────────────── */}
      {data.moduleExam && (
        <Card className="p-5 mb-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                data.allVideosCompleted
                  ? "bg-primary/10 text-primary"
                  : "bg-muted-bg text-muted"
              }`}>
                {data.allVideosCompleted
                  ? <FileText className="w-5 h-5" />
                  : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">
                  Module Exam
                </p>
                <p className="text-sm font-bold text-foreground">{data.moduleExam.title}</p>
                {data.bestAttempt && (
                  <p className="text-xs text-muted mt-0.5">
                    Best score:{" "}
                    <span className={`font-semibold ${data.bestAttempt.passed ? "text-emerald-600" : "text-red-500"}`}>
                      {data.bestAttempt.score}%
                    </span>
                    {data.bestAttempt.passed ? " · Passed" : " · Failed"}
                  </p>
                )}
              </div>
            </div>

            {data.allVideosCompleted ? (
              <Link href={`/exam/${data.moduleExam.id}`}>
                <Button size="sm" variant={data.bestAttempt?.passed ? "secondary" : "primary"}>
                  {data.bestAttempt?.passed ? "Retake" : "Take Exam"}
                </Button>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Lock className="w-3.5 h-3.5" /> Complete all lessons first
              </span>
            )}
          </div>

          {!data.allVideosCompleted && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted">
                {data.videos.filter((v) => v.progress?.completedAt).length}/{data.videos.length} videos completed
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Prev / next navigation ────────────────────────────── */}
      <div className="flex items-center justify-between pt-5 border-t border-border">
        {prevMod ? (
          <Button variant="ghost" onClick={() => router.push(`/library/${seriesId}/${prevMod.id}`)}>
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline truncate max-w-36">{prevMod.title}</span>
            <span className="sm:hidden">Previous</span>
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => router.push(`/library/${seriesId}`)}>
            <ArrowLeft className="w-4 h-4" />
            Back to Series
          </Button>
        )}

        {nextMod ? (
          <Button variant="ghost" onClick={() => router.push(`/library/${seriesId}/${nextMod.id}`)}>
            <span className="hidden sm:inline truncate max-w-36">{nextMod.title}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => router.push(`/library/${seriesId}`)}>
            Back to Series
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
