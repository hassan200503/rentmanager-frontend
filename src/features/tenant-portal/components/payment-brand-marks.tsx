// components/payment-brand-marks.tsx
//
// Payment-rail brand marks for the renter payment selector.
//
// TRADEMARK NOTE — read before changing these.
// "M-PESA" is a Safaricom/Vodafone trademark. What is rendered here uses the
// official M-PESA SVG wordmark sourced from Wikimedia Commons (public domain
// — does not meet copyright threshold). Displaying a payment rail's name and
// logo at checkout is ordinary nominative use.
//
// FOR PRODUCTION: confirm path data against Safaricom's brand asset pack.
// Every call site goes through this module so that swap is a one-file change.
import { Building2, CreditCard } from "lucide-react";
import { MPesaIcon } from "@/shared/components/icons";

type MarkProps = { className?: string };

/**
 * Compact M-PESA typographic badge — for inline/history contexts where a
 * small pill is needed (transaction source chip, "Make a Payment" header).
 */
export const MpesaMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="M-PESA"
        className={`relative inline-flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{
            borderRadius: 6,
            paddingInline: "6px",
            paddingBlock: "3px",
            background: "linear-gradient(145deg, #4ac65a 0%, #39b54a 50%, #2a9438 100%)",
            boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.22)",
        }}
    >
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
                borderRadius: "inherit",
                background: "linear-gradient(118deg, rgba(255,255,255,0.22) 0%, transparent 40%)",
            }}
        />
        <span className="relative font-black text-white" style={{ fontSize: "0.6rem", letterSpacing: "0.04em", lineHeight: 1 }}>
            M-PESA
        </span>
    </span>
);

/**
 * Full M-PESA SVG wordmark for the payment method selector tile.
 * Renders the official logo at its natural landscape aspect ratio on a
 * transparent background — the tile card supplies its own white/light bg.
 */
export const MpesaLogoTile = () => (
    <MPesaIcon
        style={{ width: 108, height: 58 }}
        aria-label="M-PESA"
    />
);

/** Generic bank-transfer mark. Neutral — no single bank implied. */
export const BankMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="Bank transfer"
        className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink/[0.06] text-ink-muted dark:bg-white/[0.08] dark:text-ink-muted-dark ${className}`}
    >
        <Building2 className="h-[15px] w-[15px]" strokeWidth={2} />
    </span>
);

/** Generic card mark — not any scheme's logo, since none is live. */
export const CardMark = ({ className = "" }: MarkProps) => (
    <span
        role="img"
        aria-label="Card"
        className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink/[0.06] text-ink-muted dark:bg-white/[0.08] dark:text-ink-muted-dark ${className}`}
    >
        <CreditCard className="h-[15px] w-[15px]" strokeWidth={2} />
    </span>
);
