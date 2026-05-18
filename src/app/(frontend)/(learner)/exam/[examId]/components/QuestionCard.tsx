// src/app/(frontend)/(learner)/exam/[examId]/components/QuestionCard.tsx
"use client";

import type { JSX } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export type QType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export interface Choice {
  id:   string;
  text: string;
}

export interface Question {
  id:      string;
  text:    string;
  type:    QType;
  choices: Choice[];
}

interface QuestionCardProps {
  question:  Question;
  index:     number;
  total:     number;
  answer:    string;
  onChange:  (questionId: string, value: string) => void;
}

export default function QuestionCard({
  question,
  index,
  total,
  answer,
  onChange,
}: QuestionCardProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full gradient-bg text-white text-sm font-bold flex items-center justify-center mt-0.5">
          {index}
        </span>
        <div className="flex-1">
          <p className="text-xs text-muted mb-1">Question {index} of {total}</p>
          <p className="text-base font-medium text-foreground leading-relaxed">{question.text}</p>
        </div>
      </div>

      {/* Choices */}
      {question.type !== "SHORT_ANSWER" ? (
        <div className="flex flex-col gap-2 ml-11">
          {question.choices.map((c) => {
            const selected = answer === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(question.id, selected ? "" : c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  selected
                    ? "gradient-bg text-white border-transparent shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                    : "bg-white/50 border-white/60 text-foreground hover:bg-white/80 hover:border-primary/30"
                }`}
              >
                {selected
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <Circle       className="w-4 h-4 shrink-0 text-muted" />
                }
                {c.text}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ml-11">
          <textarea
            value={answer}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder="Type your answer here…"
            rows={4}
            className="w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-foreground px-4 py-3 placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          />
          <p className="text-xs text-muted mt-1">Short answer — graded manually by admin.</p>
        </div>
      )}
    </div>
  );
}
