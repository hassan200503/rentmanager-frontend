"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Home, Menu, X } from "lucide-react";
import { BrandBadge } from "@/shared/components/brand";
import { SIGNIN_LANDLORD_HREF, SIGNIN_RENTER_HREF } from "@/lib/auth/signin-links";
import { SIGNUP_LANDLORD_HREF } from "@/lib/auth/signup-links";
import { Button } from "@/shared/components/ui/Button";

const NAV_LINKS = [
  { label: "Browse", href: "/listings" },
  { label: "List property", href: SIGNUP_LANDLORD_HREF },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

/* Scroll state lives here and only here — the rest of the page must never
   re-render on scroll. */
export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Mobile menu: lock body scroll while open, close on Escape */
  useEffect(() => {
    if (!mobileMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenu(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileMenu]);

  const close = () => setMobileMenu(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#030712]/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link 
            href="/" 
            className="flex items-center gap-3 shrink-0 transition-transform hover:scale-105 duration-200" 
            aria-label="RentManager home"
          >
            <BrandBadge size="lg" />
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-white/70 hover:text-white transition-colors py-2 focus-visible:outline-none focus-visible:text-white rounded-md after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-jade-500 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href={SIGNIN_LANDLORD_HREF}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-all duration-200 px-3 py-2 min-h-11 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 hover:bg-white/5"
            >
              <Building2 className="h-4 w-4 text-white/40" strokeWidth={1.75} />
              Landlord sign in
            </Link>
            <Link
              href={SIGNIN_RENTER_HREF}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-all duration-200 px-3 py-2 min-h-11 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 hover:bg-white/5"
            >
              <Home className="h-4 w-4 text-white/40" strokeWidth={1.75} />
              Renter sign in
            </Link>
            <Button 
              href={SIGNUP_LANDLORD_HREF} 
              variant="primary" 
              size="sm" 
              className="min-h-11 hover:shadow-lg hover:shadow-jade-500/25 active:scale-95 transition-all duration-200"
            >
              Get started
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenu}
            aria-controls="mobile-menu"
            className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400"
          >
            {mobileMenu ? <X className="w-5 h-5" strokeWidth={2} /> : <Menu className="w-5 h-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div id="mobile-menu" className="lg:hidden border-t border-white/5 bg-[#030712]/95 backdrop-blur-xl shadow-2xl shadow-black/40">
          <nav className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block px-4 py-3.5 rounded-xl text-sm font-medium text-white/75 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2.5 border-t border-white/5 mt-3">
              <Link
                href={SIGNIN_LANDLORD_HREF}
                onClick={close}
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white/80 border border-white/10 hover:text-white hover:border-jade-500/30 transition-colors"
              >
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
                Sign in as a landlord
              </Link>
              <Link
                href={SIGNIN_RENTER_HREF}
                onClick={close}
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white/80 border border-white/10 hover:text-white hover:border-jade-500/30 transition-colors"
              >
                <Home className="h-4 w-4" strokeWidth={1.75} />
                Sign in as a tenant or renter
              </Link>
              <Button href={SIGNUP_LANDLORD_HREF} variant="primary" size="lg" fullWidth onClick={close}>
                Get started
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}