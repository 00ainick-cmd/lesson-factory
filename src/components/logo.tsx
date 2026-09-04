/** Studio mark: a runway-approach chevron with a horizon bar and a beacon. Monochrome via currentColor; accents as enhancement. */
export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Lesson Factory Studio" role="img">
        <path d="M6 24 L16 6 L26 24" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M10 19 H22" stroke="var(--accent)" strokeWidth="2.4" />
        <circle cx="16" cy="24" r="2" fill="var(--gold)" />
      </svg>
      {withText && (
        <span className="font-display leading-none">
          <span className="block text-[15px] font-semibold tracking-wide">Lesson Factory</span>
          <span className="block text-[10px] font-medium tracking-[0.22em] text-muted">STUDIO</span>
        </span>
      )}
    </span>
  );
}
