// src/app/(frontend)/(admin)/admin/exams/components/QuestionBuilderModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import Badge from "@/components/UI/Badge";
import { useToast } from "@/context/ToastContext";
import type { QuestionItem, QuestionType, ChoiceItem } from "@/app/(backend)/api/exams/[id]/questions/route";

interface QuestionBuilderModalProps {
  isOpen: boolean;
  examId: string;
  examTitle: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE:      "True / False",
  SHORT_ANSWER:    "Short Answer",
};

const TYPE_BADGE: Record<QuestionType, "neutral" | "success" | "warning"> = {
  MULTIPLE_CHOICE: "neutral",
  TRUE_FALSE:      "success",
  SHORT_ANSWER:    "warning",
};

const DEFAULT_CHOICES = (): Array<{ text: string; isCorrect: boolean }> => [
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

const TRUE_FALSE_CHOICES: Array<{ text: string; isCorrect: boolean }> = [
  { text: "True",  isCorrect: false },
  { text: "False", isCorrect: false },
];

export default function QuestionBuilderModal({
  isOpen,
  examId,
  examTitle,
  onClose,
}: QuestionBuilderModalProps): React.ReactNode {
  const { error } = useToast();

  const [questions,   setQuestions]   = useState<QuestionItem[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // New question form state
  const [qText,    setQText]    = useState("");
  const [qType,    setQType]    = useState<QuestionType>("MULTIPLE_CHOICE");
  const [choices,  setChoices]  = useState<Array<{ text: string; isCorrect: boolean }>>(DEFAULT_CHOICES());

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/exams/${examId}/questions`);
      const data = await res.json() as { data?: QuestionItem[]; error?: string };
      if (res.ok) setQuestions(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (isOpen) void fetchQuestions();
  }, [isOpen, fetchQuestions]);

  function resetForm() {
    setQText("");
    setQType("MULTIPLE_CHOICE");
    setChoices(DEFAULT_CHOICES());
    setShowForm(false);
  }

  function handleTypeChange(type: QuestionType) {
    setQType(type);
    if (type === "TRUE_FALSE") {
      setChoices(TRUE_FALSE_CHOICES.map((c) => ({ ...c })));
    } else if (type === "SHORT_ANSWER") {
      setChoices([]);
    } else {
      setChoices(DEFAULT_CHOICES());
    }
  }

  function updateChoice(index: number, field: "text" | "isCorrect", value: string | boolean) {
    setChoices((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        return { ...c, [field]: value };
      }),
    );
  }

  function markCorrect(index: number) {
    setChoices((prev) =>
      prev.map((c, i) => ({ ...c, isCorrect: i === index })),
    );
  }

  function addChoice() {
    setChoices((prev) => [...prev, { text: "", isCorrect: false }]);
  }

  function removeChoice(index: number) {
    setChoices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddQuestion() {
    if (!qText.trim()) { error("Missing text", "Question text is required."); return; }

    if (qType !== "SHORT_ANSWER") {
      const filled = choices.filter((c) => c.text.trim());
      if (filled.length < 2) { error("Missing choices", "Add at least 2 answer choices."); return; }
      if (!choices.some((c) => c.isCorrect)) { error("No correct answer", "Mark at least one correct answer."); return; }
    }

    const payload = {
      text:    qText.trim(),
      type:    qType,
      choices: qType === "SHORT_ANSWER"
        ? []
        : choices.filter((c) => c.text.trim()),
    };

    setSubmitting(true);
    try {
      const res  = await fetch(`/api/exams/${examId}/questions`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { data?: QuestionItem; error?: string };
      if (!res.ok) { error("Failed to add", data.error ?? "Something went wrong."); return; }
      if (data.data) setQuestions((prev) => [...prev, data.data!]);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(questionId: string) {
    setDeletingId(questionId);
    try {
      const res = await fetch(`/api/exams/${examId}/questions/${questionId}`, { method: "DELETE" });
      if (!res.ok) { error("Delete failed", "Could not remove the question."); return; }
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Questions — ${examTitle}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-muted">
            {questions.length} question{questions.length !== 1 ? "s" : ""} added
          </span>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">

        {/* Existing questions list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/40 animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            No questions yet. Add your first question below.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx + 1}
                deleting={deletingId === q.id}
                onDelete={() => void handleDelete(q.id)}
              />
            ))}
          </div>
        )}

        {/* Add question toggle */}
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2"
          >
            <Plus className="w-4 h-4" />
            Add a question
          </button>
        ) : (
          <AddQuestionForm
            qText={qText}
            qType={qType}
            choices={choices}
            submitting={submitting}
            onTextChange={setQText}
            onTypeChange={handleTypeChange}
            onUpdateChoice={updateChoice}
            onMarkCorrect={markCorrect}
            onAddChoice={addChoice}
            onRemoveChoice={removeChoice}
            onSubmit={() => void handleAddQuestion()}
            onCancel={resetForm}
          />
        )}
      </div>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuestionItem;
  index:    number;
  deleting: boolean;
  onDelete: () => void;
}

function QuestionCard({ question, index, deleting, onDelete }: QuestionCardProps): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10">
      <span className="shrink-0 w-6 h-6 rounded-full gradient-bg text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium leading-snug">{question.text}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant={TYPE_BADGE[question.type]} size="sm">
            {TYPE_LABELS[question.type]}
          </Badge>
          {question.choices.length > 0 && (
            <span className="text-xs text-muted">
              {question.choices.filter((c: ChoiceItem) => c.isCorrect).map((c: ChoiceItem) => c.text).join(", ")} ✓
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="shrink-0 p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
        aria-label="Delete question"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface AddQuestionFormProps {
  qText:        string;
  qType:        QuestionType;
  choices:      Array<{ text: string; isCorrect: boolean }>;
  submitting:   boolean;
  onTextChange: (v: string) => void;
  onTypeChange: (t: QuestionType) => void;
  onUpdateChoice:  (i: number, f: "text" | "isCorrect", v: string | boolean) => void;
  onMarkCorrect:   (i: number) => void;
  onAddChoice:     () => void;
  onRemoveChoice:  (i: number) => void;
  onSubmit:        () => void;
  onCancel:        () => void;
}

function AddQuestionForm({
  qText, qType, choices, submitting,
  onTextChange, onTypeChange, onUpdateChoice, onMarkCorrect,
  onAddChoice, onRemoveChoice, onSubmit, onCancel,
}: AddQuestionFormProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10">
      {/* Question type tabs */}
      <div>
        <label className="text-xs font-medium text-muted mb-1.5 block uppercase tracking-wide">Question Type</label>
        <div className="flex gap-2">
          {(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] as QuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTypeChange(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                qType === t
                  ? "gradient-bg text-white border-transparent"
                  : "border-white/50 bg-white/40 text-muted hover:text-foreground hover:bg-white/60"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="text-xs font-medium text-muted mb-1.5 block uppercase tracking-wide">Question</label>
        <textarea
          value={qText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter the question text…"
          rows={2}
          className="w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm text-foreground px-3 py-2 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
        />
      </div>

      {/* Choices */}
      {qType === "MULTIPLE_CHOICE" && (
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 block uppercase tracking-wide">
            Answer Choices <span className="normal-case text-muted/70">(click the circle to mark correct)</span>
          </label>
          <div className="flex flex-col gap-2">
            {choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMarkCorrect(i)}
                  className="shrink-0 text-muted hover:text-green-500 transition-colors"
                  aria-label={c.isCorrect ? "Correct answer" : "Mark as correct"}
                >
                  {c.isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle       className="w-5 h-5" />
                  }
                </button>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => onUpdateChoice(i, "text", e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                  className="flex-1 h-9 rounded-lg border border-white/60 bg-white/60 text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                {choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveChoice(i)}
                    className="shrink-0 p-1 rounded text-muted hover:text-red-500 transition-colors"
                    aria-label="Remove choice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {choices.length < 6 && (
              <button
                type="button"
                onClick={onAddChoice}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add choice
              </button>
            )}
          </div>
        </div>
      )}

      {qType === "TRUE_FALSE" && (
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 block uppercase tracking-wide">
            Correct Answer
          </label>
          <div className="flex gap-3">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onMarkCorrect(i)}
                className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  c.isCorrect
                    ? "bg-green-500/20 border-green-400 text-green-700 dark:text-green-400"
                    : "border-white/50 bg-white/40 text-muted hover:bg-white/60"
                }`}
              >
                {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {qType === "SHORT_ANSWER" && (
        <p className="text-xs text-muted italic">
          Short answer questions are graded manually — no choices needed.
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit} loading={submitting}>
          Add Question
        </Button>
      </div>
    </div>
  );
}
