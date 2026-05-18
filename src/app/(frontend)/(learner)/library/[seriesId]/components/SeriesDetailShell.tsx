// src/app/(frontend)/(learner)/library/[seriesId]/components/SeriesDetailShell.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play, Layers, CheckCircle2, Award, ChevronRight,
  ArrowLeft, Lock, FileText, Star,
} from "lucide-react";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import ProgressBar from "@/components/UI/ProgressBar";
import Card from "@/components/UI/Card";
import { useToast } from "@/context/ToastContext";

interface VideoCard {
  id: string;
  title: string;
  durationSeconds: number;
  order: number;
  isCompleted: boolean;
}

interface ModuleCard {
  id: string;
  title: string;
  description: string | null;
  order: number;
  videoCount: number;
  completedVideoCount: number;
  isCompleted: boolean;
  moduleExam: { id: string; title: string } | null;
  nextVideoId: string | null;
  videos: VideoCard[];
}

interface SeriesDetailData {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  requiresCertificate: boolean;
  isEnrolled: boolean;
  seriesCompletion: { completedAt: string } | null;
  seriesExam: { id: string; title: string; scope: string } | null;
  modules: ModuleCard[];
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
}

/* ── Progress ring ───────────────────────────────────────────── */
function RingProgress({ value, size = 72 }: { value: number; size?: number }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="white" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

/* ── Loading skeleton ────────────────────────────────────────── */
function LoadingSkeleton(): React.ReactNode {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-pulse space-y-5">
      <div className="h-6 rounded-full skeleton w-32 mb-2" />
      <div className="h-56 rounded-3xl skeleton" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
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
export default function SeriesDetailShell({ seriesId }: { seriesId: string }): React.ReactNode {
  const router                        = useRouter();
  const { success, error: toastError } = useToast();
  const [data,      setData]          = useState<SeriesDetailData | null>(null);
  const [loading,   setLoading]       = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [enrolling, setEnrolling]     = useState(false);

  useEffect(() => {
    fetch(`/api/series/${seriesId}`)
      .then((r) => r.json())
      .then((res: { data?: SeriesDetailData; error?: string }) => {
        if (res.error) { setFetchError(res.error); return; }
        if (!res.data) { setFetchError("Series not found"); return; }
        setData(res.data);
      })
      .catch(() => setFetchError("Failed to load series"))
      .finally(() => setLoading(false));
  }, [seriesId]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res  = await fetch(`/api/series/${seriesId}/enroll`, { method: "POST" });
      const json = await res.json() as { error?: string };
      if (json.error) { toastError("Enrollment failed", json.error); return; }
      success("Enrolled!", "You're now enrolled. Start learning!");
      const refresh     = await fetch(`/api/series/${seriesId}`);
      const refreshJson = await refresh.json() as { data?: SeriesDetailData };
      if (refreshJson.data) setData(refreshJson.data);
    } catch {
      toastError("Enrollment failed", "Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  // First incomplete video across all modules
  const continueVideoId = data
    ? (data.modules.find((m) => !m.isCompleted)?.nextVideoId ?? data.modules[0]?.nextVideoId ?? null)
    : null;

  if (loading)              return <LoadingSkeleton />;
  if (fetchError || !data)  return <ErrorState message={fetchError ?? "Series not found"} />;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-up">

      {/* ── Back link ─────────────────────────────────────────── */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Course Library
      </Link>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="gradient-bg rounded-3xl p-6 lg:p-8 mb-6 text-white">
        <div className="flex items-start gap-6">
          <div className="flex-1 min-w-0">

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {data.isPublic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  Public
                </span>
              )}
              {data.requiresCertificate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-300/30 text-xs font-semibold">
                  <Award className="w-3 h-3" /> Certificate
                </span>
              )}
              {data.isEnrolled && data.progressPercent === 100 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
              {data.isEnrolled && data.progressPercent < 100 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  Enrolled
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2 leading-tight">
              {data.title}
            </h1>
            {data.description && (
              <p className="text-white/80 text-sm leading-relaxed line-clamp-3 mb-4">
                {data.description}
              </p>
            )}

            {/* Meta stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mb-5">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> {data.modules.length} modules
              </span>
              <span className="flex items-center gap-1.5">
                <Play className="w-4 h-4" /> {data.totalVideos} videos
              </span>
              {data.seriesExam && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Final exam
                </span>
              )}
            </div>

            {/* Primary CTA */}
            {data.isEnrolled ? (
              <Button
                variant="secondary"
                onClick={() => continueVideoId && router.push(`/learn/${continueVideoId}`)}
                disabled={!continueVideoId}
              >
                <Play className="w-4 h-4 fill-current" />
                {data.progressPercent === 0
                  ? "Start Learning"
                  : data.progressPercent === 100
                  ? "Review Course"
                  : "Continue Learning"}
              </Button>
            ) : (
              <Button variant="secondary" loading={enrolling} onClick={handleEnroll}>
                <Star className="w-4 h-4" />
                Enroll Now
              </Button>
            )}
          </div>

          {/* Progress ring (enrolled only) */}
          {data.isEnrolled && (
            <div className="hidden sm:flex flex-col items-center shrink-0">
              <div className="relative">
                <RingProgress value={data.progressPercent} size={80} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {data.progressPercent}%
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1.5 text-center leading-tight">
                {data.completedVideos}/{data.totalVideos}
                <br />videos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Module list ───────────────────────────────────────── */}
      <h2 className="text-sm font-bold text-foreground mb-4">
        Course Content · {data.modules.length} {data.modules.length === 1 ? "module" : "modules"}
      </h2>

      <div className="space-y-3">
        {data.modules.map((mod, idx) => {
          const modPct = mod.videoCount > 0
            ? Math.round((mod.completedVideoCount / mod.videoCount) * 100)
            : 0;

          return (
            <Card key={mod.id} className="p-5">
              <div className="flex items-start gap-4">

                {/* Number / completed icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 ${
                  mod.isCompleted
                    ? "bg-emerald-100/80 text-emerald-700"
                    : "gradient-bg text-white"
                }`}>
                  {mod.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-foreground">{mod.title}</h3>
                    {mod.isCompleted && <Badge variant="success">Completed</Badge>}
                    {mod.moduleExam && <Badge variant="info">Exam</Badge>}
                  </div>
                  {mod.description && (
                    <p className="text-xs text-muted mb-2 line-clamp-2">{mod.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted mb-2">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {mod.videoCount} {mod.videoCount === 1 ? "video" : "videos"}
                    </span>
                    <span>{mod.completedVideoCount}/{mod.videoCount} completed</span>
                  </div>
                  {mod.videoCount > 0 && (
                    <ProgressBar value={modPct} size="sm" className="max-w-xs" />
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col gap-2 items-end">
                  <Link href={`/library/${seriesId}/${mod.id}`}>
                    <Button variant="secondary" size="sm">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {mod.nextVideoId && data.isEnrolled && (
                    <Link href={`/learn/${mod.nextVideoId}`}>
                      <Button variant="ghost" size="sm">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {mod.completedVideoCount === 0 ? "Start" : "Continue"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Series exam card ──────────────────────────────────── */}
      {data.seriesExam && (
        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">
                  Final Exam
                </p>
                <p className="text-sm font-bold text-foreground">{data.seriesExam.title}</p>
              </div>
            </div>
            {data.progressPercent === 100 ? (
              <Link href={`/exam/${data.seriesExam.id}`}>
                <Button size="sm">Take Exam</Button>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Lock className="w-3.5 h-3.5" /> Complete all modules first
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
