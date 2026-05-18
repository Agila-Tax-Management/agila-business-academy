// src/app/(learner)/components/LearnerSidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Library, BarChart3, Award,
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
        <div className={`flex items-center py-4 border-b border-white/30 shrink-0 ${collapsed ? "lg:px-2 lg:justify-between px-4 justify-between" : "px-4 justify-between"}`}>
          {/* Logo icon + text */}
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 w-8 h-8">
              <Image
                src="/image/agila_icon.ico"
                alt="Agila"
                width={32}
                height={32}
                unoptimized
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="text-foreground font-bold text-sm leading-tight">AGILA</p>
              <p className="text-muted text-[10px] tracking-widest uppercase">Business Academy</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/60 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/60 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
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


      </aside>
    </>
  );
}
