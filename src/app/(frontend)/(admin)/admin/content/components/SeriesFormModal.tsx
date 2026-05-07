// src/app/(admin)/admin/content/components/SeriesFormModal.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { useToast } from "@/context/ToastContext";

interface SeriesData {
  id?: string;
  title: string;
  description: string;
  isPublic: boolean;
  requiresCertificate: boolean;
}

interface SeriesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: SeriesData;
  onSuccess: () => void;
}

export default function SeriesFormModal({ isOpen, onClose, initial, onSuccess }: SeriesFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const isEdit = !!initial?.id;

  const [title, setTitle]     = useState(initial?.title ?? "");
  const [desc, setDesc]       = useState(initial?.description ?? "");
  const [isPublic, setPublic] = useState(initial?.isPublic ?? false);
  const [cert, setCert]       = useState(initial?.requiresCertificate ?? false);
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { error("Missing title", "Series title is required."); return; }

    setSaving(true);
    try {
      const url    = isEdit ? `/api/series/${initial!.id}` : "/api/series";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: desc.trim(), isPublic, requiresCertificate: cert }),
      });
      const data = await res.json();
      if (!res.ok) { error("Save failed", data.error ?? "Something went wrong."); return; }
      success(isEdit ? "Series updated" : "Series created", `"${title}" has been saved.`);
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
      title={isEdit ? "Edit Series" : "New Series"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>{isEdit ? "Save Changes" : "Create Series"}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Series Title"
          placeholder="e.g. New Employee Onboarding"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Description <span className="text-muted font-normal">(optional)</span></label>
          <textarea
            rows={3}
            placeholder="What will employees learn in this series?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setPublic(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Publicly visible</p>
              <p className="text-xs text-muted">All employees can see this series without enrollment</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cert}
              onChange={(e) => setCert(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Issue certificate on completion</p>
              <p className="text-xs text-muted">A certificate is awarded when all modules and exams are passed</p>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
}
