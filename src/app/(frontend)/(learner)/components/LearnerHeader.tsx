// src/app/(learner)/components/LearnerHeader.tsx
"use client";

import { Moon, Sun, Menu, LogOut, User, ChevronDown, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import NotificationBell from "@/components/UI/NotificationBell";

interface LearnerHeaderProps {
  onMenuClick: () => void;
}

export default function LearnerHeader({ onMenuClick }: LearnerHeaderProps): React.ReactNode {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="h-16.5 glass-strong border-b border-white/40 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted hover:text-foreground transition-colors p-1.5 rounded-xl hover:bg-white/60"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Search bar */}
      <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, modules, videos"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-white/80 transition-all"
          />
        </div>
      </form>

      {/* Right: actions */}
      <div className="flex items-center gap-1 ml-auto sm:ml-0">
        {/* Mobile search icon */}
        <Link href="/search" className="sm:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/60 transition-colors">
          <Search className="w-4 h-4" />
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/60 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-full hover:opacity-80 transition-opacity"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shadow-[0_2px_8px_rgba(99,102,241,0.30)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-semibold text-sm shadow-[0_2px_8px_rgba(99,102,241,0.30)]">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-muted hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/30">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "â€”"}</p>
                <p className="text-xs text-muted truncate">{user?.email ?? "â€”"}</p>
              </div>
              <div className="py-1.5">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-white/60 transition-colors"
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
