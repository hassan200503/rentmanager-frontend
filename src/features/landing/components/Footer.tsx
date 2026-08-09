import Link from "next/link";
import { BrandBadge } from "@/shared/components/brand";
import { SIGNIN_LANDLORD_HREF, SIGNIN_RENTER_HREF } from "@/lib/auth/signin-links";
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
    { label: "Renter sign in", href: SIGNIN_RENTER_HREF },
    { label: "Create an account", href: "/public/sign-up" },
  ],
  "For landlords": [
    { label: "List a property", href: SIGNUP_LANDLORD_HREF },
    { label: "Landlord sign in", href: SIGNIN_LANDLORD_HREF },
    { label: "Dashboard", href: "/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="RentManager home">
              <BrandBadge size="md" />
            </Link>
            <p className="text-xs text-white/55 leading-relaxed max-w-xs">
              The modern way to find and reserve rental properties across Kenya. Verified listings,
              secure deposits, digital leases.
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