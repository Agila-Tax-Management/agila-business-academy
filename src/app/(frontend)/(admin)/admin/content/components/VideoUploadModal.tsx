// src/app/(admin)/admin/content/components/VideoUploadModal.tsx
"use client";

import { useRef, useState } from "react";
import { Upload, Film, X, CheckCircle } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { useToast } from "@/context/ToastContext";

interface Module {
  id: string;
  title: string;
  seriesTitle: string;
}

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: Module[];
  onSuccess: () => void;
}

export default function VideoUploadModal({ isOpen, onClose, modules, onSuccess }: VideoUploadModalProps): React.ReactNode {
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [moduleId, setModuleId]   = useState("");
  const [order, setOrder]         = useState("1");
  const [file, setFile]           = useState<File | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  function reset() {
    setTitle(""); setDesc(""); setModuleId(""); setOrder("1");
    setFile(null); setDragOver(false); setUploading(false); setUploadPct(0);
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onClose();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) setFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())  { error("Missing title", "Please enter a video title."); return; }
    if (!moduleId)      { error("Missing module", "Please select a module."); return; }
    if (!file)          { error("No file selected", "Please upload a video file."); return; }

    setUploading(true);
    setUploadPct(0);

    try {
      const form = new FormData();
      form.append("title",       title.trim());
      form.append("description", description.trim());
      form.append("moduleId",    moduleId);
      form.append("order",       order);
      form.append("video",       file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
      });

      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", "/api/videos");
        xhr.onload  = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error ?? "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(form);
      });

      success("Video uploaded", `"${title}" has been added successfully.`);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Video"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={uploading}>
            {uploading ? `Uploading ${uploadPct}%` : "Upload Video"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileRef.current?.click()}
          className={`
            relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
            flex flex-col items-center justify-center gap-3 py-8
            ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            ${file ? "cursor-default" : ""}
          `}
        >
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-danger hover:underline flex items-center gap-1 mt-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-muted-bg flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drop your video here</p>
                <p className="text-xs text-muted mt-0.5">or click to browse — MP4, MOV, WEBM accepted</p>
              </div>
            </>
          )}

          {/* Upload progress bar */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-border rounded-b-xl overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Video Title"
              placeholder="e.g. Introduction to Company Values"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              leftIcon={<Film className="w-4 h-4" />}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Description <span className="text-muted font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of what this video covers..."
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Module <span className="text-danger">*</span></label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            >
              <option value="">Select a module…</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.seriesTitle} › {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Display Order"
              type="number"
              min="1"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              hint="Position within the module"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
