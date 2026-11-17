// The MeterProof mark: a P whose counter is a meter dial; the red needle is the reading.
// Masters and usage rules live in brand/ (see brand/README.md).

/** Path data on a 256 × 256 grid. Shared with the PDF footer (lib/pdf.ts). */
export const MARK = {
  /** Stem plus bowl, with the dial counter as a hole (nonzero winding). */
  letter: "M40,20 H92 V236 H40 Z M140,16 A76,76 0 1 1 140,168 A76,76 0 1 1 140,16 Z M140,56 A36,36 0 1 0 140,128 A36,36 0 1 0 140,56 Z",
  hub: { cx: 140, cy: 92, r: 12 },
  needle: "M134.34,86.34 L159.80,60.88 L171.12,72.20 L145.66,97.66 Z",
} as const;

/**
 * The symbol alone. The letter takes the text colour; the needle is brick red on light
 * backgrounds. Pass needle="var(--color-accent)" on dark ones. Decorative: label the link around it.
 */
export function LogoMark({ className, needle = "var(--color-accent-2)" }: { className?: string; needle?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true" focusable="false">
      <path fill="currentColor" d={MARK.letter} />
      <circle fill={needle} {...MARK.hub} />
      <path fill={needle} d={MARK.needle} />
    </svg>
  );
}

/** Symbol plus the name, set in General Sans by the surrounding text styles. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`}>
      <LogoMark className="h-[1.15em] w-[1.15em] shrink-0" />
      MeterProof
    </span>
  );
}
