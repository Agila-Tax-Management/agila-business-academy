// src/components/UI/CertificateTemplate.tsx
"use client";

import Image from "next/image";
import type { CertificateItem, SignatoryData } from "@/app/(backend)/api/certificates/route";

interface CertificateTemplateProps {
  certificate:   CertificateItem;
  recipientName: string;
  signatories:   SignatoryData[];
}

export default function CertificateTemplate({
  certificate,
  recipientName,
  signatories,
}: CertificateTemplateProps): React.ReactNode {
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      {/* Print: isolate only the certificate, landscape A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-printable,
          #certificate-printable * { visibility: visible !important; }
          #certificate-printable {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 99999 !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      <div
        id="certificate-printable"
        className="relative bg-white w-full"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", aspectRatio: "1.414 / 1" }}
      >
        {/* Outer gold-indigo border */}
        <div className="absolute inset-2 pointer-events-none"
             style={{ border: "6px double #4f46e5" }} />
        <div className="absolute inset-4 pointer-events-none"
             style={{ border: "1px solid #c7d2fe" }} />

        {/* Top colour bar */}
        <div className="absolute top-0 left-0 right-0 h-2"
             style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8,#4f46e5)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-2"
             style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8,#4f46e5)" }} />

        {/* Content */}
        <div className="relative flex flex-col items-center text-center px-16 pt-8 pb-6 h-full justify-between">

          {/* ── TOP: logo + academy name ── */}
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/image/agila_logo.webp"
              alt="Agila Business Academy"
              width={72}
              height={72}
              className="object-contain"
              style={{ height: 56, width: "auto" }}
            />
            <p className="text-[11px] font-bold tracking-[0.3em] uppercase mt-1"
               style={{ color: "#4f46e5" }}>
              Agila Business Academy
            </p>
            <p className="text-2xl font-bold tracking-wide"
               style={{ color: "#1e1b4b" }}>
              Certificate of Completion
            </p>
            {/* Ornamental divider */}
            <div className="flex items-center gap-2 mt-1" style={{ width: 220 }}>
              <div className="flex-1 h-px" style={{ background: "#c7d2fe" }} />
              <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#4f46e5" }} />
              <div className="flex-1 h-px" style={{ background: "#c7d2fe" }} />
            </div>
          </div>

          {/* ── MIDDLE: recipient ── */}
          <div className="flex flex-col items-center gap-2 flex-1 justify-center">
            <p className="text-[11px] tracking-[0.25em] uppercase" style={{ color: "#9ca3af" }}>
              This is to certify that
            </p>

            <h2
              className="font-bold"
              style={{
                color:      "#1e1b4b",
                fontSize:   "clamp(1.6rem, 4vw, 2.6rem)",
                lineHeight: 1.15,
                fontFamily: "'Georgia', serif",
                letterSpacing: "0.02em",
              }}
            >
              {recipientName}
            </h2>

            <div style={{ width: 260, height: 2, background: "linear-gradient(90deg,transparent,#4f46e5,transparent)" }} />

            <p className="text-sm max-w-lg leading-relaxed" style={{ color: "#4b5563" }}>
              has successfully completed the full series of required learning modules and successfully passed the final assessment, demonstrating a strong understanding of the concepts, skills, and competencies covered throughout the program.
            </p>

            <p
              className="font-bold italic px-5 py-2 rounded-lg"
              style={{ color: "#4f46e5", background: "#eef2ff", fontSize: "1.1rem" }}
            >
              &ldquo;{certificate.seriesTitle}&rdquo;
            </p>

            <p className="text-xs" style={{ color: "#6b7280" }}>
              Issued on{" "}
              <span className="font-semibold" style={{ color: "#374151" }}>{issuedDate}</span>
              {"  "}
              <span className="font-mono" style={{ color: "#9ca3af" }}>{certificate.credentialId}</span>
            </p>
          </div>

          {/* ── BOTTOM: signatories ── */}
          {signatories.length > 0 && (
            <div
              className="w-full pt-4"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <div
                className="flex gap-8"
                style={{
                  justifyContent: signatories.length === 1 ? "center" : "space-around",
                  flexWrap: "wrap",
                }}
              >
                {signatories.map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-1 min-w-27.5">
                    <div style={{ width: 130, height: 1, background: "#374151", marginBottom: 4 }} />
                    <p className="font-bold text-sm" style={{ color: "#1e1b4b" }}>{s.name}</p>
                    <p className="text-[11px] tracking-wide" style={{ color: "#6b7280" }}>{s.position}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}