import Link from "next/link";
import { BrandBadge } from "@/shared/components/brand";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg dark:bg-bg-dark p-6">
            <div className="card max-w-md w-full text-center py-16">
                <div className="flex justify-center mb-6">
                    <BrandBadge size="lg" />
                </div>
                <h1 className="text-4xl font-bold text-fg dark:text-fg-dark mb-2">404</h1>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-8">
                    The page you are looking for does not exist.
                </p>
                <Link
                    href="/dashboard"
                    className="btn-primary inline-flex"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}