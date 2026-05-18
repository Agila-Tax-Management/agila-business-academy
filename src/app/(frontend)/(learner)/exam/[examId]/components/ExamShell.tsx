// src/app/(frontend)/(learner)/exam/[examId]/components/ExamShell.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, ClipboardList, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Clock, RotateCcw, Play,
  Video, Layers, GraduationCap,
} from "lucide-react";
import Card from "@/components/UI/Card";
import Badge from "@/components/UI/Badge";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import type { TakeExam, TakeQuestion, TakeAttempt } from "@/app/(backend)/api/exams/[id]/take/route";
import ExamTimer from "./ExamTimer";
import QuestionCard from "./QuestionCard";
import ExamSubmitModal from "./ExamSubmitModal";

type Phase = "loading" | "landing" | "taking";

const SCOPE_ICON: Record<TakeExam["scope"], React.ElementType> = {
  VIDEO:  Video,
  MODULE: Layers,
  SERIES: GraduationCap,
};

const SCOPE_LABEL: Record<TakeExam["scope"], string> = {
  VIDEO:  "Content Exam",
  MODULE: "Module Exam",
  SERIES: "Series Exam",
};

const SCOPE_BADGE: Record<TakeExam["scope"], "neutral" | "warning" | "success"> = {
  VIDEO:  "neutral",
  MODULE: "warning",
  SERIES: "success",
};

interface ExamShellProps {
  examId: string;
}

export default function ExamShell({ examId }: ExamShellProps): React.ReactNode {
  const router = useRouter();
  const { error } = useToast();

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [examData,  setExamData]  = useState<{ exam: TakeExam; questions: TakeQuestion[]; attempts: TakeAttempt[]; canTake: boolean } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [starting,  setStarting]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadExam = useCallback(async () => {
    try {
      const res  = await fetch(`/api/exams/${examId}/take`);
      const data = await res.json() as { data?: { exam: TakeExam; questions: TakeQuestion[]; attempts: TakeAttempt[]; canTake: boolean }; error?: string };
      if (!res.ok) { error("Load failed", data.error ?? "Could not load exam."); return; }
      setExamData(data.data!);
      setPhase("landing");
    } catch {
      error("Load failed", "Could not load exam.");
    }
  }, [examId, error]);

  useEffect(() => { void loadExam(); }, [loadExam]);

  async function handleStart() {
    setStarting(true);
    try {
      const res  = await fetch(`/api/exams/${examId}/attempts`, { method: "POST" });
      const data = await res.json() as { data?: { attemptId: string }; error?: string };
      if (!res.ok) { error("Start failed", data.error ?? "Could not start exam."); return; }
      setAttemptId(data.data!.attemptId);
      setCurrent(0);
      setAnswers({});
      setPhase("taking");
    } catch {
      error("Start failed", "An unexpected error occurred.");
    } finally {
      setStarting(false);
    }
  }

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!attemptId || !examData) return;
    setSubmitting(true);
    setShowModal(false);
    try {
      const body = {
        answers: examData.questions.map((q) => {
          const val = answers[q.id] ?? "";
          if (q.type === "SHORT_ANSWER") {
            return { questionId: q.id, choiceIds: [], textAnswer: val };
          }
          return { questionId: q.id, choiceIds: val ? [val] : [], textAnswer: undefined };
        }),
      };
      const res  = await fetch(`/api/attempts/${attemptId}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { data?: { score: number; passed: boolean; attemptId: string }; error?: string };
      if (!res.ok) { error("Submit failed", data.error ?? "Could not submit."); return; }
      router.push(`/exam/${examId}/results/${data.data!.attemptId}`);
    } catch {
      error("Submit failed", "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────── //
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!examData) return null;
  const { exam, questions, attempts, canTake } = examData;

  // ── Landing ────────────────────────────────────────────────────────────── //
  if (phase === "landing") {
    const ScopeIcon = SCOPE_ICON[exam.scope];
    const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;

    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-up">
        {/* Hero card */}
        <Card className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant={SCOPE_BADGE[exam.scope]} size="sm">
                  <ScopeIcon className="w-3 h-3 mr-1" />
                  {SCOPE_LABEL[exam.scope]}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-sm text-muted mt-0.5">
                Part of: <span className="font-medium text-foreground">{exam.linkedTitle}</span>
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BookOpen,  label: "Questions",    value: `${exam.questionCount}` },
              { icon: CheckCircle2, label: "Pass Score", value: `${exam.passingScore}%` },
              { icon: RotateCcw, label: "Attempts",
                value: exam.maxAttempts === 0 ? "Unlimited" : `${attempts.length} / ${exam.maxAttempts}` },
              { icon: Clock,     label: "Time Limit",
                value: exam.timeLimitMin ? `${exam.timeLimitMin} min` : "No limit" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/50 rounded-xl p-3 text-center border border-white/60">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{value}</p>
                <p className="text-[11px] text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Best score */}
          {bestScore !== null && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              attempts.some((a) => a.passed)
                ? "bg-success/10 border-success/30"
                : "bg-danger/10 border-danger/30"
            }`}>
              {attempts.some((a) => a.passed)
                ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                : <XCircle      className="w-4 h-4 text-danger  shrink-0" />
              }
              <p className="text-sm text-foreground">
                Best score: <strong>{bestScore}%</strong>
                {attempts.some((a) => a.passed) ? " — Passed ✓" : " — Not yet passed"}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="pt-1">
            {canTake ? (
              <Button className="w-full" onClick={() => void handleStart()} loading={starting}>
                <Play className="w-4 h-4 mr-1.5" />
                {attempts.length === 0 ? "Start Exam" : "Retake Exam"}
              </Button>
            ) : (
              <div className="text-center py-3 text-sm text-muted">
                <XCircle className="w-5 h-5 text-danger mx-auto mb-1" />
                Maximum attempts reached. No more retakes allowed.
              </div>
            )}
          </div>
        </Card>

        {/* Previous attempts */}
        {attempts.length > 0 && (
          <Card className="overflow-hidden p-0">
            <div className="px-5 py-3 border-b border-white/30">
              <h2 className="text-sm font-semibold text-foreground">Attempt History</h2>
            </div>
            <div className="divide-y divide-white/20">
              {attempts.map((a, i) => (
                <div key={a.id} className="flex items-center px-5 py-3 gap-3">
                  <span className="text-xs text-muted w-16 shrink-0">
                    #{attempts.length - i}
                  </span>
                  <span className={`text-sm font-bold ${a.passed ? "text-success" : "text-danger"}`}>
                    {a.score}%
                  </span>
                  {a.passed
                    ? <Badge variant="success" size="sm">Passed</Badge>
                    : <Badge variant="danger"  size="sm">Failed</Badge>
                  }
                  <span className="text-xs text-muted ml-auto">
                    {new Date(a.submittedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => router.push(`/exam/${examId}/results/${a.id}`)}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── Taking ─────────────────────────────────────────────────────────────── //
  const q          = questions[current];
  const answered   = questions.filter((qu) => !!answers[qu.id]?.trim()).length;
  const isAnswered = (idx: number) => !!answers[questions[idx].id]?.trim();

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="shrink-0 glass border-b border-white/30 px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground mr-auto">
            {exam.title}
          </span>
          {exam.timeLimitMin && attemptId && (
            <ExamTimer
              totalSeconds={exam.timeLimitMin * 60}
              onExpire={() => void handleSubmit()}
            />
          )}
          <span className="text-xs text-muted hidden sm:block">
            {answered}/{questions.length} answered
          </span>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            disabled={submitting}
          >
            Submit Exam
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Question nav sidebar */}
          <div className="hidden md:flex flex-col shrink-0 w-20 border-r border-white/30 bg-white/30 backdrop-blur-sm overflow-y-auto py-4 gap-2 items-center">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                  i === current
                    ? "gradient-bg text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                    : isAnswered(i)
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-white/60 text-muted border border-white/60 hover:bg-white/80"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question area */}
          <div className="flex-1 overflow-y-auto p-5 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <QuestionCard
                question={q}
                index={current + 1}
                total={questions.length}
                answer={answers[q.id] ?? ""}
                onChange={handleAnswer}
              />

              {/* Mobile question nav */}
              <div className="flex flex-wrap gap-2 md:hidden">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      i === current
                        ? "gradient-bg text-white"
                        : isAnswered(i)
                        ? "bg-success/20 text-success border border-success/30"
                        : "bg-white/60 text-muted border border-white/60"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Prev / Next */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                  disabled={current === questions.length - 1}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExamSubmitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => void handleSubmit()}
        answered={answered}
        total={questions.length}
        submitting={submitting}
      />
    </>
  );
}
