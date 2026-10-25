"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, AlertTriangle, DoorOpen } from "lucide-react";
import { useUnit } from "@/features/unit/hooks/use-unit";
import { UnitDetails } from "@/features/unit/components/unit-details";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import Loading from "@/app/loading";

export default function UnitDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.propertyId as string;
    const unitId = params.unitId as string;

    const { data: unit, isLoading, error } = useUnit(unitId);

    useEffect(() => {
        if (!isLoading && !error && !unit) {
            router.replace(`/dashboard/properties/${propertyId}/units`);
        }
    }, [isLoading, error, unit, router, propertyId]);

    if (isLoading) return <Loading />;

    if (error) {
        return (
            <div className="page-container">
                <button
                    onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    Back to property
                </button>
                <div className="max-w-md mx-auto bg-surface rounded-2xl border border-danger/20 shadow-sm p-10 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
                        <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-semibold text-ink mb-1">Couldn&#39;t load this unit</p>
                    <p className="text-sm text-ink-muted">
                        {getProcessErrorMessage(error, "It could not be loaded right now. Please try again.")}
                    </p>
                </div>
            </div>
        );
    }

    if (!unit) return null;

    return (
        <div className="page-container max-w-3xl space-y-8">
            <button
                onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors group"
            >
                <div className="w-6 h-6 rounded-lg bg-ink/[0.05] flex items-center justify-center group-hover:bg-ink/[0.08] transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                Back to property
            </button>

            <div className="flex items-start gap-4 animate-fade-in-up">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 shadow-sm">
                    <DoorOpen className="h-6 w-6 text-brand-600" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Units</p>
                    <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight font-display leading-tight">
                        Unit details
                    </h1>
                    <p className="text-sm text-ink-muted">
                        Manage unit information, media, and availability
                    </p>
                </div>
            </div>

            <div className="animate-fade-in-up">
                <UnitDetails unit={unit} />
            </div>
        </div>
    );
}
