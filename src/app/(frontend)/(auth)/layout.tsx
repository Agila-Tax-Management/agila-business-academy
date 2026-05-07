// src/app/(auth)/layout.tsx

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-primary/5" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-xl leading-tight">Agila</p>
              <p className="text-sidebar-muted text-xs tracking-widest uppercase">Business Academy</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Learn. Grow.<br />Succeed.
          </h1>
          <p className="text-sidebar-muted text-sm max-w-xs leading-relaxed">
            Access your training videos, complete exams, and earn certificates — all in one place.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: "Courses", value: "50+" },
              { label: "Videos", value: "200+" },
              { label: "Certificates", value: "∞" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white text-2xl font-bold">{s.value}</p>
                <p className="text-sidebar-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold">A</span>
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
