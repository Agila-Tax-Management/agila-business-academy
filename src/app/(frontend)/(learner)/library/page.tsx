// src/app/(frontend)/(learner)/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Play, Layers, CheckCircle2, ChevronRight, Zap, Library } from "lucide-react";
import Card from "@/components/UI/Card";
import Input from "@/components/UI/Input";
import ProgressBar from "@/components/UI/ProgressBar";

interface SeriesItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  totalModules: number;
  totalVideos: number;
  progress: number;
  isEnrolled: boolean;
  isPublic: boolean;
}

// ── Shared series card ──────────────────────────────────────────
function SeriesCard({ s }: { s: SeriesItem }) {
  const isCompleted  = s.isEnrolled && s.progress === 100;
  const isInProgress = s.isEnrolled && s.progress > 0 && s.progress < 100;

  return (
    <Link href={`/library/${s.id}`} className="group h-full">
      <Card hover className="overflow-hidden h-full flex flex-col">

        {/* Thumbnail */}
        <div className="relative h-40 bg-linear-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center overflow-hidden shrink-0">
          <div className="w-13 h-13 rounded-2xl bg-white/80 shadow flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>

          {/* Status pill */}
          {isCompleted && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <CheckCircle2 className="w-2.5 h-2.5" /> Done
              </span>
            </div>
          )}
          {!s.isEnrolled && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-muted border border-white/60">
                Available
              </span>
            </div>
          )}

          {/* Progress stripe */}
          {isInProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
              <div className="h-full gradient-bg transition-all" style={{ width: `${s.progress}%` }} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-sm font-bold text-foreground line-clamp-2 mb-1">{s.title}</p>
          {s.description && (
            <p className="text-xs text-muted line-clamp-2 mb-3 leading-relaxed">{s.description}</p>
          )}

          {/* Meta */}
          <div className="mt-auto flex items-center gap-3 text-xs text-muted mb-3">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> {s.totalModules} modules
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-3.5 h-3.5" /> {s.totalVideos} videos
            </span>
          </div>

          {/* Progress bar */}
          {isInProgress && <ProgressBar value={s.progress} size="sm" showLabel className="mb-3" />}

          {/* CTA */}
          {s.isEnrolled ? (
            isCompleted ? (
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl gradient-bg text-white text-xs font-semibold px-3 py-1.5 shadow-[0_2px_8px_rgba(99,102,241,0.25)] w-fit">
                <Play className="w-3 h-3 fill-white" />
                {s.progress > 0 ? "Continue" : "Start"}
              </span>
            )
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

// ── Section header ──────────────────────────────────────────────
function SectionHeader({
  icon, label, count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-base font-bold text-foreground">{label}</h2>
      <span className="text-xs text-muted glass px-2.5 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function LibraryPage(): React.ReactNode {
  const [series, setSeries]     = useState<SeriesItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [browsePage, setBrowsePage] = useState(1);

  const [prevSearch, setPrevSearch] = useState("");
  if (prevSearch !== search) {
    setPrevSearch(search);
    setBrowsePage(1);
  }

  useEffect(() => {
    setLoading(true);
    fetch("/api/series")
      .then((r) => r.json())
      .then((data) => { if (data.data) setSeries(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSearching   = search.trim().length > 0;
  const inProgress    = series.filter((s) => s.isEnrolled && s.progress > 0 && s.progress < 100);
  const myCourses     = series.filter((s) => s.isEnrolled);
  const browse        = series.filter((s) => !s.isEnrolled);
  const searchResults = isSearching
    ? series.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  const BROWSE_PER_PAGE = 12;
  const browsePaginated = browse.slice(0, browsePage * BROWSE_PER_PAGE);
  const hasMoreBrowse   = browsePaginated.length < browse.length;

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-10 animate-fade-up">
        <div className="h-10 max-w-md skeleton rounded-2xl" />
        <div>
          <div className="h-5 w-44 skeleton rounded-xl mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => <div key={i} className="h-64 w-60 shrink-0 skeleton rounded-2xl" />)}
          </div>
        </div>
        <div>
          <div className="h-5 w-32 skeleton rounded-xl mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-10 animate-fade-up">

      {/* ── Search bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        {isSearching && (
          <p className="text-xs text-muted shrink-0">
            {searchResults.length} {searchResults.length === 1 ? "result" : "results"} for &quot;{search}&quot;
          </p>
        )}
      </div>

      {/* ── Search results ──────────────────────────────────── */}
      {isSearching ? (
        searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No courses found</h3>
            <p className="text-sm text-muted">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {searchResults.map((s) => <SeriesCard key={s.id} s={s} />)}
          </div>
        )
      ) : (
        <>
          {/* ── Continue Learning ────────────────────────────── */}
          {inProgress.length > 0 && (
            <section>
              <SectionHeader
                icon={<Zap className="w-4 h-4 text-primary" />}
                label="Continue Learning"
                count={inProgress.length}
              />
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-thin">
                {inProgress.map((s) => (
                  <div key={s.id} className="shrink-0 w-64 snap-start">
                    <SeriesCard s={s} />
                  </div>
                ))}
                {/* See all pill at the end of the scroll row */}
                {myCourses.length > inProgress.length && (
                  <div className="shrink-0 w-40 snap-start flex items-center justify-center">
                    <Link
                      href="#my-courses"
                      className="flex flex-col items-center gap-2 text-primary text-xs font-semibold hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center shadow">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                      View all
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── My Courses ───────────────────────────────────── */}
          {myCourses.length > 0 && (
            <section id="my-courses">
              <SectionHeader
                icon={<BookOpen className="w-4 h-4 text-indigo-500" />}
                label="My Courses"
                count={myCourses.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {myCourses.map((s) => <SeriesCard key={s.id} s={s} />)}
              </div>
            </section>
          )}

          {/* ── Browse All ───────────────────────────────────── */}
          {browse.length > 0 && (
            <section>
              <SectionHeader
                icon={<Library className="w-4 h-4 text-violet-500" />}
                label="Browse Courses"
                count={browse.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {browsePaginated.map((s) => <SeriesCard key={s.id} s={s} />)}
              </div>
              {hasMoreBrowse && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setBrowsePage((p) => p + 1)}
                    className="glass text-sm text-primary font-semibold px-6 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── No courses at all ────────────────────────────── */}
          {series.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No courses available</h3>
              <p className="text-sm text-muted">Check back soon for new training content.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
