// src/app/(frontend)/(learner)/search/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Play, Layers, SlidersHorizontal } from "lucide-react";
import Card from "@/components/UI/Card";
import Input from "@/components/UI/Input";
import Badge from "@/components/UI/Badge";

interface SearchResult {
  id: string;
  type: "series" | "module" | "video";
  title: string;
  description: string | null;
  parentTitle?: string;
  seriesId?: string;
  moduleId?: string;
}

function TypeIcon({ type }: { type: SearchResult["type"] }) {
  if (type === "series") return <BookOpen className="w-4 h-4 text-indigo-500" />;
  if (type === "module") return <Layers className="w-4 h-4 text-violet-500" />;
  return <Play className="w-4 h-4 text-sky-500" />;
}

function typeLabel(type: SearchResult["type"]): string {
  return type === "series" ? "Series" : type === "module" ? "Module" : "Content";
}

function typeBadgeVariant(type: SearchResult["type"]): "primary" | "neutral" | "info" {
  return type === "series" ? "primary" : type === "module" ? "neutral" : "info";
}

function href(r: SearchResult): string {
  if (r.type === "series") return `/library/${r.id}`;
  if (r.type === "module") return `/library/${r.seriesId}/${r.id}`;
  return `/learn/${r.id}`;
}

function SearchContent(): React.ReactNode {
  const params   = useSearchParams();
  const initial  = params.get("q") ?? "";

  const [query,   setQuery]   = useState(initial);
  const [filter,  setFilter]  = useState<"all" | "series" | "module" | "video">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!initial.trim()) return;
    doSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.data) setResults(data.data);
      else setResults([]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "all" ? results : results.filter((r) => r.type === filter);

  const FILTERS: { label: string; value: typeof filter }[] = [
    { label: "All", value: "all" },
    { label: "Series", value: "series" },
    { label: "Modules", value: "module" },
    { label: "Content", value: "video" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Search</h1>
        <p className="text-muted text-sm mt-1">Find series, modules, and content.</p>
      </div>

      {/* ── Search bar ──────────────────────────────────────── */}
      <form
        onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
        className="glass rounded-2xl p-4 flex gap-3"
      >
        <div className="flex-1">
          <Input
            placeholder="Search for anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <button
          type="submit"
          className="gradient-bg text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 transition-all"
        >
          Search
        </button>
      </form>

      {/* ── Filters ─────────────────────────────────────────── */}
      {searched && results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-muted shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
                filter === f.value
                  ? "gradient-bg text-white shadow-[0_2px_10px_rgba(99,102,241,0.25)]"
                  : "glass text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      )}

      {/* ── Empty / no results ──────────────────────────────── */}
      {!loading && searched && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No results found</h3>
          <p className="text-sm text-muted">Try a different keyword or filter.</p>
        </div>
      )}

      {/* ── Initial prompt ──────────────────────────────────── */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-muted" />
          </div>
          <p className="text-sm text-muted">Enter a keyword above to search for content.</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map((r) => (
            <Link key={`${r.type}-${r.id}`} href={href(r)} className="group block">
              <Card hover className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0">
                  <TypeIcon type={r.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {r.title}
                    </p>
                    <Badge variant={typeBadgeVariant(r.type)}>{typeLabel(r.type)}</Badge>
                  </div>
                  {r.parentTitle && (
                    <p className="text-xs text-muted mt-0.5">in {r.parentTitle}</p>
                  )}
                  {r.description && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{r.description}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage(): React.ReactNode {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
