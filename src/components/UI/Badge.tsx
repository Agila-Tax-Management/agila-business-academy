// src/components/UI/Badge.tsx
type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  neutral: "bg-white/60 text-foreground/70 border border-white/50",
  primary: "bg-indigo-100/80 text-indigo-700 border border-indigo-200/60",
  success: "bg-emerald-100/80 text-emerald-700 border border-emerald-200/60",
  warning: "bg-amber-100/80 text-amber-700 border border-amber-200/60",
  danger:  "bg-red-100/80 text-red-700 border border-red-200/60",
  info:    "bg-sky-100/80 text-sky-700 border border-sky-200/60",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps): React.ReactNode {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
