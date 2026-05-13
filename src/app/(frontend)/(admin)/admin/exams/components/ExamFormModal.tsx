// src/app/(frontend)/(admin)/admin/exams/components/ExamFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { useToast } from "@/context/ToastContext";
import type { ExamItem, ExamScope } from "@/app/(backend)/api/exams/route";

interface LinkedOption {
  id: string;
  title: string;
}

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: ExamItem;
  onSuccess: () => void;
}

export default function ExamFormModal({
  isOpen,
  onClose,
  initial,
  onSuccess,
}: ExamFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const isEdit = !!initial?.id;

  const [title, setTitle]         = useState(initial?.title ?? "");
  const [scope, setScope]         = useState<ExamScope>(initial?.scope ?? "VIDEO");
  const [linkedId, setLinkedId]   = useState(initial?.linkedId ?? "");
  const [passingScore, setPassing] = useState(initial?.passingScore ?? 75);
  const [maxAttempts, setMaxAtt]  = useState(initial?.maxAttempts ?? 0);
  const [timeLimitMin, setTime]   = useState<number | "">(initial?.timeLimitMin ?? "");
  const [saving, setSaving]       = useState(false);

  const [series,  setSeries]  = useState<LinkedOption[]>([]);
  const [modules, setModules] = useState<LinkedOption[]>([]);
  const [videos,  setVideos]  = useState<LinkedOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  // Reset form when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTitle(initial?.title ?? "");
      setScope(initial?.scope ?? "VIDEO");
      setLinkedId(initial?.linkedId ?? "");
      setPassing(initial?.passingScore ?? 75);
      setMaxAtt(initial?.maxAttempts ?? 0);
      setTime(initial?.timeLimitMin ?? "");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    setLoadingOpts(true);
    Promise.all([
      fetch("/api/series").then((r) => r.json()),
      fetch("/api/modules").then((r) => r.json()),
      fetch("/api/videos").then((r) => r.json()),
    ])
      .then(([s, m, v]: [{ data?: LinkedOption[] }, { data?: LinkedOption[] }, { data?: LinkedOption[] }]) => {
        setSeries(s.data ?? []);
        setModules(m.data ?? []);
        setVideos(v.data ?? []);
      })
      .catch(() => error("Load failed", "Could not load linked options."))
      .finally(() => setLoadingOpts(false));
  }, [isOpen, error]);

  const linkedOptions =
    scope === "SERIES" ? series : scope === "MODULE" ? modules : videos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { error("Missing title", "Exam title is required."); return; }
    if (!linkedId)     { error("Missing link", `Please select a ${scope.toLowerCase()} to link this exam to.`); return; }

    const linkedTitle = linkedOptions.find((o) => o.id === linkedId)?.title ?? "";

    setSaving(true);
    try {
      const url    = isEdit ? `/api/exams/${initial!.id}` : "/api/exams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scope,
          linkedId,
          linkedTo: linkedTitle,
          passingScore: Number(passingScore),
          maxAttempts: Number(maxAttempts),
          timeLimitMin: timeLimitMin === "" ? null : Number(timeLimitMin),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error("Save failed", data.error ?? "Something went wrong."); return; }
      success(isEdit ? "Exam updated" : "Exam created", `"${title}" has been saved.`);
      onSuccess();
      onClose();
    } catch {
      error("Save failed", "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Exam" : "New Exam"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Save Changes" : "Create Exam"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Exam Title"
          placeholder="e.g. Company Policies Quiz"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Scope selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Scope</label>
          <div className="flex gap-2">
            {(["VIDEO", "MODULE", "SERIES"] as ExamScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setScope(s); setLinkedId(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  scope === s
                    ? "gradient-bg text-white border-transparent shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                    : "border-white/50 bg-white/40 text-muted hover:text-foreground hover:bg-white/60"
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Linked entity dropdown */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Linked {scope.charAt(0) + scope.slice(1).toLowerCase()}
          </label>
          {loadingOpts ? (
            <div className="h-10 rounded-xl bg-white/40 animate-pulse" />
          ) : (
            <select
              value={linkedId}
              onChange={(e) => setLinkedId(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              required
            >
              <option value="">Select a {scope.toLowerCase()}…</option>
              {linkedOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* Passing score + max attempts */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Passing Score (%)"
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={(e) => setPassing(Number(e.target.value))}
          />
          <Input
            label="Max Attempts (0 = ∞)"
            type="number"
            min={0}
            value={maxAttempts}
            onChange={(e) => setMaxAtt(Number(e.target.value))}
          />
        </div>

        <Input
          label="Time Limit (minutes, optional)"
          type="number"
          min={1}
          placeholder="Leave blank for no time limit"
          value={timeLimitMin}
          onChange={(e) => setTime(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </form>
    </Modal>
  );
}
