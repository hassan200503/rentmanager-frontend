import Link from "next/link";

export default function NotFound() {
    return (
        <div className="h-screen flex flex-col items-center justify-center text-center p-6">

            <h1 className="text-3xl font-bold">404</h1>

            <p className="text-gray-400 mt-2">
                The page you are looking for does not exist.
            </p>

            <Link
                href="/dashboard"
                className="mt-6 px-4 py-2 bg-white text-black rounded"
            >
                Go Home
            </Link>

        </div>
    );
}