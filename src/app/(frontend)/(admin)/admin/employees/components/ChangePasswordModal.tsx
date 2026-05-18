// src/app/(frontend)/(admin)/admin/employees/components/ChangePasswordModal.tsx
"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import Modal from "@/components/UI/Modal";
import { useToast } from "@/context/ToastContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: string; name: string } | null;
}

export default function ChangePasswordModal({ isOpen, onClose, employee }: Props): React.ReactNode {
  const { success, error } = useToast();

  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  // Reset fields when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setShowConfirm(false);
    }
  }

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      error("Too short", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      error("Mismatch", "Passwords do not match.");
      return;
    }
    if (!employee) return;

    setSaving(true);
    try {
      const res  = await fetch(`/api/employees/${employee.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        error("Failed", data.error ?? "Could not change password.");
        return;
      }
      success("Password changed", `Password for ${employee.name} has been updated.`);
      onClose();
    } catch {
      error("Failed", "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Change Password — ${employee?.name ?? ""}`} size="sm">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* New password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full h-10 pl-3 pr-10 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className={`w-full h-10 pl-3 pr-10 rounded-xl border bg-white/60 backdrop-blur-sm text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 transition-all ${
                mismatch
                  ? "border-danger/50 focus:ring-danger/30"
                  : "border-white/60 focus:ring-primary/30"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="text-xs text-danger mt-0.5">Passwords do not match.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/60 text-sm font-semibold text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !password || !confirm || mismatch}
            className="flex-1 h-10 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all shadow-[0_2px_8px_rgba(99,102,241,0.30)]"
          >
            <KeyRound className="w-4 h-4" />
            {saving ? "Saving…" : "Change Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
