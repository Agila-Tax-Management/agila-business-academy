// src/app/(admin)/admin/content/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, Search, Upload, BookOpen, Layers, Video,
  MoreVertical, Pencil, Trash2, ChevronRight,
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" onClick={() => setOpenMenu(null)}>
      {/* Page header */}
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

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
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
            placeholder={`Search ${tab}â€¦`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* â”€â”€ Series Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === "series" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Series Title", "Modules", "Videos", "Public", "Certificate", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-3"><div className="h-4 bg-white/40 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredSeries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted text-sm">
                      No series found. Click <strong>New Series</strong> to create one.
                    </td>
                  </tr>
                ) : filteredSeries.map((s) => (
                  <tr key={s.id} className="hover:bg-muted-bg/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{s.title}</p>
                      {s.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{s.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{s.moduleCount}</td>
                    <td className="px-5 py-3.5 text-muted">{s.videoCount}</td>
                    <td className="px-5 py-3.5"><Badge variant={s.isPublic ? "success" : "neutral"}>{s.isPublic ? "Yes" : "No"}</Badge></td>
                    <td className="px-5 py-3.5"><Badge variant={s.requiresCertificate ? "primary" : "neutral"}>{s.requiresCertificate ? "Yes" : "No"}</Badge></td>
                    <td className="px-5 py-3.5 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === s.id ? null : s.id); }}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === s.id && (
                        <div className="absolute right-4 top-10 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingSeries(s); setShowSeriesModal(true); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/60 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => { deleteSeries(s.id, s.title); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-muted-bg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* â”€â”€ Modules Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === "modules" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Module Title", "Series", "Order", "Videos", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-5 py-3"><div className="h-4 bg-muted-bg rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : filteredModules.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted text-sm">No modules found. Click <strong>New Module</strong> to create one.</td></tr>
                ) : filteredModules.map((m) => (
                  <tr key={m.id} className="hover:bg-muted-bg/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{m.title}</p>
                      {m.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{m.description}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-muted text-xs">
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />{m.seriesTitle}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{m.order}</td>
                    <td className="px-5 py-3.5 text-muted">{m.videoCount}</td>
                    <td className="px-5 py-3.5 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === m.id ? null : m.id); }}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === m.id && (
                        <div className="absolute right-4 top-10 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingModule(m); setShowModuleModal(true); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/60 transition-colors"><Pencil className="w-3.5 h-3.5" />Edit</button>
                          <button onClick={() => { deleteModule(m.id, m.title); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-white/60 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* â”€â”€ Videos Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === "videos" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Video Title", "Module", "Series", "Duration", "Order", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-5 py-3"><div className="h-4 bg-muted-bg rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : filteredVideos.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-muted text-sm">No videos yet. Click <strong>Upload Video</strong> to add one.</td></tr>
                ) : filteredVideos.map((v) => (
                  <tr key={v.id} className="hover:bg-muted-bg/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{v.title}</p>
                          {v.description && <p className="text-xs text-muted line-clamp-1 mt-0.5">{v.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">{v.moduleTitle}</td>
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">{v.seriesTitle}</td>
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">
                      {v.durationSeconds > 0 ? formatDuration(v.durationSeconds) : <span className="text-muted/50">â€”</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{v.order}</td>
                    <td className="px-5 py-3.5 relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === v.id ? null : v.id); }}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === v.id && (
                        <div className="absolute right-4 top-10 z-20 w-36 glass-strong rounded-xl shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { deleteVideo(v.id, v.title); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-white/60 transition-colors"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
