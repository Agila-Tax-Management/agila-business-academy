// src/components/UI/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", onClick, hover }: CardProps): React.ReactNode {
  const isClickable = onClick !== undefined || hover;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl glass text-card-foreground ${
        isClickable
          ? "cursor-pointer hover:shadow-[0_8px_32px_rgba(99,102,241,0.18)] hover:-translate-y-0.5 hover:bg-white/85 transition-all duration-200"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
