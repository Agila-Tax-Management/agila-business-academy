// src/app/(frontend)/(learner)/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, TrendingUp } from "lucide-react";
import Card from "@/components/UI/Card";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
  completedSeries: number;
  avgScore: number | null;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy   className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal    className="w-5 h-5 text-slate-400"  />;
  if (rank === 3) return <Medal    className="w-5 h-5 text-amber-600"  />;
  return <span className="text-sm font-bold text-muted w-5 text-center">{rank}</span>;
}

function rankBg(rank: number): string {
  if (rank === 1) return "bg-yellow-50/80 border-yellow-200/60";
  if (rank === 2) return "bg-slate-50/80  border-slate-200/60";
  if (rank === 3) return "bg-amber-50/80  border-amber-200/60";
  return "";
}

export default function LeaderboardPage(): React.ReactNode {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => { if (data.data) setEntries(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myEntry = entries.find((e) => e.userId === user?.id);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-fade-up">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Leaderboard</h1>
        <p className="text-muted text-sm mt-1">Top performers ranked by learning points.</p>
      </div>

      {/* ── My rank card ─────────────────────────────────────── */}
      {myEntry && (
        <div className="gradient-bg rounded-2xl p-5 flex items-center gap-5 shadow-[0_4px_24px_rgba(99,102,241,0.30)]">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-extrabold text-white text-lg shadow">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold">Your ranking</p>
            <p className="text-white font-extrabold text-lg">#{myEntry.rank} — {myEntry.name}</p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Points</p>
            <p className="text-white font-extrabold text-xl">{myEntry.points.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* ── Podium (top 3) ───────────────────────────────────── */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[entries[1], entries[0], entries[2]].map((e, idx) => {
            const isMid = idx === 1;
            return (
              <Card
                key={e.userId}
                className={`flex flex-col items-center p-4 gap-2 ${isMid ? "border-yellow-200/60 shadow-[0_4px_20px_rgba(250,204,21,0.20)]" : ""}`}
              >
                <RankIcon rank={e.rank} />
                <div
                  className={`w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center font-extrabold text-white text-lg shadow ${isMid ? "w-14 h-14 text-xl" : ""}`}
                >
                  {e.name[0].toUpperCase()}
                </div>
                <p className="text-xs font-bold text-foreground text-center truncate w-full">{e.name.split(" ")[0]}</p>
                <p className="text-sm font-extrabold text-primary">{e.points.toLocaleString()} pts</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Full table ───────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">All Rankings</h2>
        </div>
        {entries.map((e) => {
          const isMe = e.userId === user?.id;
          return (
            <div
              key={e.userId}
              className={`glass-strong rounded-2xl px-4 py-3 flex items-center gap-4 border transition-all ${
                isMe
                  ? "border-primary/40 shadow-[0_2px_12px_rgba(99,102,241,0.15)]"
                  : `border-white/40 ${rankBg(e.rank)}`
              }`}
            >
              {/* Rank */}
              <div className="w-6 flex items-center justify-center shrink-0">
                <RankIcon rank={e.rank} />
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl gradient-bg flex items-center justify-center font-bold text-white text-sm shrink-0 ${isMe ? "shadow-[0_2px_10px_rgba(99,102,241,0.30)]" : ""}`}>
                {e.name[0].toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                  {e.name} {isMe && <span className="text-xs font-semibold text-muted">(you)</span>}
                </p>
                <p className="text-xs text-muted">
                  {e.completedSeries} series completed
                  {e.avgScore !== null && ` · ${e.avgScore}% avg`}
                </p>
              </div>

              {/* Points */}
              <div className="shrink-0 flex items-center gap-1 text-sm font-extrabold text-foreground">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                {e.points.toLocaleString()}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">No leaderboard data yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
