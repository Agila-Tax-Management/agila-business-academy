// src/app/(admin)/admin/content/components/ModuleFormModal.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { useToast } from "@/context/ToastContext";

interface Series {
  id: string;
  title: string;
}

interface ModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: Series[];
  initial?: { id?: string; title: string; description: string; seriesId: string; order: number };
  onSuccess: () => void;
}

export default function ModuleFormModal({ isOpen, onClose, series, initial, onSuccess }: ModuleFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const isEdit = !!initial?.id;

  const [title, setTitle]     = useState(initial?.title ?? "");
  const [desc, setDesc]       = useState(initial?.description ?? "");
  const [seriesId, setSeriesId] = useState(initial?.seriesId ?? "");
  const [order, setOrder]     = useState(String(initial?.order ?? 1));
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { error("Missing title", "Module title is required."); return; }
    if (!seriesId)     { error("Missing series", "Please select a series."); return; }

    setSaving(true);
    try {
      const url    = isEdit ? `/api/modules/${initial!.id}` : "/api/modules";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: desc.trim(), seriesId, order: Number(order) }),
      });
      const data = await res.json();
      if (!res.ok) { error("Save failed", data.error ?? "Something went wrong."); return; }
      success(isEdit ? "Module updated" : "Module created", `"${title}" has been saved.`);
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
      title={isEdit ? "Edit Module" : "New Module"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>{isEdit ? "Save Changes" : "Create Module"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Series <span className="text-danger">*</span></label>
          <select
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            required
          >
            <option value="">Select a series…</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        <Input
          label="Module Title"
          placeholder="e.g. Company Policies"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Description <span className="text-muted font-normal">(optional)</span></label>
          <textarea
            rows={3}
            placeholder="What does this module cover?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none transition-colors"
          />
        </div>
        <Input
          label="Display Order"
          type="number"
          min="1"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          hint="Position within the series"
        />
      </form>
    </Modal>
  );
}
