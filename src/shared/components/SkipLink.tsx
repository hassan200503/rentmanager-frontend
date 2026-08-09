export function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-emerald-600 focus:text-white focus:text-sm focus:font-semibold"
        >
            Skip to main content
        </a>
    );
}