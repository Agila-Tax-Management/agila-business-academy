// src/app/(frontend)/(admin)/admin/employees/components/EnrollModal.tsx
"use client";

import { useEffect, useState } from "react";
import { BookOpen, Trash2, Plus, ChevronDown } from "lucide-react";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import { useToast } from "@/context/ToastContext";
import type { EnrollmentItem } from "@/app/(backend)/api/enrollment/route";

interface SeriesOption {
  id: string;
  title: string;
}

interface EnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: string; name: string } | null;
}

export default function EnrollModal({ isOpen, onClose, employee }: EnrollModalProps): React.ReactNode {
  const { success, error } = useToast();

  const [enrollments,       setEnrollments]       = useState<EnrollmentItem[]>([]);
  const [allSeries,         setAllSeries]          = useState<SeriesOption[]>([]);
  const [selectedSeriesId,  setSelectedSeriesId]  = useState("");
  const [loadingList,       setLoadingList]        = useState(false);
  const [loadingSeries,     setLoadingSeries]      = useState(false);
  const [enrolling,         setEnrolling]          = useState(false);
  const [removingId,        setRemovingId]         = useState<string | null>(null);

  // Reset selected series when modal opens / employee changes
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${isOpen}-${employee?.id ?? ""}`;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    setSelectedSeriesId("");
    if (!isOpen) { setEnrollments([]); setAllSeries([]); }
  }

  // Fetch enrollments when modal opens
  useEffect(() => {
    if (!isOpen || !employee?.id) return;
    let cancelled = false;
    setLoadingList(true);
    fetch(`/api/enrollment?userId=${employee.id}`)
      .then((r) => r.json())
      .then((d: { data?: EnrollmentItem[] }) => {
        if (!cancelled) setEnrollments(d.data ?? []);
      })
      .catch(() => { if (!cancelled) error("Load failed", "Could not load enrollments."); })
      .finally(() => { if (!cancelled) setLoadingList(false); });
    return () => { cancelled = true; };
  }, [isOpen, employee?.id, error]);

  // Fetch all series when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingSeries(true);
    fetch("/api/series")
      .then((r) => r.json())
      .then((d: { data?: { id: string; title: string }[] }) => {
        if (!cancelled) setAllSeries((d.data ?? []).map((s) => ({ id: s.id, title: s.title })));
      })
      .catch(() => { /* non-critical — dropdown stays empty */ })
      .finally(() => { if (!cancelled) setLoadingSeries(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  const enrolledIds = new Set(enrollments.map((e) => e.seriesId));
  const unrolledSeries = allSeries.filter((s) => !enrolledIds.has(s.id));

  async function handleEnroll() {
    if (!selectedSeriesId || !employee) return;
    const series = allSeries.find((s) => s.id === selectedSeriesId);
    if (!series) return;

    setEnrolling(true);
    try {
      const res  = await fetch("/api/enrollment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: employee.id, seriesId: series.id, seriesTitle: series.title }),
      });
      const data = await res.json() as { data?: EnrollmentItem; error?: string };
      if (!res.ok) { error("Enroll failed", data.error ?? "Could not enroll employee."); return; }
      setEnrollments((prev) => [...prev, data.data!]);
      setSelectedSeriesId("");
      success("Enrolled", `${employee.name} has been enrolled in "${series.title}".`);
    } catch {
      error("Enroll failed", "An unexpected error occurred.");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRemove(enrollment: EnrollmentItem) {
    setRemovingId(enrollment.id);
    try {
      const res  = await fetch(`/api/enrollment/${enrollment.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) { error("Remove failed", data.error ?? "Could not remove enrollment."); return; }
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
      success("Unenrolled", `Removed from "${enrollment.seriesTitle}".`);
    } catch {
      error("Remove failed", "An unexpected error occurred.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Enrollments${employee ? ` — ${employee.name}` : ""}`}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        {/* Current enrollments */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Current Enrollments</h3>

          {loadingList ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-muted-bg rounded-lg animate-pulse" />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted bg-muted-bg rounded-xl">
              <BookOpen className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No active enrollments.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {enrollments.map((enr) => (
                <li key={enr.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-muted-bg rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{enr.seriesTitle}</p>
                    <p className="text-xs text-muted">
                      Enrolled {new Date(enr.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(enr)}
                    disabled={removingId === enr.id}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0 disabled:opacity-40"
                    title="Remove enrollment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Enroll in new series */}
        {(loadingSeries || unrolledSeries.length > 0) && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Enroll in Series</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  disabled={loadingSeries}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                >
                  <option value="">{loadingSeries ? "Loading series…" : "Select a series…"}</option>
                  {unrolledSeries.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
              <Button
                variant="primary"
                loading={enrolling}
                disabled={!selectedSeriesId || enrolling || loadingSeries}
                onClick={handleEnroll}
              >
                <Plus className="w-4 h-4" />
                Enroll
              </Button>
            </div>
          </div>
        )}

        {!loadingSeries && unrolledSeries.length === 0 && enrollments.length > 0 && (
          <p className="text-xs text-muted text-center py-2">
            This employee is enrolled in all available series.
          </p>
        )}
      </div>
    </Modal>
  );
}
