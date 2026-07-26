import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
    size?: "sm" | "md";
}

const sizeMap = {
    sm: { icon: "w-3 h-3", text: "text-[11px]", gap: "gap-1" },
    md: { icon: "w-3.5 h-3.5", text: "text-xs", gap: "gap-1.5" },
};

export function VerifiedBadge({ size = "sm" }: VerifiedBadgeProps) {
    const s = sizeMap[size];

    return (
        <span
            className={`inline-flex items-center ${s.gap} rounded-full bg-brass-light/70 px-2.5 py-0.5 ${s.text} font-medium text-brass-dark`}
        >
            <BadgeCheck className={`${s.icon} text-brass`} strokeWidth={2} />
            Verified Landlord
        </span>
    );
}
