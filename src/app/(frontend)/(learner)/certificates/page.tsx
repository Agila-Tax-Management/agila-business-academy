// src/app/(learner)/certificates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Award, Download, Calendar, BadgeCheck } from "lucide-react";

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
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-48 bg-muted-bg animate-pulse rounded-lg" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-muted text-sm mt-1">
          Certificates are issued when you complete all modules and pass the final exam of a series.
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted-bg flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No certificates yet</h3>
          <p className="text-sm text-muted mt-1 max-w-xs">
            Complete a full series and pass all exams to earn your first certificate.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
            >
              {/* Certificate header strip */}
              <div className="bg-primary px-5 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">
                      Certificate of Completion
                    </p>
                    <p className="text-white font-bold text-sm leading-tight mt-0.5">
                      Agila Business Academy
                    </p>
                  </div>
                </div>
                <BadgeCheck className="w-6 h-6 text-white/80" />
              </div>

              {/* Certificate body */}
              <div className="px-5 py-4 flex-1 space-y-3">
                <h3 className="text-sm font-semibold text-foreground leading-snug">{cert.seriesTitle}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued {new Date(cert.issuedAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted font-mono">ID: {cert.credentialId}</p>
              </div>

              {/* Download button */}
              <div className="px-5 pb-4">
                <button className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium py-2 rounded-lg transition-colors">
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
