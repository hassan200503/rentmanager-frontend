import type { LucideIcon } from "lucide-react";
import {
    Smartphone,
    MessageSquare,
    MessageCircle,
    Mail,
    Cloud,
    Fingerprint,
    Plug,
} from "lucide-react";

export const CATEGORY_META: Record<
    string,
    { label: string; icon: LucideIcon; tone: string }
> = {
    payments: {
        label: "Payments",
        icon: Smartphone,
        tone: "from-emerald-500 to-teal-600",
    },
    sms: {
        label: "SMS",
        icon: MessageSquare,
        tone: "from-sky-500 to-blue-600",
    },
    whatsapp: {
        label: "WhatsApp",
        icon: MessageCircle,
        tone: "from-green-500 to-emerald-600",
    },
    email: {
        label: "Email",
        icon: Mail,
        tone: "from-amber-500 to-orange-600",
    },
    storage: {
        label: "Media storage",
        icon: Cloud,
        tone: "from-violet-500 to-purple-600",
    },
    auth: {
        label: "Authentication",
        icon: Fingerprint,
        tone: "from-rose-500 to-pink-600",
    },
};

export const categoryMeta = (category: string) =>
    CATEGORY_META[category] ?? {
        label: category,
        icon: Plug,
        tone: "from-slate-500 to-slate-600",
    };

export const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-KE", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatRelative = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "—";
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDateTime(iso);
};

export const shortActor = (actor: string | null | undefined) => {
    if (!actor) return "system";
    return actor.length > 14 ? `${actor.slice(0, 8)}…${actor.slice(-4)}` : actor;
};
