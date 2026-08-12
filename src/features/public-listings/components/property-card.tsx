import Link from "next/link";
import Image from "next/image";
import { Home, MapPin, ArrowUpRight } from "lucide-react";
import { PublicPropertyResponse } from "../types/public-property";

interface PropertyCardProps {
    property: PublicPropertyResponse;
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <article className="group relative">
            {/* Premium outer glow effect */}
            <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-br from-brand-200/40 via-brand-100/20 to-transparent dark:from-brand-600/20 dark:to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 -z-10" aria-hidden="true" />
            
            <Link
                href={`/listings/${property.propertyId}`}
                className="block relative bg-gradient-to-br from-white via-white/98 to-brand-50/30 dark:from-surface-dark dark:via-[#1a1d24] dark:to-brand-900/10 rounded-[1.5rem] border-2 border-border/40 dark:border-border-dark/40 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),0_1px_4px_rgba(0,0,0,0.2)] transition-all duration-700 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.24),0_12px_28px_-8px_rgba(5,150,105,0.18),0_0_0_1px_rgba(5,150,105,0.12)] hover:border-brand-300 dark:hover:border-brand-500/60 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden before:absolute before:inset-0 before:rounded-[calc(1.5rem-2px)] before:ring-[3px] before:ring-inset before:ring-transparent hover:before:ring-brand-200/40 dark:hover:before:ring-brand-500/20 before:transition-all before:duration-700 before:pointer-events-none after:absolute after:inset-[2px] after:rounded-[calc(1.5rem-4px)] after:bg-gradient-to-b after:from-white/70 after:via-white/20 after:to-transparent dark:after:from-white/[0.04] dark:after:via-transparent after:pointer-events-none after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-700"
            >
                {/* ──── ULTRA-PREMIUM IMAGE SECTION ──── */}
                {property.images?.[0] ? (
                    <div className="relative overflow-hidden aspect-[16/11] rounded-t-[calc(1.5rem-2px)]">
                        {/* Image with sophisticated zoom */}
                        <Image
                            src={property.images[0]}
                            alt={`${property.name} - property exterior`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            className="object-cover transition-all duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.10]"
                            priority={false}
                        />
                        
                        {/* Multi-layer gradient system for cinematic depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent opacity-75 transition-opacity duration-700 group-hover:opacity-85" />
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                        
                        {/* Luxury property type badge */}
                        <div className="absolute top-5 right-5 transition-all duration-600 group-hover:scale-[1.12] group-hover:-translate-y-1 group-hover:-translate-x-1">
                            <div className="relative">
                                {/* Badge glow effect */}
                                <div className="absolute -inset-2 bg-white/40 dark:bg-brand-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-600" aria-hidden="true" />
                                
                                <div className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white/98 dark:bg-white/[0.18] backdrop-blur-3xl border-2 border-white/60 dark:border-white/30 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.3),0_4px_12px_-2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] ring-1 ring-white/40 dark:ring-white/20">
                                    <span className="text-[11px] font-black text-ink dark:text-white uppercase tracking-[0.15em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                        {property.propertyType}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Premium location display */}
                        {property.address?.city && (
                            <div className="absolute bottom-5 left-5 right-5 transition-all duration-600 group-hover:translate-y-[-6px]">
                                <div className="relative">
                                    {/* Location badge glow */}
                                    <div className="absolute -inset-2 bg-brand-400/40 dark:bg-brand-400/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-600" aria-hidden="true" />
                                    
                                    <div className="relative inline-flex items-center gap-3 px-5 py-3.5 rounded-[14px] bg-white/98 dark:bg-white/[0.18] backdrop-blur-3xl border-2 border-white/60 dark:border-white/30 shadow-[0_16px_40px_-6px_rgba(0,0,0,0.35),0_6px_16px_-4px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.7)] ring-1 ring-white/40 dark:ring-white/20 max-w-full">
                                        {/* Icon container with gradient */}
                                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] ring-2 ring-white/30 dark:ring-white/20 flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" strokeWidth={2.5} fill="rgba(255,255,255,0.25)" />
                                        </div>
                                        
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[10px] font-bold text-ink/60 dark:text-white/50 uppercase tracking-[0.12em] leading-none mb-1">
                                                Location
                                            </span>
                                            <span className="text-[15px] font-black text-ink dark:text-white leading-tight truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                                                {property.address.city}
                                                {property.address.state && `, ${property.address.state}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative aspect-[16/11] bg-gradient-to-br from-brand-50/90 via-white to-brand-50/40 dark:from-brand-900/25 dark:via-surface-dark dark:to-brand-800/15 flex flex-col items-center justify-center rounded-t-[calc(1.5rem-2px)] border-b-2 border-border/30 dark:border-border-dark/30 overflow-hidden">
                        {/* Decorative background patterns */}
                        <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-emerald-400/5" aria-hidden="true" />
                        
                        <div className="relative flex flex-col items-center gap-4 text-ink-muted z-10">
                            <div className="relative">
                                {/* Icon glow effect */}
                                <div className="absolute -inset-3 bg-brand-200/30 dark:bg-brand-600/20 rounded-3xl blur-2xl" aria-hidden="true" />
                                
                                <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-white/90 dark:bg-white/[0.12] ring-2 ring-ink/[0.06] dark:ring-white/[0.08] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-600">
                                    <Home className="w-9 h-9 text-ink-muted/70 dark:text-white/60" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-xs font-black text-ink-muted/60 dark:text-white/50 uppercase tracking-[0.15em]">
                                    No Image Available
                                </p>
                                <p className="text-[10px] font-bold text-ink-muted/40 dark:text-white/30 uppercase tracking-wider">
                                    Property Preview
                                </p>
                            </div>
                        </div>
                        
                        {/* Luxury property type badge */}
                        <div className="absolute top-5 right-5 transition-all duration-600 group-hover:scale-[1.12]">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-brand-200/20 dark:bg-brand-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-600" aria-hidden="true" />
                                
                                <div className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-[14px] bg-white/95 dark:bg-white/[0.15] backdrop-blur-2xl border-2 border-ink/[0.08] dark:border-white/[0.15] shadow-[0_4px_16px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4)] ring-1 ring-ink/[0.04] dark:ring-white/10">
                                    <span className="text-[11px] font-black text-ink dark:text-white uppercase tracking-[0.15em]">
                                        {property.propertyType}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Premium location badge */}
                        {property.address?.city && (
                            <div className="absolute bottom-5 left-5 right-5">
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-brand-400/20 dark:bg-brand-400/15 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-600" aria-hidden="true" />
                                    
                                    <div className="relative inline-flex items-center gap-3 px-5 py-3.5 rounded-[14px] bg-white/95 dark:bg-white/[0.15] backdrop-blur-2xl border-2 border-ink/[0.08] dark:border-white/[0.15] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] ring-1 ring-ink/[0.04] dark:ring-white/10 max-w-full">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-2 ring-white/30 dark:ring-white/20 flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} fill="rgba(255,255,255,0.25)" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[10px] font-bold text-ink/60 dark:text-white/50 uppercase tracking-[0.12em] leading-none mb-1">
                                                Location
                                            </span>
                                            <span className="text-[15px] font-black text-ink dark:text-white leading-tight truncate">
                                                {property.address.city}
                                                {property.address.state && `, ${property.address.state}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ──── ULTRA-PREMIUM CONTENT SECTION ──── */}
                <div className="relative z-10 p-7 space-y-5 bg-gradient-to-b from-transparent via-white/20 to-white/60 dark:via-transparent dark:to-white/[0.02]">
                    {/* Property name with refined typography */}
                    <div className="space-y-3">
                        <h3 className="text-[22px] font-display font-black text-ink dark:text-white leading-[1.2] tracking-[-0.01em] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-700 group-hover:via-brand-600 group-hover:to-brand-700 dark:group-hover:from-brand-400 dark:group-hover:via-brand-300 dark:group-hover:to-brand-400 transition-all duration-500 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                            {property.name}
                        </h3>
                        
                        {/* Address detail line with icon (if not shown in image) */}
                        {!property.images?.[0] && property.address?.city && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30 ring-1 ring-brand-200/50 dark:ring-brand-700/50">
                                    <MapPin className="w-3 h-3 text-brand-700 dark:text-brand-400" strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-ink-muted dark:text-white/70">
                                    {property.address.city}
                                    {property.address.state && `, ${property.address.state}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description with refined typography */}
                    {property.description && (
                        <div className="relative">
                            {/* Subtle decorative element */}
                            <div className="absolute -left-2 top-1 w-0.5 h-8 bg-gradient-to-b from-brand-400/40 via-brand-300/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                            
                            <p className="text-[14px] text-ink-muted/80 dark:text-white/60 line-clamp-2 leading-[1.6] font-medium pl-0.5">
                                {property.description}
                            </p>
                        </div>
                    )}

                    {/* Ultra-premium CTA section */}
                    <div className="pt-4 border-t-2 border-gradient-to-r from-border/30 via-border/50 to-border/30 dark:from-border-dark/20 dark:via-border-dark/40 dark:to-border-dark/20">
                        <div className="flex items-center justify-between gap-4">
                            {/* Animated text CTA */}
                            <div className="inline-flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-12px] group-hover:translate-x-0">
                                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 dark:from-brand-400 dark:via-brand-300 dark:to-brand-400 uppercase tracking-wider">
                                    View Property
                                </span>
                                <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_-2px_rgba(5,150,105,0.5)] group-hover:shadow-[0_4px_12px_-2px_rgba(5,150,105,0.6)] transition-all duration-300">
                                    <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                            </div>
                            
                            {/* Luxury icon button */}
                            <div className="relative opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                {/* Button glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-br from-brand-400/30 to-brand-600/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                                
                                <div className="relative flex items-center justify-center w-11 h-11 rounded-xl border-2 border-brand-300/60 dark:border-brand-600/60 bg-gradient-to-br from-white via-brand-50/50 to-brand-100/50 dark:from-white/[0.08] dark:via-brand-900/30 dark:to-brand-900/40 group-hover:border-brand-400 dark:group-hover:border-brand-500 group-hover:from-brand-50 group-hover:to-brand-100 dark:group-hover:from-brand-900/40 dark:group-hover:to-brand-800/50 text-brand-700 dark:text-brand-400 group-hover:text-brand-800 dark:group-hover:text-brand-300 transition-all duration-500 group-hover:scale-[1.15] group-hover:rotate-6 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_12px_-2px_rgba(5,150,105,0.3)] group-hover:shadow-[0_6px_20px_-4px_rgba(5,150,105,0.4)]">
                                    <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
