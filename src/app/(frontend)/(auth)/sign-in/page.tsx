// src/app/(auth)/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";

export default function SignInPage(): React.ReactNode {
  const router = useRouter();
  const { error } = useToast();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

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
      <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
      <p className="text-sm text-muted mb-8">Sign in to your Agila Academy account</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@agila.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="pointer-events-auto text-muted hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-end">
          <a href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
          Sign In
        </Button>
      </form>

      <p className="text-xs text-muted text-center mt-8">
        For account issues, contact your HR administrator.
      </p>
    </div>
  );
}
