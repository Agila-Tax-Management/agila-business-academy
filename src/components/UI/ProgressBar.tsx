// src/components/UI/ProgressBar.tsx
interface ProgressBarProps {
  value: number;  // 0–100
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
  gradient?: boolean;
}

export default function ProgressBar({ value, size = "md", showLabel = false, className = "", gradient = true }: ProgressBarProps): React.ReactNode {
  const clamped = Math.min(100, Math.max(0, value));
  const height  = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 rounded-full bg-white/40 backdrop-blur-sm overflow-hidden ${height}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            gradient ? "gradient-bg" : "bg-primary"
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted tabular-nums w-8 text-right font-medium">{clamped}%</span>
      )}
    </div>
  );
}
