// src/components/UI/NotificationBell.tsx
"use client";

import { Bell } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "ACTION_REQUIRED";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string | null;
}

const typeDot: Record<Notification["type"], string> = {
  INFO:            "bg-blue-500",
  SUCCESS:         "bg-emerald-500",
  WARNING:         "bg-amber-500",
  ERROR:           "bg-red-500",
  ACTION_REQUIRED: "bg-violet-500",
};

export default function NotificationBell(): React.ReactNode {
  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(false);
  const ref                               = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/notifications?limit=10")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.data?.notifications)) setNotifications(data.data.notifications); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function markAllRead() {
    fetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m    = Math.floor(diff / 60_000);
    if (m < 1)   return "just now";
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/30">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full skeleton shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 skeleton" />
                      <div className="h-2.5 w-full skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                <p className="text-sm text-muted">All caught up!</p>
              </div>
            )}
            {notifications.map((n) => {
              const inner = (
                <div
                  className={`px-4 py-3 hover:bg-white/50 transition-colors border-b border-white/15 last:border-0 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeDot[n.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                </div>
              );
              return n.actionUrl ? (
                <Link key={n.id} href={n.actionUrl} onClick={() => setOpen(false)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
