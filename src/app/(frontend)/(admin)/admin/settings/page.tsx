// src/app/(frontend)/(admin)/admin/settings/page.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import {
  Plus, Trash2, Pencil, Check, X, Award, GripVertical,
  UserCheck, User, Lock, Camera, Loader2, Eye, EyeOff,
  ShieldCheck, ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import type { SignatoryItem, AdminUserItem } from "@/app/(backend)/api/admin/certificate-settings/route";
import type { AdminUserRow } from "@/app/(backend)/api/admin/admins/route";

type SettingsTab = "account" | "signatories" | "admins";

interface EditState {
  id:       string;
  name:     string;
  position: string;
}

export default function AdminSettingsPage(): React.ReactNode {
  const { success, error } = useToast();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<SettingsTab>("account");

  // ── Account tab state ────────────────────────────────────────
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  const [localName,  setLocalName]  = useState("");
  const [localPosition, setLocalPosition] = useState("");
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  if ((user?.id ?? null) !== prevUserId) {
    setPrevUserId(user?.id ?? null);
    setLocalName(user?.name ?? "");
    setLocalPosition((user as unknown as Record<string, unknown>)?.position as string ?? "");
    setLocalImage(user?.image ?? null);
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ── Signatories tab state ────────────────────────────────────
  const [signatories, setSignatories] = useState<SignatoryItem[]>([]);
  const [adminUsers,  setAdminUsers]  = useState<AdminUserItem[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Admins tab state ─────────────────────────────────────────
  const [adminList,     setAdminList]     = useState<AdminUserRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [addingAdmin,   setAddingAdmin]   = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<string | null>(null);
  const [togglingRole,  setTogglingRole]  = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", position: "", role: "ADMIN" as "ADMIN" | "SUPER_ADMIN" });
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [adding,      setAdding]      = useState(false);
  const [addingUser,  setAddingUser]  = useState<string | null>(null);
  const [addName,     setAddName]     = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [editState,   setEditState]   = useState<EditState | null>(null);

  useEffect(() => {
    fetch("/api/admin/certificate-settings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.data?.signatories)) setSignatories(data.data.signatories);
        if (Array.isArray(data.data?.adminUsers))  setAdminUsers(data.data.adminUsers);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Admins tab handlers ───────────────────────────────────────
  async function fetchAdmins() {
    setAdminsLoading(true);
    try {
      const res  = await fetch("/api/admin/admins");
      const json = await res.json() as { data?: AdminUserRow[]; error?: string };
      if (json.data) setAdminList(json.data);
    } finally {
      setAdminsLoading(false);
    }
  }

  // Fetch admins only when the tab is opened
  const [adminsFetched, setAdminsFetched] = useState(false);
  if (tab === "admins" && !adminsFetched) {
    setAdminsFetched(true);
    void fetchAdmins();
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAddingAdmin(true);
    try {
      const res  = await fetch("/api/admin/admins", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(adminForm),
      });
      const json = await res.json() as { data?: AdminUserRow; error?: string };
      if (!res.ok) { error("Failed to create", json.error ?? "Could not create admin account."); return; }
      setAdminList((prev) => [...prev, json.data!]);
      setAdminForm({ name: "", email: "", password: "", position: "", role: "ADMIN" });
      setShowAddForm(false);
      success("Admin created", `${adminForm.name} has been added as ${adminForm.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}.`);
    } finally {
      setAddingAdmin(false);
    }
  }

  async function handleToggleRole(adminUser: AdminUserRow) {
    const newRole = adminUser.role === "ADMIN" ? "SUPER_ADMIN" : "ADMIN";
    setTogglingRole(adminUser.id);
    try {
      const res  = await fetch(`/api/admin/admins/${adminUser.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: newRole }),
      });
      const json = await res.json() as { data?: AdminUserRow; error?: string };
      if (!res.ok) { error("Failed to update", json.error ?? "Could not change role."); return; }
      setAdminList((prev) => prev.map((a) => a.id === adminUser.id ? { ...a, role: newRole } : a));
      success("Role updated", `${adminUser.name} is now ${newRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}.`);
    } finally {
      setTogglingRole(null);
    }
  }

  async function handleDeleteAdmin(adminUser: AdminUserRow) {
    if (!confirm(`Remove ${adminUser.name}'s admin access? This cannot be undone.`)) return;
    setDeletingAdmin(adminUser.id);
    try {
      const res = await fetch(`/api/admin/admins/${adminUser.id}`, { method: "DELETE" });
      if (!res.ok) { error("Failed to delete", "Could not remove admin account."); return; }
      setAdminList((prev) => prev.filter((a) => a.id !== adminUser.id));
      success("Removed", `${adminUser.name} has been removed.`);
    } finally {
      setDeletingAdmin(null);
    }
  }

  // ── Account handlers ─────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalImage(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res  = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const json = await res.json() as { data?: { imageUrl: string }; error?: string };
      if (json.error) {
        error("Upload failed", json.error);
        setLocalImage(user?.image ?? null);
        return;
      }
      setLocalImage(json.data!.imageUrl);
      void refreshUser();
      success("Avatar updated", "Profile picture saved.");
    } catch {
      error("Upload failed", "Could not upload image. Please try again.");
      setLocalImage(user?.image ?? null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res  = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: localName, position: localPosition }),
      });
      const json = await res.json() as { data?: { name: string; position?: string }; error?: string };
      if (json.error) { error("Update failed", json.error); return; }
      void refreshUser();
      success("Profile updated", "Your profile has been saved.");
    } catch {
      error("Update failed", "Could not save your profile. Please try again.");
    } finally {
      setSavingProfile(false);
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
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (authError) {
        error("Change failed", authError.message ?? "Check your current password and try again.");
        return;
      }
      success("Password changed", "Your password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      error("Change failed", "Could not update your password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  // ── Signatory handlers ───────────────────────────────────────
  // Check if a user is already a signatory (by name match)
  function isAlreadyAdded(adminUser: AdminUserItem) {
    return signatories.some(
      (s) => s.name.trim().toLowerCase() === adminUser.name.trim().toLowerCase()
    );
  }

  async function handleAddUser(adminUser: AdminUserItem) {
    setAddingUser(adminUser.id);
    try {
      const r = await fetch("/api/admin/certificate-settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     adminUser.name,
          position: adminUser.position ?? "Administrator",
        }),
      });
      const data = await r.json();
      if (!r.ok) { error("Failed to add", data.error ?? "Could not add signatory."); return; }
      setSignatories((prev) => [...prev, data.data.signatory]);
      success("Signatory added", `${adminUser.name} has been added.`);
    } finally {
      setAddingUser(null);
    }
  }

  async function handleAdd() {
    if (!addName.trim() || !addPosition.trim()) return;
    setAdding(true);
    try {
      const r = await fetch("/api/admin/certificate-settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: addName.trim(), position: addPosition.trim() }),
      });
      const data = await r.json();
      if (!r.ok) { error("Failed to add", data.error ?? "Could not add signatory."); return; }
      setSignatories((prev) => [...prev, data.data.signatory]);
      setAddName("");
      setAddPosition("");
      success("Signatory added", `${data.data.signatory.name} has been added.`);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/certificate-settings/${editState.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: editState.name.trim(), position: editState.position.trim() }),
      });
      const data = await r.json();
      if (!r.ok) { error("Failed to save", data.error ?? "Could not update signatory."); return; }
      setSignatories((prev) =>
        prev.map((s) => s.id === editState.id ? data.data.signatory : s)
      );
      setEditState(null);
      success("Saved", "Signatory updated.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeleting(id);
    try {
      const r = await fetch(`/api/admin/certificate-settings/${id}`, { method: "DELETE" });
      if (!r.ok) { error("Failed to delete", "Could not remove signatory."); return; }
      setSignatories((prev) => prev.filter((s) => s.id !== id));
      success("Removed", `${name} has been removed.`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-up">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage your account and platform configuration.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border border-white/40 rounded-xl overflow-hidden mb-6 w-fit">
        {([
          { key: "account",     label: "Account",     icon: <User className="w-4 h-4" /> },
          { key: "signatories", label: "Signatories", icon: <Award className="w-4 h-4" /> },
          { key: "admins",      label: "Admins",      icon: <ShieldCheck className="w-4 h-4" /> },
        ] as { key: SettingsTab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "gradient-bg text-white"
                : "bg-white/40 text-muted hover:text-foreground hover:bg-white/60"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Account tab ───────────────────────────────────────── */}
      {tab === "account" && (
        <div className="space-y-6">

          {/* Avatar + profile */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Profile</h2>
                <p className="text-xs text-muted">Update your display name, position, and avatar.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {localImage ? (
                    <Image
                      src={localImage}
                      alt={user?.name ?? "Admin"}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover shadow"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-xl shadow">
                      {user?.name?.[0]?.toUpperCase() ?? "A"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full glass-strong border border-white/50 flex items-center justify-center text-foreground hover:text-primary transition-colors"
                  >
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="text-xs text-muted">
                  <p className="font-medium text-foreground text-sm">{user?.name ?? "—"}</p>
                  <p>{user?.email ?? "—"}</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline mt-1">
                    Change photo
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Display Name</label>
                <input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Position */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Position / Title</label>
                <input
                  value={localPosition}
                  onChange={(e) => setLocalPosition(e.target.value)}
                  placeholder="e.g. HR Manager"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted">Used as default when adding yourself as a certificate signatory.</p>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Profile"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change password */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Change Password</h2>
                <p className="text-xs text-muted">Must be at least 8 characters.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* New password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Confirm password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ── Signatories tab ───────────────────────────────────── */}
      {tab === "signatories" && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Certificate Signatories</h2>
              <p className="text-xs text-muted mt-0.5">
                These names and positions appear at the bottom of printed certificates.
              </p>
            </div>
          </div>

          {/* Current signatories */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          ) : signatories.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">
              No signatories configured. Add from admin staff or add manually below.
            </p>
          ) : (
            <ul className="space-y-2">
              {signatories.map((s) => (
                <li key={s.id} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                  <GripVertical className="w-4 h-4 text-muted/40 shrink-0" />

                  {editState?.id === s.id ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <input
                        value={editState.name}
                        onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                        placeholder="Full name"
                        className="flex-1 min-w-30 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                      <input
                        value={editState.position}
                        onChange={(e) => setEditState({ ...editState, position: e.target.value })}
                        placeholder="Position / title"
                        className="flex-1 min-w-30 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={handleSaveEdit} disabled={saving}
                          className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditState(null)}
                          className="p-1.5 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted truncate">{s.position}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditState({ id: s.id, name: s.name, position: s.position })}
                          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/60 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={deleting === s.id}
                          className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add from admin staff */}
          {!loading && adminUsers.length > 0 && (
            <div className="border-t border-white/30 pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Add from Admin Staff</p>
              </div>
              <div className="flex flex-col gap-2">
                {adminUsers.map((u) => {
                  const added = isAlreadyAdded(u);
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-colors ${
                        added ? "opacity-50 border-border/30 bg-muted/5" : "glass border-white/40 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{u.name}</span>
                          <Badge variant={u.role === "SUPER_ADMIN" ? "primary" : "neutral"} size="sm">
                            {u.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted truncate">{u.position ?? "No position set"}</p>
                      </div>
                      <button
                        onClick={() => handleAddUser(u)}
                        disabled={added || addingUser === u.id}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          added
                            ? "text-muted cursor-default"
                            : "text-primary hover:bg-primary hover:text-white border border-primary/30"
                        }`}
                      >
                        {added ? (
                          <><Check className="w-3.5 h-3.5" /> Added</>
                        ) : addingUser === u.id ? (
                          "Adding…"
                        ) : (
                          <><Plus className="w-3.5 h-3.5" /> Add</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Manual add */}
          <div className="border-t border-white/30 pt-5 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Add Manually</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Full name"
                className="flex-1 min-w-37.5 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
              <input
                value={addPosition}
                onChange={(e) => setAddPosition(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); }}
                placeholder="Position / title (e.g. HR Manager)"
                className="flex-1 min-w-45 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
              <Button onClick={handleAdd} disabled={adding || !addName.trim() || !addPosition.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                {adding ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Admins tab ────────────────────────────────────────── */}
      {tab === "admins" && (
        <div className="space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Admin Accounts</h2>
              <p className="text-xs text-muted mt-0.5">Manage admin and super admin users. Only super admins can make changes.</p>
            </div>
            {user?.role === "SUPER_ADMIN" && (
              <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
                <Plus className="w-4 h-4" />
                {showAddForm ? "Cancel" : "Add Admin"}
              </Button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && user?.role === "SUPER_ADMIN" && (
            <Card className="p-5">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">New Admin Account</p>
              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">Full Name</label>
                    <input
                      value={adminForm.name}
                      onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">Email</label>
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="admin@agila.ph"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">Position / Title</label>
                    <input
                      value={adminForm.position}
                      onChange={(e) => setAdminForm((f) => ({ ...f, position: e.target.value }))}
                      placeholder="e.g. HR Manager"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">Temporary Password</label>
                    <div className="relative">
                      <input
                        type={showAdminPass ? "text" : "password"}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min. 8 characters"
                        required
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                      <button type="button" onClick={() => setShowAdminPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                        {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Role selector */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">Role</label>
                  <div className="flex gap-2">
                    {(["ADMIN", "SUPER_ADMIN"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAdminForm((f) => ({ ...f, role: r }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          adminForm.role === r
                            ? "gradient-bg text-white border-transparent"
                            : "bg-white/40 text-muted border-white/40 hover:text-foreground hover:bg-white/60"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {r === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={addingAdmin}>
                    {addingAdmin ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Account</>}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Admin list */}
          <Card className="overflow-hidden">
            {adminsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
              </div>
            ) : adminList.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">No admin users found.</div>
            ) : (
              <ul className="divide-y divide-border">
                {adminList.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted-bg/40 transition-colors">
                    {/* Avatar */}
                    {a.image ? (
                      <Image src={a.image} alt={a.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {a.name[0]?.toUpperCase()}
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                        {a.id === user?.id && <span className="text-xs text-primary font-medium">(you)</span>}
                      </div>
                      <p className="text-xs text-muted truncate">{a.email}{a.position ? ` · ${a.position}` : ""}</p>
                    </div>
                    {/* Role badge */}
                    <Badge variant={a.role === "SUPER_ADMIN" ? "primary" : "neutral"} size="sm">
                      {a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </Badge>
                    {/* Actions — only super admins can act, and not on themselves */}
                    {user?.role === "SUPER_ADMIN" && a.id !== user.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleRole(a)}
                          disabled={togglingRole === a.id}
                          title={a.role === "ADMIN" ? "Promote to Super Admin" : "Demote to Admin"}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted border border-white/40 hover:text-foreground hover:bg-white/60 transition-colors"
                        >
                          {togglingRole === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {a.role === "ADMIN" ? "Promote" : "Demote"}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(a)}
                          disabled={deletingAdmin === a.id}
                          className="p-1.5 rounded-lg text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          {deletingAdmin === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
