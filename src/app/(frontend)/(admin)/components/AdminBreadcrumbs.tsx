// src/app/(frontend)/(admin)/components/AdminBreadcrumbs.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

const LABELS: Record<string, string> = {
  admin:     "Admin Panel",
  content:   "Content",
  exams:     "Exams",
  employees: "Employees",
  results:   "Results",
};

interface Crumb {
  label: string;
  href:  string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [
    { label: "Dashboard", href: "/dashboard" },
  ];
  const segments = pathname.split("/").filter(Boolean);
  let accumulated = "";
  for (const seg of segments) {
    accumulated += `/${seg}`;
    const label = LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, href: accumulated });
  }
  return crumbs;
}

export default function AdminBreadcrumbs(): React.ReactNode {
  const pathname = usePathname();
  const router   = useRouter();
  const crumbs   = buildCrumbs(pathname);

  // Determine back target — one level up, or /dashboard if at root
  const backHref = crumbs.length >= 2 ? crumbs[crumbs.length - 2].href : "/dashboard";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
      {/* Back button */}
      <button
        onClick={() => router.push(backHref)}
        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/60 transition-colors shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Divider */}
      <span className="text-muted/30 select-none">|</span>

      {/* Crumbs */}
      <ol className="flex items-center gap-1 text-xs overflow-x-auto min-w-0">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1 shrink-0">
              {isLast ? (
                <span className="font-semibold text-foreground truncate max-w-45">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted hover:text-primary transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && <ChevronRight className="w-3 h-3 text-muted/40 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
