// src/app/(frontend)/(learner)/learn/[videoId]/components/VideoPlayerShell.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft, Clock, Layers } from "lucide-react";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import VideoSidebar from "./VideoSidebar";
import VideoCompletionBanner from "./VideoCompletionBanner";

interface SiblingVideo {
  id: string;
  title: string;
  order: number;
  durationSeconds: number;
  progress: { watchedSeconds: number; completedAt: string | null } | null;
}

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSeconds: number;
  order: number;
  module: {
    id: string;
    title: string;
    series: { id: string; title: string };
  };
  exam: { id: string; title: string; scope: string } | null;
  progress: {
    watchedSeconds: number;
    durationSeconds: number;
    completedAt: string | null;
  } | null;
  siblings: SiblingVideo[];
  prevVideo: { id: string; title: string } | null;
  nextVideo: { id: string; title: string } | null;
  currentIndex: number;
  totalVideos: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Loading skeleton ────────────────────────────────────────── */
function LoadingSkeleton(): React.ReactNode {
  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 overflow-y-auto animate-pulse">
        <div className="bg-black/10 aspect-video w-full" />
        <div className="p-6 lg:p-8 space-y-4">
          <div className="h-3 bg-muted-bg rounded-full w-48" />
          <div className="h-7 bg-muted-bg rounded-full w-3/4" />
          <div className="h-4 bg-muted-bg rounded-full w-full" />
          <div className="h-4 bg-muted-bg rounded-full w-5/6" />
        </div>
      </div>
      <aside className="hidden lg:block w-80 xl:w-96 border-l border-border" />
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
          <Button variant="secondary" size="sm">
            Back to Library
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Main shell ──────────────────────────────────────────────── */
export default function VideoPlayerShell({ videoId }: { videoId: string }): React.ReactNode {
  const router      = useRouter();
  const videoRef    = useRef<HTMLVideoElement>(null);

  const [data,        setData]        = useState<VideoData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showBanner,  setShowBanner]  = useState(false);

  // Reset state when videoId changes (adjust state during render)
  const [prevVideoId, setPrevVideoId] = useState(videoId);
  if (prevVideoId !== videoId) {
    setPrevVideoId(videoId);
    setLoading(true);
    setData(null);
    setFetchError(null);
    setIsCompleted(false);
    setShowBanner(false);
  }

  /* ── Fetch video data ────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/videos/${videoId}`)
      .then((r) => r.json())
      .then((res: { data?: VideoData; error?: string }) => {
        if (res.error) { setFetchError(res.error); return; }
        if (!res.data) { setFetchError("Video not found"); return; }
        setData(res.data);
        setIsCompleted(!!res.data.progress?.completedAt);
        setShowBanner(!!res.data.progress?.completedAt);
      })
      .catch(() => setFetchError("Failed to load video"))
      .finally(() => setLoading(false));
  }, [videoId]);

  /* ── Progress reporter ───────────────────────────────────── */
  const reportProgress = useCallback(
    async (watchedSeconds: number, durationSeconds: number) => {
      if (durationSeconds === 0) return;
      try {
        const res = await fetch(`/api/videos/${videoId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchedSeconds: Math.floor(watchedSeconds),
            durationSeconds: Math.floor(durationSeconds),
          }),
        });
        const json = await res.json() as {
          data?: { completed: boolean; firstCompletion: boolean };
        };
        if (json.data?.firstCompletion) {
          setIsCompleted(true);
          setShowBanner(true);
        }
      } catch {
        // Fire-and-forget — ignore network errors
      }
    },
    [videoId],
  );

  /* ── Periodic progress (every 15 s while playing) ────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      const el = videoRef.current;
      if (!el || el.paused || el.ended || !el.duration) return;
      void reportProgress(el.currentTime, el.duration);
    }, 15_000);
    return () => clearInterval(interval);
  }, [reportProgress]);

  /* ── sendBeacon on page unload ───────────────────────────── */
  useEffect(() => {
    function handleBeforeUnload() {
      const el = videoRef.current;
      if (!el || !el.duration) return;
      const blob = new Blob(
        [JSON.stringify({
          watchedSeconds: Math.floor(el.currentTime),
          durationSeconds: Math.floor(el.duration),
        })],
        { type: "application/json" },
      );
      navigator.sendBeacon(`/api/videos/${videoId}/progress`, blob);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [videoId]);

  /* ── Video element handlers ──────────────────────────────── */
  function handleLoadedMetadata() {
    if (!videoRef.current || !data) return;
    const saved    = data.progress?.watchedSeconds ?? 0;
    const duration = videoRef.current.duration;
    // Resume from last position (if not already completed and past the first 10s)
    if (!data.progress?.completedAt && saved > 10 && saved < duration * 0.95) {
      videoRef.current.currentTime = saved;
    }
  }

  function handlePause() {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    void reportProgress(el.currentTime, el.duration);
  }

  function handleEnded() {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    void reportProgress(el.duration, el.duration);
  }

  /* ── Render ──────────────────────────────────────────────── */
  if (loading)              return <LoadingSkeleton />;
  if (fetchError || !data)  return <ErrorState message={fetchError ?? "Video not found"} />;

  const { module, exam, prevVideo, nextVideo, currentIndex, totalVideos } = data;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: player + info ─────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* Video */}
        <div className="bg-black w-full aspect-video">
          <video
            ref={videoRef}
            src={data.videoUrl}
            controls
            className="w-full h-full object-contain"
            onLoadedMetadata={handleLoadedMetadata}
            onPause={handlePause}
            onEnded={handleEnded}
          />
        </div>

        {/* Info area */}
        <div className="p-6 lg:p-8">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-muted mb-4 flex-wrap">
            <Link href="/library" className="hover:text-primary transition-colors">
              Library
            </Link>
            <span>/</span>
            <Link
              href={`/library/${module.series.id}`}
              className="hover:text-primary transition-colors truncate max-w-30"
            >
              {module.series.title}
            </Link>
            <span>/</span>
            <Link
              href={`/library/${module.series.id}/${module.id}`}
              className="hover:text-primary transition-colors truncate max-w-30"
            >
              {module.title}
            </Link>
            <span>/</span>
            <span className="text-foreground/80 font-medium truncate max-w-45">
              {data.title}
            </span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-xl lg:text-2xl font-extrabold text-foreground leading-tight">
              {data.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {isCompleted && <Badge variant="success">Completed</Badge>}
              <Badge variant="neutral">
                <Layers className="w-3 h-3 mr-1" />
                {currentIndex + 1} / {totalVideos}
              </Badge>
            </div>
          </div>

          {/* Duration meta */}
          <div className="flex items-center gap-3 text-xs text-muted mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(data.durationSeconds)}
            </span>
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-sm text-muted leading-relaxed mb-6">{data.description}</p>
          )}

          {/* Completion banner */}
          {showBanner && (
            <VideoCompletionBanner
              exam={exam}
              nextVideo={nextVideo}
              seriesId={module.series.id}
              moduleId={module.id}
              onDismiss={() => setShowBanner(false)}
            />
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            {prevVideo ? (
              <Button variant="ghost" onClick={() => router.push(`/learn/${prevVideo.id}`)}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.push(`/library/${module.series.id}/${module.id}`)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Module
              </Button>
            )}

            {nextVideo ? (
              <Button
                variant={isCompleted && !exam ? "primary" : "secondary"}
                onClick={() => router.push(`/learn/${nextVideo.id}`)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.push(`/library/${module.series.id}/${module.id}`)}
              >
                Back to Module
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: module video list ─────────────────────── */}
      <VideoSidebar
        moduleTitle={module.title}
        seriesId={module.series.id}
        moduleId={module.id}
        currentVideoId={data.id}
        siblings={data.siblings}
      />
    </div>
  );
}
