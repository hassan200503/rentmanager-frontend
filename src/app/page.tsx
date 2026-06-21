import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Hero section – generous whitespace, clear hierarchy */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 lg:py-32 bg-gradient-to-b from-primary-light to-white">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            RentManager SaaS
          </h1>

          <p className="text-lg text-gray-600">
            Multi‑tenant property management system for modern real‑estate
            operations. Manage properties, tenants, and payments with a clean,
            secure, and intuitive interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/dashboard"
              prefetch={false}
              className="btn-primary px-6 py-3 rounded-md text-base font-medium transition-colors shadow-sm hover:shadow-md"
            >
              Enter Dashboard
            </Link>

            <Link
              href="/public/sign-in"
              className="btn-secondary px-6 py-3 rounded-md text-base font-medium transition-colors shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer – subtle, keeps the page balanced */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-200">
        © {new Date().getFullYear()} RentManager SaaS. All rights reserved.
      </footer>
    </main>
  );
}
