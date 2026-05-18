// src/app/(frontend)/(learner)/learn/[videoId]/components/VideoSidebar.tsx
"use client";

import Link from "next/link";
import { CheckCircle2, Play, Clock, ArrowLeft } from "lucide-react";

interface SiblingVideo {
  id: string;
  title: string;
  order: number;
  durationSeconds: number;
  progress: { watchedSeconds: number; completedAt: string | null } | null;
}

interface VideoSidebarProps {
  moduleTitle: string;
  seriesId: string;
  moduleId: string;
  currentVideoId: string;
  siblings: SiblingVideo[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoSidebar({
  moduleTitle,
  seriesId,
  moduleId,
  currentVideoId,
  siblings,
}: VideoSidebarProps): React.ReactNode {
  const completedCount = siblings.filter((v) => v.progress?.completedAt).length;

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border bg-sidebar overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <Link
          href={`/library/${seriesId}/${moduleId}`}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to module
        </Link>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Module</p>
        <h2 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
          {moduleTitle}
        </h2>
        <p className="text-xs text-muted mt-1.5">
          {completedCount} / {siblings.length} completed
        </p>
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto py-2">
        {siblings.map((video, idx) => {
          const isCurrent   = video.id === currentVideoId;
          const isCompleted = !!video.progress?.completedAt;
          const watchPct    =
            !isCompleted && video.durationSeconds > 0 && video.progress
              ? Math.min(100, Math.round((video.progress.watchedSeconds / video.durationSeconds) * 100))
              : 0;

          return (
            <Link
              key={video.id}
              href={`/learn/${video.id}`}
              className={`flex items-start gap-3 px-4 py-3 transition-colors relative ${
                isCurrent
                  ? "bg-primary/10 border-r-2 border-primary"
                  : "hover:bg-white/40 dark:hover:bg-white/5"
              }`}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 text-primary fill-primary" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-[10px] text-muted font-semibold">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug line-clamp-2 ${
                    isCurrent ? "font-semibold text-primary" : "text-foreground"
                  }`}
                >
                  {video.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-muted" />
                  <span className="text-xs text-muted">{formatDuration(video.durationSeconds)}</span>
                </div>
                {watchPct > 0 && (
                  <div className="mt-1.5 h-0.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${watchPct}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
