// src/app/(frontend)/(admin)/admin/results/components/GradeModal.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import type { AttemptResult, ResultQuestion } from "@/app/(backend)/api/attempts/[id]/route";

interface GradeModalProps {
  attemptId: string | null;
  onClose:   () => void;
  onSaved:   () => void;
}

export default function GradeModal({ attemptId, onClose, onSaved }: GradeModalProps): React.ReactNode {
  const { success, error } = useToast();

  const [result,   setResult]   = useState<AttemptResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Local grade state: answerId → true | false | null (null = not yet decided)
  const [grades, setGrades] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!attemptId) { setResult(null); setGrades(new Map()); return; }
    setLoading(true);
    fetch(`/api/attempts/${attemptId}`)
      .then((r) => r.json())
      .then((d: { data?: AttemptResult }) => {
        if (d.data) {
          setResult(d.data);
          // Pre-populate with existing manual grades
          const initial = new Map<string, boolean>();
          for (const q of d.data.questions) {
            if (q.type === "SHORT_ANSWER" && q.answerId && q.isManuallyCorrect !== null) {
              initial.set(q.answerId, q.isManuallyCorrect);
            }
          }
          setGrades(initial);
        }
      })
      .catch(() => error("Load failed", "Could not load attempt details."))
      .finally(() => setLoading(false));
  }, [attemptId, error]);

  const saQuestions = result?.questions.filter((q) => q.type === "SHORT_ANSWER") ?? [];
  const allGraded   = saQuestions.every((q) => q.answerId && grades.has(q.answerId));

  async function handleSubmit() {
    if (!attemptId || !allGraded) return;
    setSaving(true);
    try {
      const gradePayload = [...grades.entries()].map(([answerId, isCorrect]) => ({
        answerId,
        isCorrect,
      }));
      const res = await fetch(`/api/attempts/${attemptId}/grade`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ grades: gradePayload }),
      });
      const data = await res.json() as { data?: { score: number; passed: boolean }; error?: string };
      if (!res.ok) {
        error("Save failed", data.error ?? "Could not save grades.");
        return;
      }
      success(
        "Grading saved",
        `Score updated to ${data.data!.score}% — ${data.data!.passed ? "Passed" : "Not passed"}.`,
      );
      onSaved();
      onClose();
    } catch {
      error("Save failed", "Could not save grades.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(q: ResultQuestion, value: boolean) {
    if (!q.answerId) return;
    setGrades((prev) => new Map(prev).set(q.answerId!, value));
  }

  return (
    <Modal
      isOpen={!!attemptId}
      onClose={onClose}
      title="Grade Short Answers"
      size="lg"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && result && (
        <div className="space-y-5">
          {/* Attempt meta */}
          <div className="glass rounded-xl p-3 flex flex-wrap gap-3 text-xs text-muted">
            <span className="font-medium text-foreground">{result.examTitle}</span>
            <span>·</span>
            <span>{result.linkedTitle}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(result.submittedAt).toLocaleString()}
            </span>
          </div>

          {saQuestions.length === 0 && (
            <p className="text-muted text-sm text-center py-6">
              This attempt has no short-answer questions.
            </p>
          )}

          {/* SA questions */}
          <div className="space-y-4">
            {saQuestions.map((q, i) => {
              const graded   = q.answerId ? grades.get(q.answerId) : undefined;
              const answered = graded !== undefined;

              return (
                <div key={q.id} className="rounded-xl border border-white/40 bg-white/30 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{q.text}</p>
                  </div>

                  {/* Employee's answer */}
                  <div className="ml-8 rounded-lg bg-white/50 border border-white/60 px-3 py-2">
                    <p className="text-xs text-muted mb-0.5">Employee&apos;s answer</p>
                    <p className="text-sm text-foreground italic">
                      {q.textAnswer ?? <span className="text-muted not-italic">(no answer provided)</span>}
                    </p>
                  </div>

                  {/* Grade buttons */}
                  <div className="ml-8 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(q, true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        graded === true
                          ? "bg-success text-white border-success shadow-sm"
                          : "border-success/40 text-success hover:bg-success/10"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(q, false)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        graded === false
                          ? "bg-danger text-white border-danger shadow-sm"
                          : "border-danger/40 text-danger hover:bg-danger/10"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </button>
                    {answered && (
                      <span className={`ml-auto text-xs font-semibold self-center ${graded ? "text-success" : "text-danger"}`}>
                        {graded ? "✓ Marked correct" : "✗ Marked incorrect"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/30">
            <p className="text-xs text-muted">
              {saQuestions.filter((q) => q.answerId && grades.has(q.answerId)).length} of {saQuestions.length} graded
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSubmit} loading={saving} disabled={!allGraded || saving}>
                Save Grades
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
