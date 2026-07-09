// app/listings/[propertyId]/[unitId]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Home, ShieldCheck } from "lucide-react";
import { usePublicUnitQuery } from "@/features/public-listings/queries/use-public-unit-query";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

const occupancyBadge = (occupancyStatus: string): { label: string; className: string } => {
    switch (occupancyStatus) {
        case "VACANT":
            return { label: "Vacant", className: "pill-success" };
        default:
            return { label: occupancyStatus, className: "pill-neutral" };
    }
};

export default function UnitDetailPage() {
    const params = useParams<{ propertyId: string; unitId: string }>();

    const { data: unit, isLoading: unitLoading, isError: unitError } =
        usePublicUnitQuery(params.unitId);

    const { data: property, isLoading: propertyLoading } =
        usePublicPropertyQuery(params.propertyId);

    if (unitLoading || propertyLoading) {
        return <LoadingState />;
    }

    if (unitError || !unit) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <EmptyState
                    title="Unit not found"
                    description="This unit may no longer be available."
                />
            </div>
        );
    }

    const handleReserve = () => {
        alert("Reservation flow coming soon.");
    };

    const badge = occupancyBadge(unit.occupancyStatus);
    const [heroImage, ...restImages] = unit.images ?? [];

    return (
        <div className="min-h-screen bg-canvas pb-24 lg:pb-0">

            {/* Header */}
            <div className="bg-white border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-8 max-w-5xl">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-5">
                        <Link href="/listings" className="hover:text-ink transition-colors">
                            Listings
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link
                            href={`/listings/${params.propertyId}`}
                            className="hover:text-ink transition-colors"
                        >
                            {property?.name ?? "Property"}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-ink font-medium">Unit {unit.unitNumber}</span>
                    </nav>

                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-semibold text-ink">
                            Unit {unit.unitNumber}
                        </h1>
                        <span className={badge.className}>{badge.label}</span>
                    </div>
                </div>
            </div>

            {/* Two-column: content left, sticky reserve panel right — CTA stays
                on-screen instead of scrolling away under a long description. */}
            <div className="container mx-auto px-6 py-10 max-w-5xl grid lg:grid-cols-[1fr_360px] gap-10 items-start">

                <div className="space-y-8">
                    {heroImage ? (
                        <section>
                            <div className="grid gap-3 grid-cols-3 grid-rows-2 h-[340px]">
                                <img
                                    src={heroImage}
                                    alt={`Unit ${unit.unitNumber} main photo`}
                                    className="col-span-3 row-span-2 md:col-span-2 md:row-span-2 w-full h-full object-cover rounded-2xl shadow-sm"
                                />
                                {restImages.slice(0, 2).map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Unit ${unit.unitNumber} photo ${index + 2}`}
                                        className="hidden md:block w-full h-full object-cover rounded-2xl shadow-sm"
                                    />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="w-full h-56 bg-ink/[0.04] rounded-2xl flex flex-col items-center justify-center text-ink-muted gap-2">
                            <Home className="w-8 h-8" />
                            <span className="text-xs">No images available</span>
                        </div>
                    )}

                    {unit.description && (
                        <section className="card p-6">
                            <h2 className="text-lg font-semibold text-ink mb-3">
                                About this unit
                            </h2>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                {unit.description}
                            </p>
                        </section>
                    )}
                </div>

                {/* Sticky reserve panel — desktop only */}
                <aside className="hidden lg:block sticky top-8">
                    <div className="card p-6 space-y-4">
                        <p className="font-data text-3xl font-semibold text-ink">
                            KES {unit.rentAmount.toLocaleString()}
                            <span className="font-sans text-base font-normal text-ink-muted"> / month</span>
                        </p>

                        <Link
                            href={`/reserve/${unit.id}`}
                            className="btn-primary block w-full text-center py-3"
                        >
                            Reserve this unit
                        </Link>

                        <div className="flex items-start gap-2 pt-2 border-t border-ink/[0.08]">
                            <ShieldCheck className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-ink-muted leading-relaxed">
                                Refundable deposit, paid securely via M-Pesa. Held until your
                                move-in is confirmed.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile sticky action bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-ink/[0.08] px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_16px_rgba(20,33,61,0.08)]">
                <div>
                    <p className="font-data text-lg font-semibold text-ink leading-none">
                        KES {unit.rentAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">/ month</p>
                </div>
                <Link
                    href={`/reserve/${unit.id}`}
                    className="btn-primary px-6 py-3"
                >
                    Reserve
                </Link>
            </div>
        </div>
    );
}