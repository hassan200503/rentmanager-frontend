import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
    size?: "sm" | "md";
}

const sizeMap = {
    sm: { icon: "w-3 h-3", text: "text-[11px]", gap: "gap-1", px: "px-2 py-[2px]" },
    md: { icon: "w-3.5 h-3.5", text: "text-xs", gap: "gap-1.5", px: "px-2.5 py-0.5" },
};

export function VerifiedBadge({ size = "sm" }: VerifiedBadgeProps) {
    const s = sizeMap[size];

    return (
        <span
            className={`inline-flex items-center ${s.gap} ${s.px} ${s.text} font-semibold rounded-full bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25 shadow-[0_1px_2px_rgba(0,0,0,0.4)]`}
        >
            <BadgeCheck className={`${s.icon} text-amber-400`} strokeWidth={2} />
            Verified Landlord
        </span>
    );
}
