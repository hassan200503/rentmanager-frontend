import Link from "next/link";

/**
 * PayPal‑inspired header component.
 * It is purely presentational – no business logic is touched.
 */
export default function Header() {
  return (
    <header className="header sticky top-0 z-10 bg-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo placeholder – keep it simple and text‑based */}
        <div className="text-xl font-semibold text-primary">
          RentManager
        </div>

        <nav className="flex gap-6">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link href="/public/sign-in" className="nav-link">
            Sign In
          </Link>
          <Link href="/public/sign-up" className="nav-link">
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}
