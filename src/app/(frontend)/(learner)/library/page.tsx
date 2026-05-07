// src/app/(learner)/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Play, Filter } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Course Library</h1>
        <p className="text-muted text-sm mt-1">Browse all available training series and courses.</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-muted-bg text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted mb-4">
          {filtered.length} {filtered.length === 1 ? "course" : "courses"} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted-bg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted-bg flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-muted" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No courses found</h3>
          <p className="text-sm text-muted">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginated.map((s) => (
              <Link key={s.id} href={`/library/${s.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group h-full flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-primary/15 via-primary/10 to-transparent flex items-center justify-center overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <BookOpen className="w-7 h-7 text-primary" />
                    </div>
                    {/* Progress overlay */}
                    {s.isEnrolled && s.progress === 100 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="success">Completed</Badge>
                      </div>
                    )}
                    {s.isEnrolled && s.progress > 0 && s.progress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                        <div className="h-full bg-primary" style={{ width: `${s.progress}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 mb-1.5">
                      {s.title}
                    </p>
                    {s.description && (
                      <p className="text-xs text-muted line-clamp-2 mb-3">{s.description}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {s.totalModules} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Play className="w-3.5 h-3.5" />
                          {s.totalVideos} videos
                        </span>
                      </div>
                      {s.isEnrolled ? (
                        <Badge variant={s.progress === 100 ? "success" : "primary"}>
                          {s.progress === 100 ? "Done" : `${s.progress}%`}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Enroll</Badge>
                      )}
                    </div>

                    {s.isEnrolled && s.progress > 0 && s.progress < 100 && (
                      <ProgressBar value={s.progress} size="sm" className="mt-3" />
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
                className="text-sm text-primary hover:underline font-medium"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
