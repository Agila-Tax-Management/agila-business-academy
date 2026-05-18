// src/app/(frontend)/(auth)/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";

export default function SignInPage(): React.ReactNode {
  const router = useRouter();
  const { error } = useToast();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [rememberMe, setRemember] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        error("Sign in failed", result.error.message ?? "Invalid credentials.");
        return;
      }
      const role = (result.data?.user as Record<string, unknown> | undefined)?.role as string | undefined;
      router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
    } catch {
      error("Sign in failed", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Login Account</h1>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Enter your credentials to access your training dashboard.
      </p>

      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Email ID
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agila.ph"
              required
              autoComplete="email"
              className="w-full px-3 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-3 py-3 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-800 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Keep me signed in */}
        <div className="flex items-center mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative w-4 h-4">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRemember(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors flex items-center justify-center">
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Keep me signed in</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3.5 rounded-full text-white text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%)" }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              Signing in…
            </span>
          ) : "Sign In"}
        </button>
      </form>
      </div>

      {/* Enroll now */}
      <p className="text-center text-xs text-gray-400 mt-4">
        New to Agila Business Academy?{" "}
        <a href="/register" className="text-blue-500 font-semibold hover:text-blue-600 hover:underline transition-colors">
          Enroll Now!
        </a>
      </p>

      <p className="text-xs text-gray-400 text-center mt-4">
        For account issues, contact your HR administrator.
      </p>
    </div>
  );
}
