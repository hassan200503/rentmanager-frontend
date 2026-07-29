"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, DoorOpen, Wallet, Activity, FileText } from "lucide-react";

import { usePublicUnit } from "@/features/public-listings/hooks/use-public-unit";

import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

// Cosmetic only -- turns "VACANT" into "Vacant" for display.
const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export default function PublicUnitPage() {
    const { unitId } =
        useParams<{ unitId: string }>();

    const {
        data: unit,
        isLoading,
        error,
    } = usePublicUnit(unitId);

    if (isLoading) {
        return (
            <LoadingState message="Loading unit…" />
        );
    }

    if (error || !unit) {
        return (
            <EmptyState
                title="Unit not found"
                description="The requested unit does not exist."
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
            <Link
                href={`/properties/${unit.propertyId}`}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to property
            </Link>

            <div className="card animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                        <DoorOpen className="h-5 w-5 text-brand-700 dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Unit</p>
                        <h1 className="page-title mb-0">{unit.unitNumber}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="card-sm">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Wallet className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Rent</p>
                        </div>
                        <p className="font-data text-xl font-semibold text-ink">
                            {unit.rentAmount != null
                                ? new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(unit.rentAmount)
                                : "—"}
                        </p>
                    </div>

                    <div className="card-sm">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Activity className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Status</p>
                        </div>
                        <span className="pill-neutral">{formatEnumLabel(unit.occupancyStatus)}</span>
                    </div>
                </div>

                {unit.description && (
                    <div className="mt-6 pt-6 border-t border-ink/10">
                        <h2 className="section-header inline-flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                            Description
                        </h2>
                        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{unit.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}