// src/app/(learner)/components/LearnerHeader.tsx
"use client";

import { Bell, Moon, Sun, Menu, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";

interface LearnerHeaderProps {
  onMenuClick: () => void;
}

export default function LearnerHeader({ onMenuClick }: LearnerHeaderProps): React.ReactNode {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    <header className="h-14 bg-header border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted-bg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center placeholder */}
      <div className="hidden lg:block" />

      {/* Right: actions */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
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
  );
}

