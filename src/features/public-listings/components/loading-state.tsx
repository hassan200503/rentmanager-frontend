interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

export function LoadingState({ message = "Loading…", fullScreen = true }: LoadingStateProps) {
    return (
        <div
            className={
                fullScreen
                    ? "min-h-screen bg-canvas flex flex-col items-center justify-center gap-5"
                    : "py-20 flex flex-col items-center justify-center gap-5"
            }
        >
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-[3px] border-brand/20 rounded-full" />
                <div className="absolute inset-0 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-ink-muted font-medium">{message}</p>
        </div>
    );
}
