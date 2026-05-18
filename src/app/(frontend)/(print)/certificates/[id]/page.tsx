// src/app/(frontend)/(print)/certificates/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CertificateTemplate from "@/components/UI/CertificateTemplate";
import type { CertificateItem, SignatoryData } from "@/app/(backend)/api/certificates/route";

export default function CertificatePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactNode {
  const { id } = use(params);
  const { user } = useAuth();

  const [certificate, setCertificate] = useState<CertificateItem | null>(null);
  const [signatories, setSignatories] = useState<SignatoryData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);

  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((data) => {
        const certs: CertificateItem[] = data.data?.certificates ?? [];
        const match = certs.find((c) => c.id === id);
        if (!match) { setNotFound(true); return; }
        setCertificate(match);
        setSignatories(data.data?.signatories ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500 font-medium">Certificate not found.</p>
        <a href="/certificates" className="text-indigo-600 text-sm hover:underline">
          ← Back to Certificates
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar — hidden when printing */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white/95 backdrop-blur"
        style={{ printColorAdjust: "exact" } as React.CSSProperties}
      >
        <style>{`@media print { #cert-toolbar { display: none !important; } }`}</style>
        <div id="cert-toolbar" className="flex items-center justify-between w-full">
          <a
            href="/certificates"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Certificates
          </a>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400 hidden sm:block">{certificate.seriesTitle}</p>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#4f46e5" }}
            >
              <Printer className="w-4 h-4" />
              Print / Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Certificate preview */}
      <div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20 pb-10 px-4">
        <div className="w-full shadow-2xl rounded-sm" style={{ maxWidth: 900 }}>
          <CertificateTemplate
            certificate={certificate}
            recipientName={user?.name ?? "Employee"}
            signatories={signatories}
          />
        </div>
      </div>
    </>
  );
}
