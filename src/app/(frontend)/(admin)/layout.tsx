// src/app/(admin)/layout.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Moon, Sun, LogOut, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";

export default function AdminLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-header border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted-bg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Admin</span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile dropdown */}
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <ChevronDown className="w-3 h-3 text-muted hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "—"}</p>
                    <p className="text-xs text-muted truncate">{user?.email ?? "—"}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted-bg transition-colors"
                    >
                      <User className="w-4 h-4 text-muted" />
                      View Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
