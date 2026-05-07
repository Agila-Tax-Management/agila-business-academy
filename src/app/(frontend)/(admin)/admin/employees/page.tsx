// src/app/(admin)/admin/employees/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, BookOpen, Users, MoreHorizontal } from "lucide-react";

type EmployeeRole = "EMPLOYEE" | "ADMIN" | "SUPER_ADMIN";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  enrolledSeries: number;
  completedSeries: number;
  lastLogin: string | null;
}

const MOCK: Employee[] = [
  { id: "1", name: "Juan dela Cruz", email: "juan@agila.ph", role: "EMPLOYEE", enrolledSeries: 2, completedSeries: 1, lastLogin: "2026-05-07T09:00:00Z" },
  { id: "2", name: "Maria Santos", email: "maria@agila.ph", role: "EMPLOYEE", enrolledSeries: 3, completedSeries: 0, lastLogin: "2026-05-06T15:30:00Z" },
  { id: "3", name: "Carlo Reyes", email: "carlo@agila.ph", role: "EMPLOYEE", enrolledSeries: 1, completedSeries: 1, lastLogin: "2026-05-05T10:00:00Z" },
  { id: "4", name: "Admin User", email: "admin@agila.ph", role: "ADMIN", enrolledSeries: 0, completedSeries: 0, lastLogin: "2026-05-07T08:00:00Z" },
];

const ROLE_STYLES: Record<EmployeeRole, string> = {
  EMPLOYEE: "bg-muted-bg text-muted",
  ADMIN: "bg-primary/10 text-primary",
  SUPER_ADMIN: "bg-warning/10 text-warning",
};

export default function AdminEmployeesPage(): React.ReactNode {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call to GET /api/employees
    const timer = setTimeout(() => {
      setEmployees(MOCK);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted text-sm mt-1">Manage employee accounts and series enrollments.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0">
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Total Employees</p>
            <p className="text-xl font-bold text-foreground">{employees.filter((e) => e.role === "EMPLOYEE").length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Active Enrollments</p>
            <p className="text-xl font-bold text-foreground">
              {employees.reduce((acc, e) => acc + e.enrolledSeries, 0)}
            </p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted">Admins</p>
            <p className="text-xl font-bold text-foreground">
              {employees.filter((e) => e.role === "ADMIN" || e.role === "SUPER_ADMIN").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Enrolled</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Completed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {emp.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-xs text-muted truncate">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[emp.role]}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-foreground font-medium hidden md:table-cell">{emp.enrolledSeries}</td>
                  <td className="px-4 py-3 text-center text-foreground font-medium hidden lg:table-cell">{emp.completedSeries}</td>
                  <td className="px-4 py-3 text-right text-muted text-xs hidden lg:table-cell">
                    {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors" title="More actions">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted text-sm">No employees match your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
