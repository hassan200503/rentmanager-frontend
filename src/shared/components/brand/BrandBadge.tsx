interface BrandBadgeProps {
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
  /** Render an always-light, premium wordmark for dark surfaces
      (landing hero/nav) where theme tokens would turn near-invisible. */
  onDark?: boolean;
}

const sizes = {
  sm: { logoSize: 16, textSize: "text-xs", gap: "gap-2" },
  md: { logoSize: 20, textSize: "text-sm", gap: "gap-2.5" },
  lg: { logoSize: 26, textSize: "text-base", gap: "gap-3" },
};

/* Premium dark-surface wordmark — white melting into jade with a
   soft glow so it stays legible over video/photos while reading
   expensive. Shared with the platform-logo branch of PlatformBrand. */
export const ON_DARK_WORDMARK =
  "font-display font-semibold tracking-[-0.02em] bg-gradient-to-r from-white via-white to-jade-300 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(16,185,129,0.45)]";

/* The wordmark over light surfaces — ink tokens track the theme. */
const LIGHT_WORDMARK = "font-display font-semibold tracking-[-0.02em] text-fg dark:text-fg-dark";

export function BadgeMark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="badge-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="badge-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="badge-glow" cx="0.5" cy="0.32" r="0.75">
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tile */}
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="url(#badge-grad)" />
      {/* Ambient glow from the crest */}
      <rect x="4" y="2" width="16" height="10" rx="4" fill="url(#badge-glow)" />
      {/* Edge bevel + hairline */}
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" />
      <rect x="1.25" y="1.25" width="21.5" height="21.5" rx="5.25" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
      {/* Top sheen */}
      <rect x="1.5" y="1.5" width="21" height="9" rx="4.5" fill="url(#badge-sheen)" />

      {/* Glyph — roofline overlooking a tower with a lit window */}
      <path d="M5.5 11.2L9.4 8l3.9 3.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.3 8l2.6-2.1 2.6 2.1M15.9 5.9v2.4" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
      <rect x="12.6" y="10.8" width="7" height="7.6" rx="1.6" fill="white" opacity="0.92" />
      <rect x="14.3" y="13.1" width="2.2" height="4.1" rx="0.9" fill="#047857" opacity="0.85" />
      <rect x="4.6" y="13.6" width="6" height="5" rx="1.2" stroke="white" strokeWidth="1.1" opacity="0.85" />
      <path d="M6 15.4h3.2M6 17.3h2" stroke="white" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function BrandBadge({ size = "md", showTag, onDark }: BrandBadgeProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center whitespace-nowrap ${s.gap}`}>
      <BadgeMark
        size={s.logoSize}
        className={onDark ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" : ""}
      />
      <span className={`${onDark ? ON_DARK_WORDMARK : LIGHT_WORDMARK} ${s.textSize}`}>
        RentManager
      </span>
      {showTag && (
        <span className="ml-1 text-[10px] font-medium text-brand bg-brand-50 dark:bg-brand-900/30 dark:text-brand-300 px-1.5 py-0.5 rounded-md border border-brand-200 dark:border-brand-700">
          BETA
        </span>
      )}
    </span>
  );
}