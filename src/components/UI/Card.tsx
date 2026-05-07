// src/components/UI/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps): React.ReactNode {
  return (
    <div
      onClick={onClick}
      className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
