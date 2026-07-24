import Link from "next/link";
import { Home, MapPin, ArrowUpRight } from "lucide-react";
import { PublicPropertyResponse } from "../types/public-property";

interface PropertyCardProps {
    property: PublicPropertyResponse;
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Link
            href={`/listings/${property.propertyId}`}
            className="group block bg-surface rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:border-brand-200 hover:-translate-y-0.5 overflow-hidden"
        >
            {property.images?.[0] ? (
                <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                        src={property.images[0]}
                        alt={property.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            ) : (
                <div className="aspect-[4/3] bg-ink/[0.03] flex flex-col items-center justify-center text-ink-muted gap-2 group-hover:bg-ink/[0.06] transition-colors">
                    <Home className="w-8 h-8" strokeWidth={1.25} />
                    <span className="text-xs">No image</span>
                </div>
            )}

            <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-ink leading-snug group-hover:text-brand transition-colors duration-200">
                        {property.name}
                    </h3>
                    <span className="shrink-0 pill pill-neutral mt-0.5">
                        {property.propertyType}
                    </span>
                </div>

                {property.address?.city && (
                    <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                        <span>
                            {property.address.city}
                            {property.address.state ? `, ${property.address.state}` : ""}
                        </span>
                    </div>
                )}

                {property.description && (
                    <p className="text-sm text-ink-muted/80 line-clamp-2 leading-relaxed">
                        {property.description}
                    </p>
                )}

                <div className="pt-2 flex items-center text-sm font-medium text-brand opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <span>View details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2} />
                </div>
            </div>
        </Link>
    );
}
