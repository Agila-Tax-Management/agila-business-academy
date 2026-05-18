// src/app/(frontend)/(learner)/learn/[videoId]/components/VideoCompletionBanner.tsx
"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardList, X } from "lucide-react";
import Button from "@/components/UI/Button";

interface VideoCompletionBannerProps {
  exam: { id: string; title: string } | null;
  nextVideo: { id: string; title: string } | null;
  seriesId: string;
  moduleId: string;
  onDismiss: () => void;
}

export default function VideoCompletionBanner({
  exam,
  nextVideo,
  seriesId,
  moduleId,
  onDismiss,
}: VideoCompletionBannerProps): React.ReactNode {
  return (
    <div className="relative rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 p-5 mb-6 backdrop-blur-sm">
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
            Video Complete!
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            {exam
              ? "You've finished this video. Complete the exam below to continue."
              : nextVideo
              ? `Up next: ${nextVideo.title}`
              : "You've completed all videos in this module."}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {exam && (
              <Link href={`/exam/${exam.id}`}>
                <Button size="sm" variant="primary">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Take Exam
                </Button>
              </Link>
            )}
            {!exam && nextVideo && (
              <Link href={`/learn/${nextVideo.id}`}>
                <Button size="sm" variant="primary">
                  Next Video
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {!exam && !nextVideo && (
              <Link href={`/library/${seriesId}/${moduleId}`}>
                <Button size="sm" variant="secondary">
                  Back to Module
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
