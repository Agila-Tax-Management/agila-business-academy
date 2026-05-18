// src/app/(frontend)/(admin)/admin/content/components/LessonItemModal.tsx
"use client";

import { useRef, useState } from "react";
import { Upload, Film, X, CheckCircle, Image as ImageIcon, FileText } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import { useToast } from "@/context/ToastContext";

type LessonType = "VIDEO" | "IMAGE" | "TEXT";

interface Module {
  id: string;
  title: string;
  seriesTitle: string;
}

interface LessonItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: Module[];
  onSuccess: () => void;
}

export default function LessonItemModal({
  isOpen,
  onClose,
  modules,
  onSuccess,
}: LessonItemModalProps): React.ReactNode {
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [lessonType, setLessonType] = useState<LessonType>("VIDEO");
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [moduleId, setModuleId]     = useState("");
  const [order, setOrder]           = useState("1");

  // VIDEO
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [phase, setPhase]           = useState<"idle" | "uploading" | "saving">("idle");

  // IMAGE
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // TEXT
  const [textContent, setTextContent] = useState("");

  // Reset state when tab changes or modal closes
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setLessonType("VIDEO");
      setTitle(""); setDesc(""); setModuleId(""); setOrder("1");
      setVideoFile(null); setDragOver(false); setUploading(false); setUploadPct(0); setPhase("idle");
      setImageFile(null);
      setTextContent("");
    }
  }

  function handleClose() {
    if (uploading) return;
    onClose();
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // ── VIDEO upload ──────────────────────────────────────────────────────────
  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) setVideoFile(dropped);
  }

  async function uploadToCloudinary(
    file: File,
    resourceType: "video" | "image",
  ): Promise<{ secure_url: string; public_id: string; duration?: number }> {
    const signRes = await fetch("/api/videos/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType }),
    });
    if (!signRes.ok) throw new Error("Could not get upload credentials.");
    const { data: signData } = await signRes.json() as {
      data: { timestamp: number; signature: string; folder: string; resourceType: string; apiKey: string; cloudName: string };
    };

    const form = new FormData();
    form.append("file",          file);
    form.append("api_key",       signData.apiKey);
    form.append("timestamp",     String(signData.timestamp));
    form.append("signature",     signData.signature);
    form.append("folder",        signData.folder);
    form.append("resource_type", resourceType);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
      });
      xhr.open("POST", cloudinaryUrl);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as { secure_url: string; public_id: string; duration?: number });
        } else {
          reject(new Error("Cloudinary upload failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.send(form);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())  { error("Missing title",  "Please enter a title."); return; }
    if (!moduleId)      { error("Missing module", "Please select a module."); return; }

    if (lessonType === "VIDEO" && !videoFile) {
      error("No file selected", "Please upload a video file."); return;
    }
    if (lessonType === "IMAGE" && !imageFile) {
      error("No file selected", "Please upload an image file."); return;
    }
    if (lessonType === "TEXT" && !textContent.trim()) {
      error("No content", "Please enter some text content."); return;
    }

    setUploading(true);
    setUploadPct(0);
    setPhase("uploading");

    try {
      let payload: Record<string, unknown> = {
        title:       title.trim(),
        description: description.trim() || undefined,
        moduleId,
        order:       parseInt(order, 10) || 1,
        type:        lessonType,
      };

      if (lessonType === "VIDEO") {
        const result = await uploadToCloudinary(videoFile!, "video");
        payload = {
          ...payload,
          videoUrl:           result.secure_url,
          cloudinaryPublicId: result.public_id,
          durationSeconds:    Math.round(result.duration ?? 0),
        };
      } else if (lessonType === "IMAGE") {
        const result = await uploadToCloudinary(imageFile!, "image");
        payload = {
          ...payload,
          imageUrl:           result.secure_url,
          cloudinaryPublicId: result.public_id,
        };
      } else {
        payload = { ...payload, textContent: textContent.trim() };
      }

      setPhase("saving");
      const saveRes = await fetch("/api/videos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const body = await saveRes.json() as { error?: string };
        throw new Error(body.error ?? "Failed to save lesson item.");
      }

      const typeLabel = lessonType === "VIDEO" ? "Video" : lessonType === "IMAGE" ? "Image" : "Text";
      success(`${typeLabel} added`, `"${title}" has been added successfully.`);
      onSuccess();
      onClose();
    } catch (err) {
      error("Save failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
      setPhase("idle");
    }
  }

  const buttonLabel =
    phase === "uploading" ? `Uploading ${uploadPct}%` :
    phase === "saving"    ? "Saving…" :
    lessonType === "VIDEO" ? "Upload Video" :
    lessonType === "IMAGE" ? "Upload Image" :
    "Save Content";

  const TABS: { type: LessonType; label: string; icon: React.ReactNode }[] = [
    { type: "VIDEO", label: "Upload Video",  icon: <Film className="w-4 h-4" /> },
    { type: "IMAGE", label: "Image",         icon: <ImageIcon className="w-4 h-4" /> },
    { type: "TEXT",  label: "Text / Reading",icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Content"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={uploading}>{buttonLabel}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Type tabs */}
        <div className="flex gap-1 p-1 bg-muted-bg rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.type}
              type="button"
              disabled={uploading}
              onClick={() => setLessonType(t.type)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                lessonType === t.type
                  ? "gradient-bg text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <Input
          label="Title"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={uploading}
          required
        />
        <Input
          label="Description (optional)"
          placeholder="Brief description"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          disabled={uploading}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/80">Module</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              disabled={uploading}
              className="h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select module…</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.seriesTitle} — {m.title}</option>
              ))}
            </select>
          </div>
          <Input
            label="Order"
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            disabled={uploading}
          />
        </div>

        {/* ── VIDEO tab ─────────────────────────────────────────────── */}
        {lessonType === "VIDEO" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleVideoDrop}
            onClick={() => !videoFile && fileRef.current?.click()}
            className={[
              "relative rounded-xl border-2 border-dashed transition-colors",
              "flex flex-col items-center justify-center gap-3 py-8",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              videoFile ? "cursor-default" : "cursor-pointer",
            ].join(" ")}
          >
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} />
            {videoFile ? (
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                <p className="text-xs text-muted">{formatBytes(videoFile.size)}</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }} className="text-xs text-danger hover:underline flex items-center gap-1 mt-1">
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-muted-bg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted" />
                </div>
                <p className="text-sm text-muted">Drop a video file or <span className="text-primary font-medium">browse</span></p>
                <p className="text-xs text-muted/60">MP4, MOV, AVI — no size limit</p>
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-card/80 rounded-xl flex flex-col items-center justify-center gap-2">
                <div className="w-40 h-2 bg-muted-bg rounded-full overflow-hidden">
                  <div className="h-full gradient-bg rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
                </div>
                <p className="text-sm font-medium text-foreground">{uploadPct}%</p>
              </div>
            )}
          </div>
        )}

        {/* ── IMAGE tab ─────────────────────────────────────────────── */}
        {lessonType === "IMAGE" && (
          <div
            onClick={() => !imageFile && imageRef.current?.click()}
            className={[
              "relative rounded-xl border-2 border-dashed transition-colors",
              "flex flex-col items-center justify-center gap-3 py-8",
              "border-border hover:border-primary/50",
              imageFile ? "cursor-default" : "cursor-pointer",
            ].join(" ")}
          >
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImageFile(f); }} />
            {imageFile ? (
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-medium text-foreground">{imageFile.name}</p>
                <p className="text-xs text-muted">{formatBytes(imageFile.size)}</p>
                <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); }} className="text-xs text-danger hover:underline flex items-center gap-1 mt-1">
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-muted-bg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted" />
                </div>
                <p className="text-sm text-muted">Drop an image or <span className="text-primary font-medium">browse</span></p>
                <p className="text-xs text-muted/60">PNG, JPG, GIF, WEBP</p>
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-card/80 rounded-xl flex flex-col items-center justify-center gap-2">
                <div className="w-40 h-2 bg-muted-bg rounded-full overflow-hidden">
                  <div className="h-full gradient-bg rounded-full transition-all duration-200" style={{ width: `${uploadPct}%` }} />
                </div>
                <p className="text-sm font-medium text-foreground">{uploadPct}%</p>
              </div>
            )}
          </div>
        )}

        {/* ── TEXT tab ──────────────────────────────────────────────── */}
        {lessonType === "TEXT" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/80">Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={uploading}
              rows={10}
              placeholder="Write your lesson content here…&#10;&#10;Use blank lines to separate paragraphs."
              className="px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm leading-relaxed placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y transition-all"
            />
            <p className="text-xs text-muted mt-0.5">
              {textContent.length} characters · employees will read this and mark it as complete
            </p>
          </div>
        )}

      </form>
    </Modal>
  );
}
