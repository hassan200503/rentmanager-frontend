"use client";

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">{message}</p>
        </div>
    );
}