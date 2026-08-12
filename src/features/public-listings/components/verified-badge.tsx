import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
    size?: "sm" | "md";
}

const sizeMap = {
    sm: { icon: "w-3.5 h-3.5", text: "text-[11px]", gap: "gap-1.5", px: "px-2.5 py-1" },
    md: { icon: "w-4 h-4", text: "text-xs", gap: "gap-2", px: "px-3 py-1.5" },
};

export function VerifiedBadge({ size = "sm" }: VerifiedBadgeProps) {
    const s = sizeMap[size];

    return (
        <span
            className={`inline-flex items-center ${s.gap} ${s.px} ${s.text} font-bold rounded-xl bg-gradient-to-r from-amber-500/20 to-brass/20 text-amber-200 ring-2 ring-amber-400/30 shadow-[0_2px_8px_rgba(217,119,6,0.3)] backdrop-blur-md hover:ring-amber-400/50 hover:shadow-[0_4px_12px_rgba(217,119,6,0.4)] transition-all duration-300`}
        >
            <BadgeCheck className={`${s.icon} text-amber-300`} strokeWidth={2.5} fill="rgba(251,191,36,0.2)" />
            <span className="bg-gradient-to-r from-amber-200 to-amber-100 bg-clip-text text-transparent">Verified Landlord</span>
        </span>
    );
}
