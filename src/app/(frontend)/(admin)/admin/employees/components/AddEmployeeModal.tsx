// src/app/(frontend)/(admin)/admin/employees/components/AddEmployeeModal.tsx
"use client";

import { useState } from "react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import type { EmployeeItem, EmployeeRole } from "@/app/(backend)/api/employees/route";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: EmployeeItem) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps): React.ReactNode {
  const { success, error } = useToast();

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [role,    setRole]    = useState<EmployeeRole>("EMPLOYEE");
  const [saving,  setSaving]  = useState(false);

  // Reset form when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setName("");
      setEmail("");
      setRole("EMPLOYEE");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())  { error("Missing field", "Name is required.");  return; }
    if (!email.trim()) { error("Missing field", "Email is required."); return; }

    setSaving(true);
    try {
      const res  = await fetch("/api/employees", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      });
      const data = await res.json() as { data?: EmployeeItem; error?: string };
      if (!res.ok) { error("Failed to add employee", data.error ?? "Something went wrong."); return; }
      success("Employee added", `${name} has been added to the system.`);
      onSuccess(data.data!);
      onClose();
    } catch {
      error("Failed to add employee", "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Employee"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>Add Employee</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Juan dela Cruz"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. juan@agila.ph"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        <p className="text-xs text-muted bg-muted-bg rounded-lg px-3 py-2">
          A temporary password will be sent to the employee&apos;s email address upon creation.
        </p>
      </form>
    </Modal>
  );
}
