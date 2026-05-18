// src/app/(frontend)/(learner)/exam/[examId]/components/ExamSubmitModal.tsx
"use client";

import { AlertCircle } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";

interface ExamSubmitModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onConfirm:   () => void;
  answered:    number;
  total:       number;
  submitting:  boolean;
}

export default function ExamSubmitModal({
  isOpen,
  onClose,
  onConfirm,
  answered,
  total,
  submitting,
}: ExamSubmitModalProps): React.ReactNode {
  const unanswered = total - answered;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Exam"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Go Back
          </Button>
          <Button onClick={onConfirm} loading={submitting}>
            Submit Now
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="w-14 h-14 rounded-2xl bg-warning/15 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-warning" />
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">
            You have answered <span className="text-primary">{answered}</span> of{" "}
            <span className="text-primary">{total}</span> questions.
          </p>
          {unanswered > 0 && (
            <p className="text-xs text-muted mt-1.5">
              {unanswered} question{unanswered > 1 ? "s" : ""} left unanswered —
              they will be marked incorrect.
            </p>
          )}
          {unanswered === 0 && (
            <p className="text-xs text-muted mt-1.5">All questions answered. Ready to submit!</p>
          )}
        </div>

        <p className="text-xs text-muted/70 italic">This action cannot be undone.</p>
      </div>
    </Modal>
  );
}
