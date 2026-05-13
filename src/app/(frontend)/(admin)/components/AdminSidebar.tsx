// src/app/(admin)/components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  ClipboardList,
  Users,
  BarChart2,
  X,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: "Overview",  href: "/admin",           icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Content",   href: "/admin/content",   icon: <Video className="w-5 h-5" /> },
  { label: "Exams",     href: "/admin/exams",     icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Employees", href: "/admin/employees", icon: <Users className="w-5 h-5" /> },
  { label: "Results",   href: "/admin/results",   icon: <BarChart2 className="w-5 h-5" /> },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({ open, onClose, collapsed, onToggleCollapse }: AdminSidebarProps): React.ReactNode {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const linkClass = (active: boolean, isCollapsed: boolean) =>
    `flex items-center rounded-xl text-sm font-medium transition-all duration-150 group
     ${isCollapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-3 py-2.5" : "gap-3 px-3 py-2.5"}
     ${active
       ? "bg-sidebar-active-bg text-sidebar-active border border-primary/20 shadow-sm"
       : "text-sidebar-muted hover:text-foreground hover:bg-white/60"}`;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          glass-strong border-r border-white/50 shadow-[4px_0_24px_rgba(99,102,241,0.08)]
          transition-all duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          w-64 ${collapsed ? "lg:w-17.5" : "lg:w-64"}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center py-5 border-b border-white/30 shrink-0
            ${collapsed ? "lg:justify-center px-5 lg:px-3" : "justify-between px-5"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.35)] shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="text-foreground font-bold text-sm leading-tight">Admin Panel</p>
              <p className="text-muted text-[10px] tracking-widest uppercase">Academy</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3">
          <p className={`text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mb-3 ${collapsed ? "lg:hidden" : ""}`}>
            Manage
          </p>
          <ul className="flex flex-col gap-1">
            {adminNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={linkClass(isActive(item.href), collapsed)}
                >
                  <span className={`shrink-0 ${isActive(item.href) ? "text-primary" : "text-sidebar-muted group-hover:text-foreground"} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/30 px-3 py-3 flex flex-col gap-1">
          <Link
            href="/profile"
            onClick={onClose}
            title={collapsed ? "Settings" : undefined}
            className={`flex items-center rounded-xl text-sm font-medium transition-all text-sidebar-muted hover:text-foreground hover:bg-white/60
              ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 gap-3 px-3 py-2.5" : "gap-3 px-3 py-2.5"}`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Settings</span>
          </Link>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden lg:flex items-center rounded-xl text-xs text-sidebar-muted hover:text-foreground hover:bg-white/60 transition-all
              ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
