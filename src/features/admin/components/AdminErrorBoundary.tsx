"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class AdminErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Admin error boundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-6">
                    <div className="max-w-md w-full text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30">
                            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" strokeWidth={2} />
                        </div>
                        <h1 className="text-xl font-bold text-fg dark:text-fg-dark mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6">
                            An error occurred in the admin console. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="text-left mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                                <summary className="text-xs font-medium text-red-700 dark:text-red-400 cursor-pointer mb-2">
                                    Error details
                                </summary>
                                <pre className="text-[10px] text-red-600 dark:text-red-300 overflow-auto max-h-40">
                                    {this.state.error.message}
                                    {"\n\n"}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-4 py-2 rounded-lg border border-border dark:border-border-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark text-sm font-medium transition-colors"
                            >
                                Try again
                            </button>
                            <button
                                onClick={() => window.location.href = "/admin"}
                                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                            >
                                Return to overview
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
