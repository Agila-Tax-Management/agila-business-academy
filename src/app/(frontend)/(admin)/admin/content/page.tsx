// src/app/(admin)/admin/content/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, Search, Upload, BookOpen, Layers, Video,
  MoreVertical, Pencil, Trash2, ChevronRight, Globe, Lock, Award,
  Clock,
} from "lucide-react";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import Input from "@/components/UI/Input";
import Card from "@/components/UI/Card";
import { useToast } from "@/context/ToastContext";
import SeriesFormModal from "./components/SeriesFormModal";
import ModuleFormModal from "./components/ModuleFormModal";
import VideoUploadModal from "./components/VideoUploadModal";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SeriesRow {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  requiresCertificate: boolean;
  moduleCount: number;
  videoCount: number;
}

interface ModuleRow {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  description: string | null;
  order: number;
  videoCount: number;
}

interface VideoRow {
  id: string;
  moduleId: string;
  moduleTitle: string;
  seriesTitle: string;
  title: string;
  description: string | null;
  durationSeconds: number;
  order: number;
  videoUrl: string;
}

type Tab = "series" | "modules" | "videos";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ContentPage(): React.ReactNode {
  const { error: toastError, success } = useToast();

  const [tab, setTab] = useState<Tab>("series");
  const [search, setSearch] = useState("");

  const [series,  setSeries]  = useState<SeriesRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [videos,  setVideos]  = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showSeriesModal, setShowSeriesModal]   = useState(false);
  const [showModuleModal, setShowModuleModal]   = useState(false);
  const [showUploadModal, setShowUploadModal]   = useState(false);
  const [editingSeries, setEditingSeries]       = useState<SeriesRow | null>(null);
  const [editingModule, setEditingModule]       = useState<ModuleRow | null>(null);

  // Dropdown open state
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, mRes, vRes] = await Promise.all([
        fetch("/api/series"),
        fetch("/api/modules"),
        fetch("/api/videos"),
      ]);
      const [sData, mData, vData] = await Promise.all([sRes.json(), mRes.json(), vRes.json()]);
      if (sData.data) setSeries(sData.data);
      if (mData.data) setModules(mData.data);
      if (vData.data) setVideos(vData.data);
    } catch {
      toastError("Load failed", "Could not load content. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);
  useEffect(() => { void fetchAll(); }, [fetchAll]);

  async function deleteSeries(id: string, title: string) {
    if (!confirm(`Delete series "${title}" and all its modules and videos?`)) return;
    const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
    if (res.ok) { success("Deleted", `"${title}" has been removed.`); void fetchAll(); }
    else toastError("Delete failed", "Could not delete the series.");
  }

  async function deleteModule(id: string, title: string) {
    if (!confirm(`Delete module "${title}" and all its videos?`)) return;
    const res = await fetch(`/api/modules/${id}`, { method: "DELETE" });
    if (res.ok) { success("Deleted", `"${title}" has been removed.`); void fetchAll(); }
    else toastError("Delete failed", "Could not delete the module.");
  }

  async function deleteVideo(id: string, title: string) {
    if (!confirm(`Delete video "${title}"?`)) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) { success("Deleted", `"${title}" has been removed.`); void fetchAll(); }
    else toastError("Delete failed", "Could not delete the video.");
  }

  // Module list for VideoUploadModal
  const moduleOptions = modules.map((m) => ({
    id: m.id,
    title: m.title,
    seriesTitle: m.seriesTitle,
  }));

  // Series list for ModuleFormModal
  const seriesOptions = series.map((s) => ({ id: s.id, title: s.title }));

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "series",  label: "Series",  icon: <BookOpen className="w-4 h-4" />, count: series.length },
    { key: "modules", label: "Modules", icon: <Layers className="w-4 h-4" />,   count: modules.length },
    { key: "videos",  label: "Videos",  icon: <Video className="w-4 h-4" />,    count: videos.length },
  ];

  const filteredSeries  = series.filter((s)  => s.title.toLowerCase().includes(search.toLowerCase()));
  const filteredModules = modules.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.seriesTitle.toLowerCase().includes(search.toLowerCase()));
  const filteredVideos  = videos.filter((v)  => v.title.toLowerCase().includes(search.toLowerCase()) || v.moduleTitle.toLowerCase().includes(search.toLowerCase()));

  const totalDuration = videos.reduce((acc, v) => acc + v.durationSeconds, 0);
  function fmtHours(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" onClick={() => setOpenMenu(null)}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted text-sm mt-1">Manage series, modules, and training videos.</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "series"  && <Button onClick={() => { setEditingSeries(null); setShowSeriesModal(true); }} size="sm"><Plus className="w-4 h-4" />New Series</Button>}
          {tab === "modules" && <Button onClick={() => { setEditingModule(null); setShowModuleModal(true); }} size="sm"><Plus className="w-4 h-4" />New Module</Button>}
          {tab === "videos"  && <Button onClick={() => setShowUploadModal(true)} size="sm"><Upload className="w-4 h-4" />Upload Video</Button>}
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Series",  value: series.length,  icon: <BookOpen className="w-4 h-4" />, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Modules", value: modules.length, icon: <Layers className="w-4 h-4" />,   color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { label: "Videos",  value: videos.length,  icon: <Video className="w-4 h-4" />,    color: "text-emerald-500",bg: "bg-emerald-500/10"},
          { label: "Total Duration", value: loading ? "—" : fmtHours(totalDuration), icon: <Clock className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 px-4 py-3">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {loading ? <span className="inline-block w-8 h-4 skeleton rounded" /> : s.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs + Search ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex border border-white/40 rounded-xl overflow-hidden shrink-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "gradient-bg text-white"
                  : "bg-white/40 text-muted hover:text-foreground hover:bg-white/60"
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-muted-bg text-muted"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1 sm:max-w-xs">
          <Input
            placeholder={`Search ${tab}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* ── Series ────────────────────────────────────────────── */}
      {tab === "series" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 skeleton rounded w-48" />
                    <div className="h-3 skeleton rounded w-72" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 skeleton rounded-full" />
                    <div className="h-6 w-16 skeleton rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No series yet</p>
              <p className="text-xs text-muted mb-4">Click <strong>New Series</strong> to create your first training course.</p>
              <Button size="sm" onClick={() => { setEditingSeries(null); setShowSeriesModal(true); }}><Plus className="w-4 h-4" />New Series</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredSeries.map((s) => (
                <li key={s.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-muted-bg/40 transition-colors">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-500" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{s.title}</p>
                    {s.description
                      ? <p className="text-xs text-muted mt-0.5 line-clamp-1">{s.description}</p>
                      : <p className="text-xs text-muted/50 mt-0.5 italic">No description</p>}
                  </div>
                  {/* Stats chips */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs text-muted bg-muted-bg px-2.5 py-1 rounded-full">
                      <Layers className="w-3 h-3" />{s.moduleCount} mod
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted bg-muted-bg px-2.5 py-1 rounded-full">
                      <Video className="w-3 h-3" />{s.videoCount} vid
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    {s.isPublic
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full"><Globe className="w-3 h-3" />Public</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-muted-bg/60 px-2.5 py-1 rounded-full"><Lock className="w-3 h-3" />Private</span>}
                    {s.requiresCertificate && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full"><Award className="w-3 h-3" />Cert</span>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === s.id ? null : s.id); }}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === s.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingSeries(s); setShowSeriesModal(true); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/60 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />Edit
                        </button>
                        <button onClick={() => { deleteSeries(s.id, s.title); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-muted-bg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Modules ───────────────────────────────────────────── */}
      {tab === "modules" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 skeleton rounded w-48" />
                    <div className="h-3 skeleton rounded w-32" />
                  </div>
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No modules yet</p>
              <p className="text-xs text-muted mb-4">Click <strong>New Module</strong> to add a chapter to a series.</p>
              <Button size="sm" onClick={() => { setEditingModule(null); setShowModuleModal(true); }}><Plus className="w-4 h-4" />New Module</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredModules.map((m) => (
                <li key={m.id} className="group flex items-center gap-4 px-5 py-4 hover:bg-muted-bg/40 transition-colors">
                  {/* Order badge + icon */}
                  <div className="relative w-10 h-10 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full gradient-bg text-white text-[9px] font-bold flex items-center justify-center shadow">
                      {m.order}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{m.title}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted mt-0.5">
                      <BookOpen className="w-3 h-3 shrink-0 text-violet-400" />
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{m.seriesTitle}</span>
                    </span>
                  </div>
                  {/* Video count chip */}
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted bg-muted-bg px-2.5 py-1 rounded-full shrink-0">
                    <Video className="w-3 h-3" />{m.videoCount} videos
                  </span>
                  {/* Actions */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id); }}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === m.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setEditingModule(m); setShowModuleModal(true); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/60 transition-colors"><Pencil className="w-3.5 h-3.5" />Edit</button>
                        <button onClick={() => { deleteModule(m.id, m.title); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-white/60 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Videos ────────────────────────────────────────────── */}
      {tab === "videos" && (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-16 h-10 skeleton rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 skeleton rounded w-52" />
                    <div className="h-3 skeleton rounded w-36" />
                  </div>
                  <div className="h-6 w-12 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                <Video className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No videos yet</p>
              <p className="text-xs text-muted mb-4">Click <strong>Upload Video</strong> to add training content.</p>
              <Button size="sm" onClick={() => setShowUploadModal(true)}><Upload className="w-4 h-4" />Upload Video</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredVideos.map((v) => (
                <li key={v.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted-bg/40 transition-colors">
                  {/* Thumbnail placeholder */}
                  <div className="w-16 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                    <Video className="w-4 h-4 text-emerald-500" />
                    {v.durationSeconds > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-mono px-1 rounded leading-4">
                        {formatDuration(v.durationSeconds)}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{v.title}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-muted mt-0.5">
                      <Layers className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">{v.moduleTitle}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <BookOpen className="w-3 h-3 text-violet-400 shrink-0" />
                      <span className="truncate">{v.seriesTitle}</span>
                    </span>
                  </div>
                  {/* Order chip */}
                  <span className="hidden sm:inline-flex items-center text-xs text-muted bg-muted-bg px-2 py-1 rounded-full shrink-0">
                    #{v.order}
                  </span>
                  {/* Actions */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === v.id ? null : v.id); }}
                      className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === v.id && (
                      <div className="absolute right-0 top-8 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { deleteVideo(v.id, v.title); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-white/60 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <SeriesFormModal
        isOpen={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        initial={editingSeries ? { ...editingSeries, description: editingSeries.description ?? "" } : undefined}
        onSuccess={fetchAll}
      />
      <ModuleFormModal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        series={seriesOptions}
        initial={editingModule ? { ...editingModule, description: editingModule.description ?? "", order: editingModule.order } : undefined}
        onSuccess={fetchAll}
      />
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        modules={moduleOptions}
        onSuccess={fetchAll}
      />
    </div>
  );
}
