"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    LayoutDashboard,
    Building2,
    Users,
    Home,
    Star,
    Send,
    Wallet,
    Settings,
} from "lucide-react";

interface CommandItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    href: string;
    section: string;
}

const commands: CommandItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin", section: "Console" },
    { id: "landlords", label: "Landlords", icon: Building2, href: "/admin/landlords", section: "Management" },
    { id: "renters", label: "Renters", icon: Users, href: "/admin/renters", section: "Management" },
    { id: "properties", label: "Properties", icon: Home, href: "/admin/properties", section: "Management" },
    { id: "reviews", label: "Reviews", icon: Star, href: "/admin/reviews", section: "Management" },
    { id: "disbursements", label: "Disbursements", icon: Send, href: "/admin/disbursements", section: "Management" },
    { id: "commission", label: "Commission policy", icon: Wallet, href: "/admin/commission", section: "Management" },
    { id: "settings", label: "Platform settings", icon: Settings, href: "/admin/settings", section: "Management" },
];

/**
 * ⌘K command palette for the platform admin console. Self-contained —
 * triggers open/close through the Topbar search button and a global
 * keyboard listener, so it needs no shell wiring.
 */
export default function AdminCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const close = useCallback(() => {
        onOpenChange(false);
        setQuery("");
        setSelectedIndex(0);
    }, [onOpenChange]);

    const filtered = commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
        if (!acc[cmd.section]) acc[cmd.section] = [];
        acc[cmd.section].push(cmd);
        return acc;
    }, {});

    const flatFiltered = useMemo(() => Object.values(grouped).flat(), [grouped]);

    const handleSelect = useCallback(
        (href: string) => {
            close();
            router.push(href);
        },
        [close, router]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpenChange(!open);
            }
            if (e.key === "Escape" && open) {
                e.preventDefault();
                close();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onOpenChange, close]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            setQuery("");
            setSelectedIndex(0);
            inputRef.current?.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [open]);

    const effectiveIndex = Math.min(selectedIndex, Math.max(flatFiltered.length - 1, 0));

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const item = list.children[effectiveIndex] as HTMLElement | undefined;
        if (item) item.scrollIntoView({ block: "nearest" });
    }, [effectiveIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && flatFiltered[effectiveIndex]) {
            handleSelect(flatFiltered[effectiveIndex].href);
        }
    };

    let runningIndex = -1;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                        className="relative w-full max-w-lg border border-border dark:border-border-dark rounded-2xl bg-surface dark:bg-surface-dark shadow-[0_16px_70px_-10px_rgba(0,0,0,0.25)] overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Console command search"
                    >
                        <div className="flex items-center gap-3 border-b border-border dark:border-border-dark px-4 py-3">
                            <Search className="h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search console pages, actions…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark outline-none"
                            />
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-medium text-fg-subtle dark:bg-border-subtle-dark dark:text-fg-subtle-dark">
                                ESC
                            </kbd>
                        </div>

                        <div ref={listRef} className="max-h-80 overflow-y-auto py-2 custom-scrollbar">
                            {flatFiltered.length === 0 && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No results found</p>
                                </div>
                            )}
                            {Object.entries(grouped).map(([section, items]) => (
                                <div key={section}>
                                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                                        {section}
                                    </p>
                                    {items.map((cmd) => {
                                        runningIndex++;
                                        const idx = runningIndex;
                                        const isActive = idx === effectiveIndex;
                                        const Icon = cmd.icon;
                                        return (
                                            <button
                                                key={cmd.id}
                                                type="button"
                                                onClick={() => handleSelect(cmd.href)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                                    isActive
                                                        ? "bg-brand-50 text-brand-800 dark:bg-brand-900/20 dark:text-brand-300"
                                                        : "text-fg hover:bg-border-subtle dark:text-fg-dark dark:hover:bg-border-subtle-dark"
                                                }`}
                                            >
                                                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                                                <span className="font-medium">{cmd.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 border-t border-border dark:border-border-dark px-4 py-2 text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-border-subtle px-1 py-0.5 font-mono dark:bg-border-subtle-dark">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-border-subtle px-1 py-0.5 font-mono dark:bg-border-subtle-dark">↵</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-border-subtle px-1 py-0.5 font-mono dark:bg-border-subtle-dark">esc</kbd>
                                Close
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}