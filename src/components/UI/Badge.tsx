// src/components/UI/Badge.tsx
type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  neutral: "bg-muted-bg text-muted",
  primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  info:    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps): React.ReactNode {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
