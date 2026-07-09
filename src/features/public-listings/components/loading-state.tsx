"use client";

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
    return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ink-muted">{message}</p>
        </div>
    );
}