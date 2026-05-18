// src/app/(frontend)/(learner)/exam/[examId]/components/ExamTimer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { Timer } from "lucide-react";

interface ExamTimerProps {
  totalSeconds: number;
  onExpire:     () => void;
}

export default function ExamTimer({ totalSeconds, onExpire }: ExamTimerProps): JSX.Element {
  const [remaining, setRemaining] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const isWarning  = remaining <= 120; // last 2 min
  const isCritical = remaining <= 30;  // last 30 sec

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-mono font-semibold tabular-nums px-3 py-1 rounded-lg ${
        isCritical ? "bg-danger/15 text-danger animate-pulse" :
        isWarning  ? "bg-warning/15 text-warning" :
                     "bg-white/40 text-foreground"
      }`}
    >
      <Timer className="w-3.5 h-3.5 shrink-0" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
