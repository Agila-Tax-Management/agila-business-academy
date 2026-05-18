// src/app/(frontend)/(admin)/admin/content/components/VideoUploadModal.tsx
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
  const [phase, setPhase]         = useState<"idle" | "uploading" | "saving">("idle");

  function reset() {
    setTitle(""); setDesc(""); setModuleId(""); setOrder("1");
    setFile(null); setDragOver(false); setUploading(false); setUploadPct(0);
    setPhase("idle");
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
    if (!title.trim()) { error("Missing title", "Please enter a video title."); return; }
    if (!moduleId)     { error("Missing module", "Please select a module."); return; }
    if (!file)         { error("No file selected", "Please upload a video file."); return; }

    setUploading(true);
    setUploadPct(0);
    setPhase("uploading");

    try {
      // 1ï¸âƒ£ Get signed upload params from our server
      const signRes = await fetch("/api/videos/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("Could not get upload credentials.");
      const { data: signData } = await signRes.json() as {
        data: { timestamp: number; signature: string; folder: string; apiKey: string; cloudName: string };
      };

      // 2ï¸âƒ£ Upload file directly to Cloudinary (browser â†’ Cloudinary)
      const form = new FormData();
      form.append("file",          file);
      form.append("api_key",       signData.apiKey);
      form.append("timestamp",     String(signData.timestamp));
      form.append("signature",     signData.signature);
      form.append("folder",        signData.folder);
      form.append("resource_type", "video");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`;

      const uploadResult = await new Promise<{ secure_url: string; public_id: string; duration?: number }>(
        (resolve, reject) => {
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
        }
      );

      // 3ï¸âƒ£ Save metadata to our database
      setPhase("saving");
      const saveRes = await fetch("/api/videos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:              title.trim(),
          description:        description.trim() || undefined,
          moduleId,
          order:              parseInt(order, 10) || 1,
          videoUrl:           uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          durationSeconds:    Math.round(uploadResult.duration ?? 0),
        }),
      });

      if (!saveRes.ok) {
        const body = await saveRes.json() as { error?: string };
        throw new Error(body.error ?? "Failed to save video.");
      }

      success("Video uploaded", `"${title}" has been added successfully.`);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
      setPhase("idle");
    }
  }

  const buttonLabel =
    phase === "uploading" ? `Uploading ${uploadPct}%` :
    phase === "saving"    ? "Savingâ€¦" :
    "Upload Video";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Video"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={uploading}>{buttonLabel}</Button>
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
          className={[
            "relative rounded-xl border-2 border-dashed transition-colors",
            "flex flex-col items-center justify-center gap-3 py-8",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            file ? "cursor-default" : "cursor-pointer",
          ].join(" ")}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

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
                <p className="text-xs text-muted mt-0.5">or click to browse MP4, MOV, WEBM accepted</p>
              </div>
            </>
          )}

          {phase === "uploading" && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-border rounded-b-xl overflow-hidden">
              <div className="h-full bg-primary transition-all duration-150" style={{ width: `${uploadPct}%` }} />
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
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Module <span className="text-danger">*</span>
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            >
              <option value="">Select a module</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.seriesTitle} â€º {m.title}</option>
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
