import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const MPESA_GREEN = "#43B02A";

/**
 * M-Pesa brand mark — green tile with the white wordmark, matching the
 * Safaricom Daraja brand used across payment surfaces.
 */
export function MPesaIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role="img" aria-label="M-Pesa" {...props}>
      <rect width="48" height="48" rx="11" fill={MPESA_GREEN} />
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="13"
        letterSpacing="-0.175"
        textLength="42"
        lengthAdjust="spacingAndGlyphs"
        fill="#FFFFFF"
      >
        M-Pesa
      </text>
    </svg>
  );
}