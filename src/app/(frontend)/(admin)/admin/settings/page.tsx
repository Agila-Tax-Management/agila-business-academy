// src/app/(frontend)/(admin)/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Award, GripVertical, UserCheck } from "lucide-react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import type { SignatoryItem, AdminUserItem } from "@/app/(backend)/api/admin/certificate-settings/route";

interface EditState {
  id:       string;
  name:     string;
  position: string;
}

export default function AdminSettingsPage(): React.ReactNode {
  const { success, error } = useToast();

  const [signatories, setSignatories] = useState<SignatoryItem[]>([]);
  const [adminUsers,  setAdminUsers]  = useState<AdminUserItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [adding,      setAdding]      = useState(false);
  const [addingUser,  setAddingUser]  = useState<string | null>(null);

  // Manual add form
  const [addName,     setAddName]     = useState("");
  const [addPosition, setAddPosition] = useState("");

  // Inline edit
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

  // Check if a user is already a signatory (by name match)
  function isAlreadyAdded(user: AdminUserItem) {
    return signatories.some(
      (s) => s.name.trim().toLowerCase() === user.name.trim().toLowerCase()
    );
  }

  async function handleAddUser(user: AdminUserItem) {
    setAddingUser(user.id);
    try {
      const r = await fetch("/api/admin/certificate-settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     user.name,
          position: user.position ?? "Administrator",
        }),
      });
      const data = await r.json();
      if (!r.ok) { error("Failed to add", data.error ?? "Could not add signatory."); return; }
      setSignatories((prev) => [...prev, data.data.signatory]);
      success("Signatory added", `${user.name} has been added.`);
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-up">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
        <p className="text-muted text-sm mt-1">Configure certificate signatories and other platform settings.</p>
      </div>

      {/* Certificate Signatories section */}
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
                      className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                    <input
                      value={editState.position}
                      onChange={(e) => setEditState({ ...editState, position: e.target.value })}
                      placeholder="Position / title"
                      className="flex-1 min-w-[120px] px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
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
                        "Addingâ€¦"
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
              className="flex-1 min-w-[150px] px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
            <input
              value={addPosition}
              onChange={(e) => setAddPosition(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Position / title (e.g. HR Manager)"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
            <Button onClick={handleAdd} disabled={adding || !addName.trim() || !addPosition.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              {adding ? "Addingâ€¦" : "Add"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
