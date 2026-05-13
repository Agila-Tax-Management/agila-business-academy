// src/app/(frontend)/(learner)/profile/page.tsx
"use client";

import { useState } from "react";
import { User, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
import Card from "@/components/UI/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function ProfilePage(): React.ReactNode {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: replace with real API call to PATCH /api/profile
      await new Promise((r) => setTimeout(r, 600));
      success("Profile updated", "Your display name has been saved.");
    } catch {
      error("Update failed", "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error("Passwords don't match", "New password and confirmation must be identical.");
      return;
    }
    if (newPassword.length < 8) {
      error("Password too short", "New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      // TODO: replace with real API call to POST /api/profile/change-password
      await new Promise((r) => setTimeout(r, 600));
      success("Password changed", "Your password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      error("Change failed", "Could not update your password. Check your current password and try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Profile &amp; Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your account information and security settings.</p>
      </div>

      {/* ── Avatar card ──────────────────────────────────────── */}
      <Card className="p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-extrabold text-2xl shrink-0 shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{user?.name ?? "—"}</p>
          <p className="text-sm text-muted">{user?.email ?? "—"}</p>
          <span className="mt-1.5 inline-flex text-xs font-bold gradient-bg text-white px-2.5 py-0.5 rounded-full">
            {user?.role ?? "EMPLOYEE"}
          </span>
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
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/90 transition-all"
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Email Address</label>
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
            <Save className="w-4 h-4" />
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
            <label className="text-xs font-semibold text-muted uppercase tracking-wide">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-white/60 bg-white/70 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/90 transition-all"
              placeholder="Re-enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 gradient-bg text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 disabled:opacity-60 transition-all"
          >
            <Lock className="w-4 h-4" />
            {changingPassword ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Card>
    </div>
  );
}

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
