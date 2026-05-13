// src/components/UI/Button.tsx
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "glass";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:   "gradient-bg text-white shadow-[0_4px_14px_rgba(99,102,241,0.40)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.50)] hover:-translate-y-0.5",
  secondary: "bg-white/80 backdrop-blur-sm text-foreground border border-white/60 hover:bg-white/95 shadow-sm",
  ghost:     "text-foreground hover:bg-white/60 backdrop-blur-sm",
  danger:    "bg-danger text-white hover:opacity-90 shadow-sm",
  outline:   "border border-border text-foreground hover:bg-white/60 backdrop-blur-sm",
  glass:     "glass text-foreground hover:bg-white/80",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-xs px-3 py-1.5 h-8",
  md: "text-sm px-4 py-2 h-9",
  lg: "text-sm px-6 py-3 h-11",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
