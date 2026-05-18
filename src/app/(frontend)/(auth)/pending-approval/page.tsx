// src/app/(auth)/pending-approval/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Clock, LogOut, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";

export default function PendingApprovalPage(): React.ReactNode {
  const { user } = useAuth();
  const router = useRouter();

  const isRejected = user?.approvalStatus === "REJECTED";

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 text-center shadow-2xl">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
          isRejected ? "bg-danger/15" : "bg-warning/15"
        }`}>
          {isRejected
            ? <ShieldCheck className="w-8 h-8 text-danger" />
            : <Clock className="w-8 h-8 text-warning" />
          }
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isRejected ? "Access Denied" : "Awaiting Approval"}
        </h1>

        {/* Message */}
        <p className="text-muted text-sm leading-relaxed mb-1">
          {isRejected
            ? "Your account access request has been declined. Please contact your HR or training officer for assistance."
            : "Your account is pending approval by an administrator. You'll receive a notification once your account is activated."
          }
        </p>

        {user && (
          <p className="text-xs text-muted/60 mt-3 mb-6">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}

        {/* Sign out */}
        <button
          onClick={() => void handleSignOut()}
          className="flex items-center gap-2 justify-center w-full h-10 rounded-xl border border-white/40 bg-white/30 hover:bg-white/50 text-foreground text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
