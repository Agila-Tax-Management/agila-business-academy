// src/app/(frontend)/(learner)/profile/page.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { User, Mail, Lock, Save, Eye, EyeOff, Camera, Loader2 } from "lucide-react";
import Card from "@/components/UI/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { authClient } from "@/lib/auth-client";

/* ── Input field styles ─────────────────────────────────────── */
const inputClass =
  "w-full h-10 px-3 rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/90 transition-all";

/* ── Main page ──────────────────────────────────────────────── */
export default function ProfilePage(): React.ReactNode {
  const { user, refreshUser }           = useAuth();
  const { success, error: toastError }  = useToast();
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  // Sync name / image from auth user when it first loads
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  const [localName,  setLocalName]  = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);

  if ((user?.id ?? null) !== prevUserId) {
    setPrevUserId(user?.id ?? null);
    setLocalName(user?.name ?? "");
    setLocalImage(user?.image ?? null);
  }

  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  /* ── Avatar upload ────────────────────────────────────────── */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant preview
    const preview = URL.createObjectURL(file);
    setLocalImage(preview);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("image", file);
      const res  = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const json = await res.json() as { data?: { imageUrl: string }; error?: string };
      if (json.error) {
        toastError("Upload failed", json.error);
        setLocalImage(user?.image ?? null); // revert on error
        return;
      }
      setLocalImage(json.data!.imageUrl);
      void refreshUser();
      success("Avatar updated", "Your profile picture has been saved.");
    } catch {
      toastError("Upload failed", "Could not upload image. Please try again.");
      setLocalImage(user?.image ?? null);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ── Save profile name ───────────────────────────────────── */
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: localName }),
      });
      const json = await res.json() as { data?: { name: string }; error?: string };
      if (json.error) {
        toastError("Update failed", json.error);
        return;
      }
      if (json.data) setLocalName(json.data.name);
      success("Profile updated", "Your display name has been saved.");
    } catch {
      toastError("Update failed", "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Change password ─────────────────────────────────────── */
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toastError("Passwords don't match", "New password and confirmation must be identical.");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Password too short", "New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (authError) {
        toastError("Change failed", authError.message ?? "Check your current password and try again.");
        return;
      }
      success("Password changed", "Your password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toastError("Change failed", "Could not update your password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Profile &amp; Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your account information and security settings.</p>
      </div>

      {/* ── Avatar card ──────────────────────────────────────── */}
      <Card className="p-6 flex items-center gap-5">
        {/* Clickable avatar */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label="Change profile picture"
        >
          {localImage ? (
            <Image
              src={localImage}
              alt={localName || "Avatar"}
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl object-cover shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
              unoptimized={localImage.startsWith("blob:")}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
              {localName?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          {/* Hover / uploading overlay */}
          <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
            {uploading
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />}
          </div>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />

        <div>
          <p className="text-base font-bold text-foreground">{localName || user?.name || "—"}</p>
          <p className="text-sm text-muted">{user?.email ?? "—"}</p>
          <span className="mt-1.5 inline-flex text-xs font-bold gradient-bg text-white px-2.5 py-0.5 rounded-full">
            {user?.role ?? "EMPLOYEE"}
          </span>
          <p className="text-xs text-muted mt-2">Click the photo to change your avatar</p>
        </div>
      </Card>

      {/* ── Personal info form ───────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Personal Information
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/60 bg-white/40 backdrop-blur-sm">
              <Mail className="w-4 h-4 text-muted shrink-0" />
              <span className="text-sm text-muted">{user?.email ?? "—"}</span>
            </div>
            <p className="text-xs text-muted">Email cannot be changed. Contact your administrator.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 gradient-bg text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </Card>

      {/* ── Change password ──────────────────────────────────── */}
      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((p) => !p)}
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((p) => !p)}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Re-enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 gradient-bg text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 disabled:opacity-60 transition-all"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {changingPassword ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Card>
    </div>
  );
}

/* ── Password field helper ──────────────────────────────────── */
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}): React.ReactNode {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3 pr-10 rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/90 transition-all"
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
