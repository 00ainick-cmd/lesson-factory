import { Logo } from "./logo";

export function AuthFrame({ title, subtitle, footer = "Private workspace · Invite only", children }: { title: string; subtitle?: string; footer?: string; children: React.ReactNode }) {
  return (
    <main className="grid-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Logo size={34} />
        </div>
        <div className="rounded-md border border-line bg-panel p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <h1 className="font-display text-[20px] font-semibold tracking-wide">{title}</h1>
          {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{footer}</p>
      </div>
    </main>
  );
}
