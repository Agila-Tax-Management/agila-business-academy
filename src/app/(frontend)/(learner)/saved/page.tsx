// src/app/(frontend)/(learner)/saved/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Play, BookOpen, Trash2 } from "lucide-react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import { useToast } from "@/context/ToastContext";

interface SavedItem {
  id: string;          // bookmark id
  type: "VIDEO" | "MODULE";
  targetId: string;
  title: string;
  parentTitle?: string;
  seriesId?: string;
  savedAt: string;
}

function href(item: SavedItem): string {
  return item.type === "VIDEO" ? `/learn/${item.targetId}` : `/library/${item.seriesId}/${item.targetId}`;
}

export default function SavedPage(): React.ReactNode {
  const { success, error } = useToast();
  const [items,   setItems]   = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => { if (data.data) setItems(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function remove(bookmarkId: string) {
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== bookmarkId));
      success("Removed", "Bookmark removed.");
    } catch {
      error("Error", "Could not remove bookmark.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-fade-up">
        <div className="h-8 w-40 skeleton rounded-xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Saved</h1>
        <p className="text-muted text-sm mt-1">Videos and modules you bookmarked for later.</p>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Nothing saved yet</h3>
          <p className="text-sm text-muted max-w-xs">
            Bookmark videos and modules while browsing to access them here quickly.
          </p>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
          {items.map((item) => (
            <Card key={item.id} hover className="p-4 flex items-center gap-4 group">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shrink-0">
                {item.type === "VIDEO"
                  ? <Play className="w-4 h-4 text-sky-500" />
                  : <BookOpen className="w-4 h-4 text-indigo-500" />
                }
              </div>

              {/* Content */}
              <Link href={href(item)} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </p>
                  <Badge variant={item.type === "VIDEO" ? "info" : "primary"}>
                    {item.type === "VIDEO" ? "Video" : "Module"}
                  </Badge>
                </div>
                {item.parentTitle && (
                  <p className="text-xs text-muted mt-0.5">in {item.parentTitle}</p>
                )}
                <p className="text-xs text-muted mt-0.5">
                  Saved {new Date(item.savedAt).toLocaleDateString()}
                </p>
              </Link>

              {/* Remove */}
              <button
                onClick={() => remove(item.id)}
                className="shrink-0 w-8 h-8 rounded-xl glass flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-50/80 transition-all opacity-0 group-hover:opacity-100"
                title="Remove bookmark"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
