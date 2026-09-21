import Link from "next/link";
import { PlatformBrand } from "@/shared/components/brand";
import { SIGNIN_HREF } from "@/lib/auth/signin-links";
import { SIGNUP_LANDLORD_HREF } from "@/lib/auth/signup-links";

const FOOTER_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  Platform: [
    { label: "Browse Properties", href: "/listings" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  "Renters": [
    { label: "Browse Properties", href: "/listings" },
    { label: "Sign in", href: SIGNIN_HREF },
    { label: "Create an account", href: "/public/sign-up" },
  ],
  "For landlords": [
    { label: "List a property", href: SIGNUP_LANDLORD_HREF },
    { label: "Sign in", href: SIGNIN_HREF },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/legal/privacy" },
    { label: "Terms of service", href: "/legal/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-10">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="RentManager home">
              <PlatformBrand size="md" onDark />
            </Link>
            <p className="text-xs text-white/55 leading-relaxed max-w-xs">
              {/* "Verified listings, secure deposits" claimed two things the
                  system does not do: no per-listing verification exists
                  (tenants.verified is a dead column), and a deposit is paid
                  into the landlord's own M-Pesa, never held by us — so we
                  cannot call it secured. What is left is exactly what the
                  code enforces. */}
              Find and reserve rental homes across Kenya. Only vacant units are listed, deposits
              are paid straight to the landlord by M-Pesa, and every lease is digital.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/60 mb-4">{category}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white/90 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} RentManager. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-[11px] tracking-wide text-white/25 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:text-white/80 rounded"
            aria-label="Platform admin console (owner only)"
          >
            RentManager &middot; Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}