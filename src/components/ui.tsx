import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ok";
export function Button({ variant = "secondary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]",
        variant === "primary" && "bg-accent text-white hover:bg-[#3d9bff]",
        variant === "secondary" && "border border-line-2 bg-panel text-ink hover:border-faint hover:bg-panel-2",
        variant === "ghost" && "text-muted hover:bg-panel-2 hover:text-ink",
        variant === "danger" && "border border-bad/40 text-bad hover:bg-bad/10",
        variant === "ok" && "bg-ok/15 text-ok border border-ok/40 hover:bg-ok/25",
        className,
      )}
    />
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={clsx("h-9 w-full rounded border border-line-2 bg-rail px-3 text-[13px] text-ink placeholder:text-faint focus:border-accent", className)} />;
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={clsx("w-full rounded border border-line-2 bg-rail px-3 py-2 text-[13px] text-ink placeholder:text-faint focus:border-accent", className)} />;
}
export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={clsx("h-9 w-full rounded border border-line-2 bg-rail px-2 text-[13px] text-ink focus:border-accent", className)} />;
}

export function Field({ label, hint, children, id }: { label: string; hint?: string; children: React.ReactNode; id?: string }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-faint">{hint}</span>}
    </label>
  );
}

export function Badge({ tone = "muted", children, className }: { tone?: "muted" | "accent" | "ok" | "gold" | "bad" | "info"; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border px-1.5 py-[1px] font-mono text-[10.5px] uppercase tracking-wider",
        tone === "muted" && "border-line-2 text-muted",
        tone === "accent" && "border-accent/50 text-accent",
        tone === "ok" && "border-ok/50 text-ok",
        tone === "gold" && "border-gold/50 text-gold",
        tone === "bad" && "border-bad/50 text-bad",
        tone === "info" && "border-line-2 text-faint",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function severityTone(sev: string): "muted" | "accent" | "ok" | "gold" | "bad" | "info" {
  return sev === "blocker" || sev === "error" ? "bad" : sev === "warning" ? "gold" : "info";
}

export function Card({ title, actions, children, className }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-md border border-line bg-panel", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line-2 px-6 py-10 text-center">
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-sm border border-line-2 bg-rail px-1 font-mono text-[10.5px] text-muted">{children}</kbd>;
}

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
export function fmtBytes(n: number) {
  return n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : n > 1024 ? `${(n / 1024).toFixed(0)} KB` : `${n} B`;
}
