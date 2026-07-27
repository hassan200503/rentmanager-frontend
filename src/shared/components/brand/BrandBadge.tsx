
interface BrandBadgeProps {
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
}

const sizes = {
  sm: { logoSize: 16, textSize: "text-xs", gap: "gap-2" },
  md: { logoSize: 20, textSize: "text-sm", gap: "gap-2.5" },
  lg: { logoSize: 24, textSize: "text-base", gap: "gap-3" },
};

function BadgeMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="badge-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="url(#badge-grad)" />
      <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" stroke="rgba(255,255,255,0.15)" />
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <path d="M5 11h6.5M11.5 5v6" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1.5" fill="white" opacity="0.25" />
      <path d="M13.5 14h3.5M13.5 16.5h2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function BrandBadge({ size = "md", showTag }: BrandBadgeProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <BadgeMark size={s.logoSize} />
      <span className={`font-display font-semibold tracking-tight text-fg dark:text-fg-dark ${s.textSize}`}>
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