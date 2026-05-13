// src/app/(frontend)/(admin)/admin/employees/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, BookOpen, Users, ShieldCheck, Trash2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import type { EmployeeItem } from "@/app/(backend)/api/employees/route";
import AddEmployeeModal from "./components/AddEmployeeModal";
import EnrollModal from "./components/EnrollModal";

type EmployeeRole = "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";

const ROLE_STYLES: Record<EmployeeRole, string> = {
  EMPLOYEE:    "bg-muted-bg text-muted",
  ADMIN:       "bg-primary/10 text-primary",
  SUPER_ADMIN: "bg-warning/10 text-warning",
};

const ROLE_LABELS: Record<EmployeeRole, string> = {
  EMPLOYEE:    "Employee",
  ADMIN:       "Admin",
  SUPER_ADMIN: "Super Admin",
};

export default function AdminEmployeesPage(): React.ReactNode {
  const { success, error } = useToast();

  const [employees,    setEmployees]    = useState<EmployeeItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState<EmployeeRole | "ALL">("ALL");
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [addOpen,      setAddOpen]      = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d: { data?: EmployeeItem[] }) => { if (!cancelled) setEmployees(d.data ?? []); })
      .catch(() => { if (!cancelled) error("Load failed", "Could not load employees."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [error]);

  const filtered = employees.filter((e) => {
    const matchSearch = search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleDelete(emp: EmployeeItem) {
    if (!window.confirm(`Delete "${emp.name}"? This cannot be undone.`)) return;
    setDeletingId(emp.id);
    try {
      const res  = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error("Delete failed", data.error ?? "Could not delete employee."); return; }
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      success("Employee removed", `${emp.name} has been removed.`);
    } catch {
      error("Delete failed", "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalEmployees = employees.filter((e) => e.role === "EMPLOYEE").length;
  const totalAdmins    = employees.filter((e) => e.role === "ADMIN" || e.role === "SUPER_ADMIN").length;
  const totalEnrolled  = employees.reduce((acc, e) => acc + e.enrolledSeries, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted text-sm mt-1">Manage employee accounts and series enrollments.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 gradient-bg hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.30)] transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Total Employees</p>
            <p className="text-xl font-bold text-foreground">{totalEmployees}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Active Enrollments</p>
            <p className="text-xl font-bold text-foreground">{totalEnrolled}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted">Admins</p>
            <p className="text-xl font-bold text-foreground">{totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as EmployeeRole | "ALL")}
          className="appearance-none h-10 pl-3 pr-8 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all"
        >
          <option value="ALL">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-10 h-10 text-muted mb-3" />
          <p className="text-sm font-medium text-foreground">No employees found</p>
          <p className="text-xs text-muted mt-1">Try adjusting your search or add a new employee.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Enrolled</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Completed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {emp.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-xs text-muted truncate">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[emp.role]}`}>
                      {ROLE_LABELS[emp.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="font-medium text-foreground">{emp.enrolledSeries}</span>
                    <span className="text-muted ml-1 text-xs">series</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="font-medium text-foreground">{emp.completedSeries}</span>
                    <span className="text-muted ml-1 text-xs">done</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted hidden lg:table-cell">
                    {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEnrollTarget({ id: emp.id, name: emp.name })}
                        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Manage enrollments"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp)}
                        disabled={deletingId === emp.id}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddEmployeeModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(emp) => setEmployees((prev) => [...prev, emp])}
      />
      <EnrollModal
        isOpen={!!enrollTarget}
        onClose={() => setEnrollTarget(null)}
        employee={enrollTarget}
      />
    </div>
  );
}
