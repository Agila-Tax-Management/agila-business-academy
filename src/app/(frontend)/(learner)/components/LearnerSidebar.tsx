// src/app/(learner)/components/LearnerSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Library, BarChart3, Award, Settings,
  X, ShieldCheck, ChevronLeft, ChevronRight, Bookmark,
  Trophy, Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const learnerNav: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",    icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Library",      href: "/library",      icon: <Library className="w-5 h-5" /> },
  { label: "Search",       href: "/search",       icon: <Search className="w-5 h-5" /> },
  { label: "Saved",        href: "/saved",        icon: <Bookmark className="w-5 h-5" /> },
  { label: "My Progress",  href: "/progress",     icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Leaderboard",  href: "/leaderboard",  icon: <Trophy className="w-5 h-5" /> },
  { label: "Certificates", href: "/certificates", icon: <Award className="w-5 h-5" /> },
];

interface LearnerSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function LearnerSidebar({ open, onClose, collapsed, onToggleCollapse }: LearnerSidebarProps): React.ReactNode {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
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
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
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
              <p className="text-foreground font-bold text-sm leading-tight">Agila</p>
              <p className="text-muted text-[10px] tracking-widest uppercase">Business Academy</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3">
          <p className={`text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mb-3 ${collapsed ? "lg:hidden" : ""}`}>
            Learning
          </p>
          <ul className="flex flex-col gap-1">
            {learnerNav.map((item) => (
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

          {/* Admin shortcut */}
          {isAdmin && (
            <>
              <p className={`text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mt-6 mb-3 ${collapsed ? "lg:hidden" : ""}`}>
                Administration
              </p>
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    href="/admin"
                    onClick={onClose}
                    title={collapsed ? "Admin Panel" : undefined}
                    className={linkClass(pathname.startsWith("/admin"), collapsed)}
                  >
                    <span className={`shrink-0 ${pathname.startsWith("/admin") ? "text-primary" : "text-sidebar-muted group-hover:text-foreground"} transition-colors`}>
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <span className={collapsed ? "lg:hidden" : ""}>Admin Panel</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
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
