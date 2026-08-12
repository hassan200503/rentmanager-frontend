import Link from "next/link";
import { PlatformBrand } from "@/shared/components/brand";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg dark:bg-bg-dark px-6 py-16">
            {/* Ambient brand glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
            />
            <div className="relative flex w-full max-w-md flex-col items-center text-center">
                <PlatformBrand size="md" />

                <p className="mt-10 font-display text-[5rem] font-bold leading-none tracking-tight text-fg dark:text-fg-dark sm:text-[6rem]">
                    404
                </p>
                <h1 className="mt-3 text-lg font-semibold text-fg dark:text-fg-dark">
                    Page not found
                </h1>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <Link href="/dashboard" className="btn-primary">
                        <Home className="h-4 w-4" strokeWidth={2} />
                        Back to dashboard
                    </Link>
                    <Link href="/" className="btn-secondary">
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}