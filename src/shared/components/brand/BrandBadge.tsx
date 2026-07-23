import { AppLogo } from "./AppLogo";

interface BrandBadgeProps {
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
}

const sizes = {
  sm: { logoSize: 16, textSize: "text-xs", gap: "gap-1.5" },
  md: { logoSize: 22, textSize: "text-sm", gap: "gap-2" },
  lg: { logoSize: 28, textSize: "text-base", gap: "gap-2.5" },
};

export function BrandBadge({ size = "md", showTag }: BrandBadgeProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <span className="text-emerald-600 shrink-0">
        <AppLogo size={s.logoSize} />
      </span>
      <span className={`font-display font-semibold tracking-tight text-fg dark:text-fg-dark ${s.textSize}`}>
        RentManager
      </span>
      {showTag && (
        <span className="ml-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
          BETA
        </span>
      )}
    </span>
  );
}
