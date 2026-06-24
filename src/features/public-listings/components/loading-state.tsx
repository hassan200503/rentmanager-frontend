"use client";

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({
                                 message = "Loading...",
                             }: LoadingStateProps) {
    return (
        <div className="py-12 text-center">
            {message}
        </div>
    );
}