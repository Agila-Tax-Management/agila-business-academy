// src/app/(frontend)/(learner)/exam/[examId]/results/[attemptId]/components/ResultsView.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Trophy, RotateCcw,
  ChevronDown, ChevronUp, BookOpen, ArrowLeft, PlayCircle, Award,
} from "lucide-react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import ProgressBar from "@/components/UI/ProgressBar";
import { useToast } from "@/context/ToastContext";
import type { JSX } from "react";
import type { AttemptResult, ResultQuestion } from "@/app/(backend)/api/attempts/[id]/route";

function ScoreRing({ score, passed }: { score: number; passed: boolean }): JSX.Element {
  const size    = 140;
  const r       = (size - 14) / 2;
  const circ    = 2 * Math.PI * r;
  const fill    = circ * (1 - score / 100);
  const color   = passed ? "#10b981" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-foreground">{score}%</span>
        <span className="text-xs text-muted">score</span>
      </div>
    </div>
  );
}

function QuestionResult({ q, index }: { q: ResultQuestion; index: number }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const isSA     = q.type === "SHORT_ANSWER";
  const saGraded = isSA && q.isManuallyCorrect !== null;
  const saBorder = !isSA ? (q.isCorrect ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")
                 : saGraded ? (q.isManuallyCorrect ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")
                 : "border-warning/30 bg-warning/5";

  return (
    <div className={`rounded-xl border transition-colors ${saBorder}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
          !isSA
            ? (q.isCorrect ? "bg-success/20 text-success" : "bg-danger/20 text-danger")
            : saGraded
            ? (q.isManuallyCorrect ? "bg-success/20 text-success" : "bg-danger/20 text-danger")
            : "bg-warning/20 text-warning"
        }`}>
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{q.text}</p>
          {!isSA && (
            <p className={`text-xs mt-0.5 font-semibold ${q.isCorrect ? "text-success" : "text-danger"}`}>
              {q.isCorrect ? "✓ Correct" : "✗ Incorrect"}
            </p>
          )}
          {isSA && (
            <p className={`text-xs mt-0.5 font-semibold ${
              !saGraded ? "text-warning" : q.isManuallyCorrect ? "text-success" : "text-danger"
            }`}>
              {!saGraded ? "⏳ Pending admin review" : q.isManuallyCorrect ? "✓ Marked correct" : "✗ Marked incorrect"}
            </p>
          )}
          {isSA && q.textAnswer && (
            <p className="text-xs text-muted mt-0.5 italic">Your answer: &ldquo;{q.textAnswer}&rdquo;</p>
          )}
        </div>
        {expanded
          ? <ChevronUp   className="w-4 h-4 text-muted shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        }
      </button>

      {expanded && !isSA && q.choices.length > 0 && (
        <div className="px-4 pb-4 flex flex-col gap-1.5 ml-9">
          {q.choices.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                c.isCorrect && c.selected ? "bg-success/15 text-success font-semibold" :
                c.isCorrect              ? "bg-success/10 text-success" :
                c.selected               ? "bg-danger/10  text-danger line-through" :
                                           "text-muted"
              }`}
            >
              {c.isCorrect
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                : c.selected
                ? <XCircle      className="w-3.5 h-3.5 shrink-0" />
                : <span         className="w-3.5 h-3.5 shrink-0" />
              }
              {c.text}
              {c.selected && !c.isCorrect && (
                <Badge variant="danger" size="sm" className="ml-auto">Your answer</Badge>
              )}
              {c.isCorrect && (
                <Badge variant="success" size="sm" className="ml-auto">Correct</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ResultsViewProps {
  examId:    string;
  attemptId: string;
}

export default function ResultsView({ examId, attemptId }: ResultsViewProps): React.ReactNode {
  const router = useRouter();
  const { error } = useToast();

  const [result,  setResult]  = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((data) => { if (data.data) setResult(data.data); })
      .catch(() => error("Load failed", "Could not load results."))
      .finally(() => setLoading(false));
  }, [attemptId, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!result) return null;

  const correctCount = result.questions.filter((q) => q.isCorrect).length;
  const gradable     = result.questions.filter((q) => q.type !== "SHORT_ANSWER").length;
  const saCount      = result.questions.filter((q) => q.type === "SHORT_ANSWER").length;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-up">

      {/* Score card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={result.score} passed={result.passed} />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {result.passed
                ? <><Trophy className="w-5 h-5 text-success" /><span className="text-lg font-extrabold text-success">Passed!</span></>
                : <><XCircle className="w-5 h-5 text-danger" /><span className="text-lg font-extrabold text-danger">Not Passed</span></>
              }
            </div>
            <p className="text-sm text-foreground font-semibold">{result.examTitle}</p>
            <p className="text-xs text-muted">{result.linkedTitle}</p>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{correctCount} of {gradable} auto-graded correct</span>
                <span>Pass: {result.passingScore}%</span>
              </div>
              <ProgressBar value={result.score} size="sm" />
            </div>

            {saCount > 0 && (
              <p className="text-xs text-muted/70 italic">
                {saCount} short-answer question{saCount > 1 ? "s" : ""} pending manual review.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Certificate banner — shown when a SERIES exam was passed and a cert was issued */}
      {result.scope === "SERIES" && result.passed && result.certificateId && (
        <div className="rounded-2xl overflow-hidden border border-amber-200/60 shadow-[0_4px_24px_rgba(245,158,11,0.12)]">
          <div className="gradient-bg px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Certificate Earned</p>
                <p className="text-white font-extrabold text-sm leading-tight mt-0.5">Agila Business Academy</p>
              </div>
            </div>
          </div>
          <div className="glass-strong px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="flex-1 text-sm text-foreground font-medium">
              You&apos;ve completed <span className="font-bold">{result.linkedTitle}</span>. Your certificate is ready.
            </p>
            <Button variant="primary" onClick={() => router.push("/certificates")} className="shrink-0">
              <Award className="w-4 h-4 mr-1.5" /> View Certificate
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!result.passed && (
          <Button onClick={() => router.push(`/exam/${examId}`)}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Try Again
          </Button>
        )}
        <Button variant={result.passed ? "primary" : "outline"} onClick={() => router.push(result.backUrl)}>
          {result.scope === "VIDEO"
            ? <><PlayCircle className="w-4 h-4 mr-1.5" /> Back to Module</>
            : <><ArrowLeft  className="w-4 h-4 mr-1.5" /> Back to Series</>
          }
        </Button>
        <Button variant="ghost" onClick={() => router.push("/library")}>
          <BookOpen className="w-4 h-4 mr-1.5" /> Library
        </Button>
      </div>

      {/* Question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Question Breakdown</h2>
        {result.questions.map((q, i) => (
          <QuestionResult key={q.id} q={q} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
