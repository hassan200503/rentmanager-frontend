"use client";

interface LoadingStateProps {
    message?: string;
    // NEW: defaults to true so existing full-page callers (e.g. the top-level
    // "Loading property…" state) render exactly as before. Pass false when
    // this is nested inside a page section, otherwise min-h-screen blows out
    // the layout around it.
    fullScreen?: boolean;
}

export function LoadingState({ message = "Loading…", fullScreen = true }: LoadingStateProps) {
    return (
        <div
            className={
                fullScreen
                    ? "min-h-screen bg-canvas flex flex-col items-center justify-center gap-4"
                    : "py-20 flex flex-col items-center justify-center gap-4"
            }
        >
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ink-muted">{message}</p>
        </div>
    );
}