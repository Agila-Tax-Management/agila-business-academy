// src/app/(learner)/profile/page.tsx
"use client";

import { useState } from "react";
import { User, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your account information and security settings.</p>
      </div>

      {/* Avatar + role */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{user?.name ?? "—"}</p>
          <p className="text-sm text-muted">{user?.email ?? "—"}</p>
          <span className="mt-1 inline-flex text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {user?.role ?? "EMPLOYEE"}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted" />
          Personal Information
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Email Address</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted-bg">
              <Mail className="w-4 h-4 text-muted shrink-0" />
              <span className="text-sm text-muted">{user?.email ?? "—"}</span>
            </div>
            <p className="text-xs text-muted">Email cannot be changed. Contact your administrator.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted" />
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
            <label className="text-xs font-medium text-muted uppercase tracking-wide">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Re-enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4" />
            {changingPassword ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>
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
      <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
