import { BadgeCheck } from "lucide-react";

interface LandlordStatusBadgeProps {
    size?: "sm" | "md";
}

const sizeMap = {
    sm: { icon: "w-3.5 h-3.5", text: "text-[11px]", gap: "gap-1.5", px: "px-2.5 py-1" },
    md: { icon: "w-4 h-4", text: "text-xs", gap: "gap-2", px: "px-3 py-1.5" },
};

/**
 * Shown when `unit.landlordVerified` is true.
 *
 * <h2>What that flag actually means</h2>
 * The backend derives it from `tenants.status == ACTIVE` — the landlord's
 * RentManager account is live and in good standing, not suspended. It is a real
 * signal and worth showing.
 *
 * It is **not** identity verification, which is why this badge no longer says
 * "Verified Landlord". Nobody checks a landlord's ID, title deed or company
 * registration, and a gold badge reading "Verified" told a renter otherwise —
 * on the one page where they are deciding whether to send a stranger money.
 * The flag itself was already corrected once (V87 dropped `tenants.verified`,
 * a column backfilled to true for every row and never written again, which had
 * this badge lit for everybody); the wording is the other half of that fix.
 */
export function LandlordStatusBadge({ size = "sm" }: LandlordStatusBadgeProps) {
    const s = sizeMap[size];

    return (
        <span
            className={`inline-flex items-center ${s.gap} ${s.px} ${s.text} font-bold rounded-xl bg-gradient-to-r from-amber-500/20 to-brass/20 text-amber-200 ring-2 ring-amber-400/30 shadow-[0_2px_8px_rgba(217,119,6,0.3)] backdrop-blur-md hover:ring-amber-400/50 hover:shadow-[0_4px_12px_rgba(217,119,6,0.4)] transition-all duration-300`}
            title="This landlord's RentManager account is active. RentManager does not verify a landlord's identity."
        >
            <BadgeCheck className={`${s.icon} text-amber-300`} strokeWidth={2.5} fill="rgba(251,191,36,0.2)" />
            <span className="bg-gradient-to-r from-amber-200 to-amber-100 bg-clip-text text-transparent">Active landlord</span>
        </span>
    );
}
