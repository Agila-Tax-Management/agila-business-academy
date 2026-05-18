// src/app/(learner)/layout.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LearnerSidebar from "./components/LearnerSidebar";
import LearnerHeader from "./components/LearnerHeader";
import { useAuth } from "@/context/AuthContext";

export default function LearnerLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Approval gate — only EMPLOYEE accounts need admin approval
  if (user && user.role === "EMPLOYEE" && user.approvalStatus !== "APPROVED") {
    router.replace("/pending-approval");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <LearnerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <LearnerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
