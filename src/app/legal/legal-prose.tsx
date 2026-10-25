import { ReactNode } from "react";

/**
 * Typography for the policy pages.
 *
 * Small local components rather than a prose plugin, so the pages stay
 * readable at phone width and carry no dependency for two documents.
 */

export function LegalTitle({ children, updated }: { children: ReactNode; updated: string }) {
    return (
        <>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">{children}</h1>
            <p className="mt-3 text-sm text-white/45">In effect from {updated}</p>
        </>
    );
}

export function LegalLead({ children }: { children: ReactNode }) {
    return <p className="mt-8 text-base leading-relaxed text-white/75">{children}</p>;
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
    return (
        <section className="mt-12">
            <h2 className="text-lg font-semibold text-white">{heading}</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/70">{children}</div>
        </section>
    );
}

export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="space-y-2.5 pl-1">
            {items.map((item, index) => (
                <li key={index} className="flex gap-3">
                    <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-jade-400/70"
                        aria-hidden="true"
                    />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}
