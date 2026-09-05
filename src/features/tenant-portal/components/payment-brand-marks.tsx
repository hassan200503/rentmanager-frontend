// components/payment-brand-marks.tsx
//
// Payment-rail brand marks for the renter payment selector.
//
// TRADEMARK NOTE — read before changing these.
// "M-PESA" is a Safaricom/Vodafone trademark. What is rendered here is a
// TYPOGRAPHIC wordmark in the brand colour, not a reproduction of the official
// pictorial logo, because fabricating an approximation of someone else's logo
// is worse than not showing one. Displaying the name of a payment rail you
// genuinely support at the point of payment is ordinary nominative use (the
// same reason a checkout may show "Visa"/"Mastercard").
//
// FOR PRODUCTION: replace MpesaMark's internals with the official M-PESA SVG
// from Safaricom's brand assets, and confirm MPESA_GREEN against their brand
// guide. Every call site goes through this module precisely so that swap is a
// one-file change. Until that is done, treat the colour below as approximate.
import { Building2, CreditCard } from "lucide-react";

/** Approximate M-PESA brand green — verify against the official brand guide. */
const MPESA_GREEN = "#4CAF50";
const MPESA_GREEN_DARK = "#2E7D32";

type MarkProps = { className?: string };

/**
 * M-PESA wordmark tile. Rendered as styled text rather than an <svg><text>
 * so it does not depend on a font being available inside the SVG sandbox.
 *
 * Deliberately does not attempt the official pictorial logo (the wordmark +
 * red swoosh mark) — that is Safaricom/Vodafone's registered trademark, and
 * fabricating an approximation of someone else's logo is worse than not
 * showing one. This is a genuinely bolder, more considered typographic
 * treatment than a flat rounded rectangle (a subtle two-tone panel with a
 * proper embossed edge and a small "trusted rail" checkmark, similar to how
 * a card network's own typographic fallback badge looks before a checkout
 * has the real scheme logo wired in) — but it is still text, not a redrawn
 * copy of the pictorial mark. See the module doc-comment above for the
 * production path: swap this for the genuine licensed SVG from Safaricom's
 * brand-assets portal once that access is confirmed.
 */
export const MpesaMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="M-PESA"
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-[6px] px-2.5 py-1 leading-none text-white select-none ${className}`}
        style={{
            background: `linear-gradient(155deg, ${MPESA_GREEN} 0%, ${MPESA_GREEN_DARK} 100%)`,
            boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.22)",
        }}
    >
        {/* Faint diagonal sheen — reads as a manufactured chip, not a flat swatch. */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
                background:
                    "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 35%, transparent 100%)",
            }}
        />
        <span
            className="relative font-extrabold"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.01em" }}
        >
            M-PESA
        </span>
    </span>
);

/** Generic bank-transfer mark. Neutral by design — no single bank is implied. */
export const BankMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="Bank transfer"
        className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink/[0.06] text-ink-muted dark:bg-white/[0.08] dark:text-ink-muted-dark ${className}`}
    >
        <Building2 className="h-[15px] w-[15px]" strokeWidth={2} />
    </span>
);

/** Generic card mark — deliberately not any scheme's logo, since none is live. */
export const CardMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="Card"
        className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink/[0.06] text-ink-muted dark:bg-white/[0.08] dark:text-ink-muted-dark ${className}`}
    >
        <CreditCard className="h-[15px] w-[15px]" strokeWidth={2} />
    </span>
);
