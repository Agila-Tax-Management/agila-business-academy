// src/app/(frontend)/(learner)/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Play, Layers, Star, CheckCircle2 } from "lucide-react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
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

export default function LibraryPage(): React.ReactNode {
  const [series, setSeries]     = useState<SeriesItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "enrolled" | "available">("all");

  const [prevSearch, setPrevSearch] = useState("");
  const [prevFilter, setPrevFilter] = useState<typeof filter>("all");
  const [page, setPage] = useState(1);

  if (prevSearch !== search || prevFilter !== filter) {
    setPrevSearch(search);
    setPrevFilter(filter);
    setPage(1);
  }
  useEffect(() => {
    setLoading(true);
    fetch("/api/series")
      .then((r) => r.json())
      .then((data) => { if (data.data) setSeries(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = series.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"       ? true :
      filter === "enrolled"  ? s.isEnrolled :
      /* available */           !s.isEnrolled;
    return matchSearch && matchFilter;
  });

  const ITEMS_PER_PAGE = 12;
  const paginated = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore   = paginated.length < filtered.length;

  const FILTERS: { label: string; value: typeof filter }[] = [
    { label: "All Courses", value: "all" },
    { label: "My Courses",  value: "enrolled" },
    { label: "Available",   value: "available" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">Course Library</h1>
        <p className="text-muted text-sm mt-1">Browse and continue your training courses.</p>
      </div>

      {/* ── Search + Filter bar ──────────────────────────────── */}
      <div className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-150 whitespace-nowrap ${
                filter === f.value
                  ? "gradient-bg text-white shadow-[0_2px_12px_rgba(99,102,241,0.30)]"
                  : "bg-white/60 backdrop-blur-sm text-muted hover:text-foreground hover:bg-white/80 border border-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ────────────────────────────────────── */}
      {!loading && (
        <p className="text-xs text-muted mb-5">
          {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
        </p>
      )}

      {/* ── Loading skeleton ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl skeleton" />
          ))}
        </div>

      /* ── Empty state ─────────────────────────────────────── */
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(99,102,241,0.12)]">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No courses found</h3>
          <p className="text-sm text-muted">Try adjusting your search or filter.</p>
        </div>

      /* ── Course grid ─────────────────────────────────────── */
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`} className="group">
                <Card hover className="overflow-hidden h-full flex flex-col">

                  {/* Thumbnail */}
                  <div className="relative h-40 bg-linear-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-white/80 shadow flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <BookOpen className="w-7 h-7 text-primary" />
                    </div>

                    {/* Status badge */}
                    {s.isEnrolled && s.progress === 100 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="success">Completed</Badge>
                      </div>
                    )}
                    {!s.isEnrolled && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="neutral">Available</Badge>
                      </div>
                    )}

                    {/* Progress stripe */}
                    {s.isEnrolled && s.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                        <div
                          className="h-full gradient-bg transition-all"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm font-bold text-foreground line-clamp-2 mb-1">
                      {s.title}
                    </p>
                    {s.description && (
                      <p className="text-xs text-muted line-clamp-2 mb-3 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="mt-auto flex items-center gap-3 text-xs text-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {s.totalModules} modules
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="w-3.5 h-3.5" />
                        {s.totalVideos} videos
                      </span>
                    </div>

                    {/* Progress bar (in-progress courses) */}
                    {s.isEnrolled && s.progress > 0 && s.progress < 100 && (
                      <ProgressBar value={s.progress} size="sm" showLabel className="mb-3" />
                    )}

                    {/* Footer action */}
                    {s.isEnrolled ? (
                      s.progress === 100 ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl gradient-bg text-white text-xs font-semibold px-3 py-1.5 shadow-[0_2px_8px_rgba(99,102,241,0.25)] w-fit">
                          <Play className="w-3 h-3 fill-white" />
                          {s.progress > 0 ? "Continue" : "Start"}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 group-hover:bg-primary group-hover:text-white transition-colors w-fit">
                        <Star className="w-3 h-3" /> Enroll
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="glass text-sm text-primary font-semibold px-6 py-2.5 rounded-xl hover:bg-white/80 transition-colors"
              >
                Load more courses
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
