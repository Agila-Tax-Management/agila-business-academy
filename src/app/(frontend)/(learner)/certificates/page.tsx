// src/app/(frontend)/(learner)/certificates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Award, Download, Calendar, BadgeCheck, Trophy } from "lucide-react";

interface Certificate {
  id: string;
  seriesTitle: string;
  issuedAt: string;
  credentialId: string;
}

const MOCK: Certificate[] = [
  {
    id: "cert-1",
    seriesTitle: "New Employee Onboarding",
    issuedAt: "2026-05-01",
    credentialId: "ABA-2026-0001",
  },
];

export default function CertificatesPage(): React.ReactNode {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: replace with real API call to /api/certificates
    const timer = setTimeout(() => {
      setCertificates(MOCK);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-fade-up">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto animate-fade-up">

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Certificates</h1>
        <p className="text-muted text-sm mt-1">
          Earned by completing all modules and passing the final exam of a series.
        </p>
      </div>

      {/* ── Empty state ─────────────────────────────────────── */}
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-5 shadow-[0_4px_24px_rgba(99,102,241,0.12)]">
            <Trophy className="w-9 h-9 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No certificates yet</h3>
          <p className="text-sm text-muted max-w-xs">
            Complete a full series and pass all exams to earn your first certificate.
          </p>
        </div>

      /* ── Certificate grid ─────────────────────────────────── */
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="glass-strong rounded-2xl overflow-hidden flex flex-col border border-white/50 shadow-[0_4px_24px_rgba(99,102,241,0.10)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(99,102,241,0.18)] transition-all duration-200"
            >
              {/* Header strip */}
              <div className="gradient-bg px-5 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">
                      Certificate of Completion
                    </p>
                    <p className="text-white font-extrabold text-sm leading-tight mt-0.5">
                      Agila Business Academy
                    </p>
                  </div>
                </div>
                <BadgeCheck className="w-6 h-6 text-white/80" />
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex-1 space-y-3">
                <h3 className="text-sm font-bold text-foreground leading-snug">{cert.seriesTitle}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued {new Date(cert.issuedAt).toLocaleDateString("en-PH", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted font-mono bg-white/40 px-2 py-1 rounded-lg inline-block">
                  {cert.credentialId}
                </p>
              </div>

              {/* Download */}
              <div className="px-5 pb-4">
                <button className="w-full flex items-center justify-center gap-2 glass text-primary text-sm font-semibold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all duration-150 border border-primary/20">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
