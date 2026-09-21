import Link from "next/link";
import { ReactNode } from "react";
import { PlatformBrand } from "@/shared/components/brand";
import { Footer } from "@/features/landing/components/Footer";

/**
 * Shell for the policy pages.
 *
 * Deliberately plain: no 3D scene, no animation, no data fetching, so both
 * pages prerender to static HTML and open instantly even on a slow phone
 * connection. Someone reads these when they are worried about something, and
 * a policy page that takes four seconds to appear is its own answer.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#070b0f] text-white/85">
            <header className="border-b border-white/5">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="RentManager home">
                        <PlatformBrand size="md" onDark />
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">{children}</main>

            <Footer />
        </div>
    );
}
