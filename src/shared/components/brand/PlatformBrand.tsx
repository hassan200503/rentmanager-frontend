"use client";

import { useState } from "react";
import { usePlatformBrandingQuery } from "@/features/admin/hooks/use-platform-branding";
import { BadgeMark, BrandBadge, ON_DARK_WORDMARK } from "./BrandBadge";

interface PlatformBrandProps {
  size?: "sm" | "md" | "lg";
  showTag?: boolean;
  withName?: boolean;
  /** Always-light premium wordmark for dark surfaces (landing page). */
  onDark?: boolean;
}

const sizes = {
  sm: { logo: 16, textSize: "text-xs", gap: "gap-2" },
  md: { logo: 20, textSize: "text-sm", gap: "gap-2.5" },
  lg: { logo: 26, textSize: "text-base", gap: "gap-3" },
};

/**
 * Brand chrome for every platform surface. Renders the owner-configured
 * system logo (from the public branding endpoint) when one is set, and
 * degrades to the built-in RentManager mark whenever the backend is
 * unreachable or brand assets are unconfigured.
 *
 * The whole platform shares one react-query key, so uploading a new logo
 * from the admin console re-renders every sidebar/navbar in the product
 * on the next invalidation — no per-surface state, no event bus.
 */
export function PlatformBrand({ size = "md", showTag, withName = true, onDark }: PlatformBrandProps) {
  const { data } = usePlatformBrandingQuery();
  const [broken, setBroken] = useState(false);
  const s = sizes[size];

  const logoUrl = data?.logoUrl || null;
  const platformName = data?.platformName || "RentManager";

  if (logoUrl && !broken) {
    return (
      <span className={`inline-flex items-center whitespace-nowrap ${s.gap}`}>
        <img
          src={logoUrl}
          alt={`${platformName} logo`}
          width={s.logo}
          height={s.logo}
          className="shrink-0 object-contain"
          onError={() => setBroken(true)}
        />
        {withName && (
          <span
            className={`${onDark ? ON_DARK_WORDMARK : "font-display font-semibold tracking-[-0.02em] text-fg dark:text-fg-dark"} ${s.textSize}`}
          >
            {platformName}
          </span>
        )}
      </span>
    );
  }

  return <BrandBadge size={size} showTag={showTag} onDark={onDark} />;
}

interface PlatformLogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Square-only logo mark for tiles (sidebar brand chips, topbar tiles).
 * `object-contain` keeps any aspect ratio inside the tile without cropping.
 */
export function PlatformLogoMark({ size = 20, className = "" }: PlatformLogoMarkProps) {
  const { data } = usePlatformBrandingQuery();
  const [broken, setBroken] = useState(false);

  const logoUrl = data?.logoUrl || null;

  if (logoUrl && !broken) {
    return (
      <img
        src={logoUrl}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        onError={() => setBroken(true)}
      />
    );
  }

  return <BadgeMark size={size} />;
}

export default PlatformBrand;