// src/app/(frontend)/(auth)/layout.tsx
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — bold branding ───────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-start justify-between p-12 relative overflow-hidden"
        style={{ backgroundImage: "url('/image/agila_cover.webp')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Blue overlay */}
        <div className="absolute inset-0 bg-blue-950/65 pointer-events-none" />
        {/* Decorative circles */}
        <div className="absolute top-8 right-16 w-20 h-20 rounded-full border-2 border-white/20 pointer-events-none" />
        <div className="absolute top-16 right-8 w-8 h-8 rounded-full bg-sky-300/30 pointer-events-none" />
        <div className="absolute bottom-32 left-8 w-14 h-14 rounded-full border border-white/15 pointer-events-none" />
        <div className="absolute bottom-48 right-24 w-6 h-6 rounded-full bg-blue-300/40 pointer-events-none" />

        {/* Bottom wave shape */}
        <svg
          className="absolute bottom-0 left-0 w-full pointer-events-none"
          viewBox="0 0 640 220"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 C160,160 320,20 480,100 C560,140 600,180 640,160 L640,220 L0,220 Z"
            fill="rgba(255,255,255,0.07)"
          />
          <path
            d="M0,120 C120,60 280,180 440,120 C540,80 600,140 640,120 L640,220 L0,220 Z"
            fill="rgba(255,255,255,0.05)"
          />
        </svg>

        {/* Top: company logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Image src="/image/agila_icon.ico" alt="Agila" width={28} height={28} unoptimized className="object-contain" />
          </div>
          <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">Agila Business Academy</span>
        </div>

        {/* Center: headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p className="text-sky-200 text-sm font-medium tracking-widest uppercase mb-4">
            Nice to see you
          </p>
          <h1 className="text-white font-black text-5xl xl:text-6xl leading-tight mb-6 tracking-tight">
            WELCOME<br />
          </h1>
          <div className="w-12 h-1 bg-white/60 rounded-full mb-6" />
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Access your training videos, complete exams, and earn certificates. All in one place built for Agila employees.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-[#0f172a]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Image src="/image/agila_icon.ico" alt="Agila" width={30} height={30} unoptimized className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">Agila</p>
              <p className="text-muted text-xs tracking-widest uppercase">Business Academy</p>
            </div>
          </div>

          {children}
        </div>
      </div>

    </div>
  );
}
