"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Building2,
  Receipt,
  ClipboardList,
  Users,
  Settings,
  Smartphone,
  ArrowLeftRight,
  Plus,
  Home,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string;
  section: string;
}

const commands: CommandItem[] = [
  { id: "properties", label: "Properties", icon: Building2, href: "/dashboard/properties", section: "Navigation" },
  { id: "payments", label: "Payments", icon: Receipt, href: "/dashboard/payments", section: "Navigation" },
  { id: "rent-ledger", label: "Rent Ledger", icon: ClipboardList, href: "/dashboard/rent-ledger", section: "Navigation" },
  { id: "tenants", label: "Tenants", icon: Users, href: "/dashboard/leases", section: "Navigation" },
  { id: "mpesa", label: "M-Pesa Config", icon: Smartphone, href: "/daraja/config", section: "Navigation" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", section: "Navigation" },
  { id: "archive", label: "Archive", icon: Home, href: "/dashboard/archive", section: "Navigation" },
  { id: "create-property", label: "Create Property", icon: Plus, href: "/dashboard/properties/create", section: "Actions" },
  { id: "create-lease", label: "Create Lease", icon: Plus, href: "/dashboard/leases/create", section: "Actions" },
  { id: "team", label: "Team Management", icon: ArrowLeftRight, href: "/dashboard/team", section: "Navigation" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Clamp selectedIndex when filtered results change
  const effectiveIndex = Math.min(selectedIndex, Math.max(flatFiltered.length - 1, 0));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[effectiveIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
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
    <>
      {/* Trigger button hint is in Topbar — this is the invisible keyboard listener + overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setOpen(false); setQuery(""); }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative w-full max-w-lg bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl shadow-[0_16px_70px_-10px_rgba(0,0,0,0.25)] overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-border-dark">
                <Search className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark shrink-0" strokeWidth={2} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search navigation, actions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-border-subtle dark:bg-border-subtle-dark text-[10px] font-medium text-fg-subtle dark:text-fg-subtle-dark">
                  ESC
                </kbd>
              </div>

              {/* Results */}
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
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-brand-50 dark:bg-brand-900/20 text-brand-800 dark:text-brand-300"
                              : "text-fg dark:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
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

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-border dark:border-border-dark text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-border-subtle dark:bg-border-subtle-dark font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-border-subtle dark:bg-border-subtle-dark font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-border-subtle dark:bg-border-subtle-dark font-mono">esc</kbd>
                  Close
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
