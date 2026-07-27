"use client";

import {
    Landmark,
    ChevronRight,
} from "lucide-react";

export interface PipelineStage {
    icon: typeof Landmark;
    label: string;
    value: string;
    sublabel: string;
    iconBg: string;
    iconColor: string;
    dotColor: string;
    accentBorder: string;
}

interface MoneyFlowPipelineProps {
    stages: PipelineStage[];
    isLoading: boolean;
}

export function MoneyFlowPipeline({ stages, isLoading }: MoneyFlowPipelineProps) {
    if (isLoading) {
        return (
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    <div className="skeleton h-4 w-32" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton h-28 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    Money Flow Pipeline
                </span>
                <span className="text-ink-muted/30">·</span>
                <span className="text-xs text-ink-muted/60">Live</span>
            </div>

            <div className="relative">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {stages.map((stage, index) => (
                        <div
                            key={stage.label}
                            className="animate-fade-in-up relative"
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            <div className={`relative bg-surface rounded-2xl border ${stage.accentBorder} shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full`}>
                                {index < stages.length - 1 && (
                                    <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                                        <div className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm">
                                            <ChevronRight className="w-3 h-3 text-ink-muted" strokeWidth={2} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-xl ${stage.iconBg} flex items-center justify-center shadow-sm`}>
                                        <stage.icon className={`w-4 h-4 ${stage.iconColor}`} strokeWidth={1.5} />
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${stage.dotColor} shadow-sm shrink-0 mt-1`} />
                                </div>

                                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                                    {stage.label}
                                </p>
                                <p className="font-data text-xl font-bold text-ink leading-tight">
                                    {stage.value}
                                </p>
                                <p className="text-[11px] text-ink-muted/70 mt-1">
                                    {stage.sublabel}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
