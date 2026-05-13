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
      router.push("/dashboard");
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
      <p className="text-sm text-gray-400 mb-8 leading-relaxed">
        Enter your credentials to access your training dashboard.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Email ID
          </label>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agila.ph"
              required
              autoComplete="email"
              className="w-full pl-4 pr-3 py-3 bg-transparent border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full pl-4 pr-10 py-3 bg-transparent border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
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

        {/* Keep me signed in + Already a member */}
        <div className="flex items-center justify-between mt-1">
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
          <a href="/forgot-password" className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors">
            Already a member?
          </a>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-3.5 rounded-full text-white text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

      <p className="text-xs text-gray-400 text-center mt-8">
        For account issues, contact your HR administrator.
      </p>
    </div>
  );
}
