"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { ChevronDown, Search, Check, X, Loader2 } from "lucide-react";

export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    loading?: boolean;
    disabled?: boolean;
    error?: string;
    clearable?: boolean;
    required?: boolean;
}

export function Combobox({
    options,
    value,
    onChange,
    label,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyMessage = "No results found",
    loading = false,
    disabled = false,
    error,
    clearable = false,
    required = false,
}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const reactId = useId();

    const selected = useMemo(
        () => options.find((o) => o.value === value) ?? null,
        [options, value],
    );

    const filtered = useMemo(() => {
        if (!query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q),
        );
    }, [options, query]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                close();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        if (!open || !listRef.current) return;
        const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (disabled) return;
        if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
            return;
        }
        if (!open) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
                break;
            case "Enter":
                e.preventDefault();
                if (filtered[activeIndex]) select(filtered[activeIndex].value);
                break;
            case "Escape":
                e.preventDefault();
                close();
                break;
        }
    }

    function close() {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
    }

    function select(val: string) {
        onChange(val);
        close();
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange("");
    }

    const triggerId = `${reactId}-trigger`;
    const listId = `${reactId}-list`;

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="form-label flex items-center gap-1">
                    {label}
                    {required && <span className="text-danger">*</span>}
                </label>
            )}

            <button
                type="button"
                id={triggerId}
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                className={`form-input flex items-center justify-between gap-2 text-left w-full ${
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                } ${error ? "!border-danger focus:!border-danger" : ""} ${
                    !selected ? "text-fg-subtle dark:text-fg-subtle-dark" : ""
                }`}
            >
                <span className="flex items-center gap-2 min-w-0 truncate">
                    {selected ? (
                        <>
                            <span className="truncate font-medium text-fg dark:text-fg-dark">{selected.label}</span>
                            {selected.description && (
                                <span className="truncate text-xs text-fg-muted dark:text-fg-muted-dark">{selected.description}</span>
                            )}
                        </>
                    ) : (
                        placeholder
                    )}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {clearable && !required && selected && !disabled && (
                        <X className="h-3.5 w-3.5 text-fg-subtle hover:text-fg dark:text-fg-subtle-dark dark:hover:text-fg-dark transition-colors" strokeWidth={2} onClick={clear} />
                    )}
                    {loading ? (
                        <Loader2 className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark animate-spin" strokeWidth={2} />
                    ) : (
                        <ChevronDown className={`h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-150 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
                    )}
                </span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-dropdown overflow-hidden animate-fade-in-up" style={{ animationDuration: "120ms" }}>
                    <div className="relative border-b border-border-subtle dark:border-border-subtle-dark">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark pointer-events-none" strokeWidth={2} />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                            placeholder={searchPlaceholder}
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none"
                        />
                    </div>
                    <div ref={listRef} id={listId} role="listbox" aria-labelledby={triggerId} className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">{loading ? "Loading…" : emptyMessage}</p>
                            </div>
                        ) : (
                            filtered.map((option, i) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        data-index={i}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => select(option.value)}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors ${i === activeIndex ? "bg-brand-50 dark:bg-brand-900/30" : ""} ${isSelected ? "text-brand-800 dark:text-brand-300 font-medium" : "text-fg dark:text-fg-dark"}`}
                                    >
                                        <span className="flex-1 min-w-0">
                                            <span className="block truncate">{option.label}</span>
                                            {option.description && <span className="block truncate text-xs text-fg-muted dark:text-fg-muted-dark">{option.description}</span>}
                                        </span>
                                        {isSelected && <Check className="h-4 w-4 text-brand shrink-0" strokeWidth={2.5} />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}