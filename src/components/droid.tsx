"use client";
/**
 * ID Copilot companion: a restrained avionics-service-droid mark. Four states drive small,
 * legible changes (eye colour, scan bar, status ring). No bouncing, no speech bubbles.
 */
export type DroidState = "idle" | "scanning" | "done" | "attention";

const EYE: Record<DroidState, string> = { idle: "var(--accent)", scanning: "var(--ok)", done: "var(--ok)", attention: "var(--gold)" };

export function Droid({ state = "idle", size = 40, label }: { state?: DroidState; size?: number; label?: string }) {
  const eye = EYE[state];
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={label ?? `ID Copilot ${state}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* status ring */}
        <circle cx="24" cy="24" r="22" stroke={state === "attention" ? "var(--gold)" : "var(--line-2)"} strokeWidth="1.2" strokeDasharray={state === "scanning" ? "4 3" : undefined} className={state === "scanning" ? "droid-pulse" : undefined} />
        {/* head */}
        <rect x="12" y="14" width="24" height="18" rx="4" fill="var(--panel-2)" stroke="var(--line-2)" strokeWidth="1.2" />
        {/* antenna */}
        <path d="M24 14 V9" stroke="var(--muted)" strokeWidth="1.4" />
        <circle cx="24" cy="8" r="1.8" fill={state === "done" ? "var(--ok)" : "var(--muted)"} />
        {/* visor */}
        <rect x="16" y="19" width="16" height="7" rx="2" fill="#0a0f14" stroke="var(--line)" strokeWidth="1" />
        {state === "scanning" ? (
          <rect x="21" y="20.5" width="6" height="4" rx="1" fill={eye} className="droid-scan" />
        ) : (
          <>
            <rect x="19" y="20.8" width="3.4" height="3.4" rx="0.8" fill={eye} className="droid-blink" />
            <rect x="25.6" y="20.8" width="3.4" height="3.4" rx="0.8" fill={eye} className="droid-blink" />
          </>
        )}
        {/* mouth grille */}
        <path d="M19 29 H29" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 1.5" />
        {/* shoulder line */}
        <path d="M9 38 Q24 33 39 38" stroke="var(--line-2)" strokeWidth="1.2" />
        {state === "done" && <path d="M33 11 l2 2 4-4" stroke="var(--ok)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
        {state === "attention" && <path d="M36 9 v4 M36 15.5 v0.5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />}
      </svg>
    </span>
  );
}
