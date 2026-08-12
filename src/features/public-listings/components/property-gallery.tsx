// features/public-listings/components/property-gallery.tsx
// Premium photo gallery: blur-up load, desktop mosaic grid, mobile
// snap-scroll carousel, and a focus-trapped lightbox with thumbnail strip.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff, Images, X } from "lucide-react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface PropertyGalleryProps {
    propertyName: string;
    images: string[];
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function PropertyGallery({ propertyName, images }: PropertyGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});
    const [slideIndex, setSlideIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const reduceMotion = useReducedMotion();

    const markLoaded = useCallback((index: number) => {
        setLoaded((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
    }, []);

    /* ── Lightbox lifecycle: scroll lock, keyboard, focus trap ── */
    useEffect(() => {
        if (lightboxIndex === null) return;

        document.body.style.overflow = "hidden";
        closeBtnRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowRight") {
                setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
            }
            if (e.key === "ArrowLeft") {
                setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
            }
            if (e.key === "Tab") {
                const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
                if (!focusables || focusables.length === 0) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
            openerRef.current?.focus();
        };
    }, [lightboxIndex, images.length]);

    const open = useCallback((index: number) => {
        openerRef.current = document.activeElement as HTMLElement | null;
        setLightboxIndex(index);
    }, []);

    /* ── Mobile carousel paging dots ── */
    const handleCarouselScroll = useCallback(() => {
        const el = carouselRef.current;
        if (!el) return;
        setSlideIndex(Math.round(el.scrollLeft / el.clientWidth));
    }, []);

    if (images.length === 0) {
        return (
            <div className="h-[240px] rounded-3xl border border-dashed border-ink/15 bg-surface flex flex-col items-center justify-center gap-2 text-ink-muted">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.04] dark:bg-white/[0.06]">
                    <ImageOff className="w-5 h-5" strokeWidth={1.5} />
                </span>
                <p className="text-sm">No photos available yet</p>
            </div>
        );
    }

    const [heroImage, ...restImages] = images;
    const visibleThumbs = restImages.slice(0, 3);
    const remainingCount = restImages.length - visibleThumbs.length;
    const total = images.length;

    const imageEl = (url: string, index: number, alt: string) => (
        <Image
            src={url}
            alt={alt}
            fill
            sizes={index === 0 ? "(max-width: 768px) 100vw, 60vw" : "25vw"}
            onLoad={() => markLoaded(index)}
            className={`img-blur-up ${loaded[index] ? "loaded" : ""}`}
        />
    );

    return (
        <>
            {/* ── Mobile: snap-scroll carousel ── */}
            <div className="md:hidden">
                <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className="flex snap-x snap-mandatory overflow-x-auto -mx-6 px-6 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {images.map((url, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => open(index)}
                            className="group relative mr-2 aspect-[4/3] w-full shrink-0 snap-center overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-brand/50"
                            aria-label={`View ${propertyName} photo ${index + 1}`}
                        >
                            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                                {imageEl(url, index, `${propertyName} photo ${index + 1}`)}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent opacity-60" />
                        </button>
                    ))}
                </div>

                {total > 1 && (
                    <div className="mt-3 flex items-center justify-between px-1">
                        <div className="flex gap-1.5" aria-hidden="true">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        index === slideIndex
                                            ? "w-5 bg-brand"
                                            : "w-1.5 bg-ink/15 dark:bg-white/20"
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => open(slideIndex)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.05] dark:bg-white/[0.08] px-3 py-1 text-xs font-medium text-ink hover:bg-ink/10 dark:hover:bg-white/[0.12] transition-colors"
                        >
                            <Images className="w-3.5 h-3.5" strokeWidth={1.75} />
                            {slideIndex + 1} / {total}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Desktop: mosaic grid ── */}
            <div className="hidden md:grid gap-2.5 grid-cols-4 grid-rows-2 h-[480px] animate-fade-in-up">
                <button
                    type="button"
                    onClick={() => open(0)}
                    className={`group gallery-tile-ring relative overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 ${
                        total === 1 ? "col-span-4 row-span-2" : "col-span-2 row-span-2"
                    }`}
                    aria-label={`View ${propertyName} main photo`}
                >
                    <div className="absolute inset-0 transition-all duration-[800ms] ease-out group-hover:scale-[1.06]">
                        {imageEl(heroImage, 0, `${propertyName} main photo`)}
                    </div>
                    {/* Enhanced overlay with premium gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-60 transition-opacity duration-400 group-hover:opacity-80" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.15] rounded-3xl pointer-events-none transition-all duration-300 group-hover:ring-white/[0.25]" />
                    
                    {/* Premium shimmer effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </div>

                    {/* Enhanced image counter badge */}
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink/60 dark:bg-ink/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:bg-ink/70 group-hover:scale-105">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        1 / {total}
                    </span>

                    {total > 1 && (
                        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-white/95 dark:bg-white/[0.12] px-4 py-2 text-sm font-bold text-ink dark:text-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:ring-1 dark:ring-white/20 transition-all duration-300 group-hover:translate-y-[-4px] group-hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.4)] group-hover:scale-[1.02]">
                            <Images className="w-4 h-4" strokeWidth={2.5} />
                            <span>View all {total} photos</span>
                        </span>
                    )}
                </button>

                {visibleThumbs.map((url, index) => {
                    const isLastVisible = index === visibleThumbs.length - 1;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => open(index + 1)}
                            className={`group gallery-tile-ring relative overflow-hidden rounded-2xl transition-all duration-400 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:z-10 ${
                                restImages.length === 1 && index === 0
                                    ? "col-span-2 row-span-2"
                                    : ""
                            }`}
                            aria-label={`View ${propertyName} photo ${index + 2}`}
                        >
                            <div className="absolute inset-0 transition-all duration-700 ease-out group-hover:scale-[1.08]">
                                {imageEl(url, index + 1, `${propertyName} photo ${index + 2}`)}
                            </div>
                            {/* Premium overlay effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-ink/5 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-70" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none transition-all duration-300 group-hover:ring-white/20" />
                            
                            {/* Enhanced counter badge */}
                            <span className="absolute top-3 right-3 rounded-full bg-ink/60 dark:bg-ink/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-md ring-1 ring-white/10 transition-all duration-300 group-hover:bg-ink/75 group-hover:scale-105">
                                {index + 2} / {total}
                            </span>
                            
                            {isLastVisible && remainingCount > 0 && (
                                <div className="absolute inset-0 bg-gradient-to-br from-ink/70 via-ink/60 to-ink/70 flex items-center justify-center text-white backdrop-blur-[2px] transition-all duration-300 group-hover:backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <Images className="w-6 h-6" strokeWidth={2} />
                                        <span className="text-lg font-bold">+{remainingCount}</span>
                                        <span className="text-xs font-medium opacity-90">more photos</span>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${propertyName} photos`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        className="fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-sm px-4 md:px-8 pt-16 md:pt-20 pb-5"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between gap-4 mb-4 md:mb-5">
                            <span className="text-sm font-medium text-white/70">
                                {lightboxIndex + 1} / {total}
                            </span>
                            <button
                                ref={closeBtnRef}
                                type="button"
                                onClick={() => setLightboxIndex(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                aria-label="Close photos"
                            >
                                <X className="w-5 h-5" strokeWidth={1.75} />
                            </button>
                        </div>

                        {/* Image stage */}
                        <div className="relative flex-1 flex items-center justify-center min-h-0">
                            {total > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((i) =>
                                                i === null ? i : (i - 1 + total) % total
                                            );
                                        }}
                                        className="absolute left-0 md:left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft className="w-6 h-6" strokeWidth={1.75} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((i) =>
                                                i === null ? i : (i + 1) % total
                                            );
                                        }}
                                        className="absolute right-0 md:right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight className="w-6 h-6" strokeWidth={1.75} />
                                    </button>
                                </>
                            )}

                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key={lightboxIndex}
                                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.97, x: -20 }}
                                    transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
                                    className="relative w-full h-full max-h-full flex items-center justify-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Image
                                        src={images[lightboxIndex]}
                                        alt={`${propertyName} photo ${lightboxIndex + 1}`}
                                        width={1600}
                                        height={1200}
                                        sizes="100vw"
                                        priority
                                        className="max-h-[62vh] md:max-h-[68vh] max-w-full object-contain rounded-xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)]"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Thumbnail strip */}
                        {total > 1 && (
                            <div
                                className="mt-4 md:mt-5 flex gap-2.5 overflow-x-auto px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {images.map((url, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setLightboxIndex(index)}
                                        data-active={index === lightboxIndex}
                                        className="lightbox-thumb h-12 w-16 md:h-14 md:w-20 shrink-0"
                                        aria-label={`Go to photo ${index + 1}`}
                                        aria-current={index === lightboxIndex}
                                    >
                                        <Image
                                            src={url}
                                            alt=""
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}