import Link from "next/link";

export default function HomePage() {
    return (
        <main className="h-screen flex items-center justify-center bg-black text-white">

            <div className="text-center space-y-6">

                <h1 className="text-4xl font-bold">
                    RentManager SaaS
                </h1>

                <p className="text-gray-400 max-w-md mx-auto">
                    Multi-tenant property management system for modern real estate operations.
                </p>

                <div className="flex gap-4 justify-center">

                    <Link
                        href="/dashboard"
                        prefetch={false}
                        className="px-5 py-2 bg-white text-black rounded"
                    >
                        Enter Dashboard
                    </Link>

                    <Link
                        href="/public/sign-in"
                        className="px-5 py-2 border border-gray-600 rounded"
                    >
                        Sign In
                    </Link>

                </div>

            </div>

        </main>
    );
}