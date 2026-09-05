import { ShieldCheck, Smartphone, FileText, Receipt } from "lucide-react";

/**
 * Every item here must be traceable to working code — the frontend AGENTS.md
 * rule, applied to the component files and not just to content.ts.
 *
 * What was here before, and why each had to go:
 *
 *   "ID-verified owners"    — there is no identity verification anywhere in
 *                             the backend. Nothing is checked against any ID.
 *   "24/7 human support"    — there is no support rota. AGENTS.md says so.
 *   "Legally binding leases"— a legal assertion the platform is not in a
 *                             position to make about its users' agreements.
 *   "Encrypted M-Pesa
 *    payments"              — true of credentials at rest, but it reads as a
 *                             claim about the payment itself and invites a
 *                             question nobody here can answer precisely.
 *
 * What replaced them, and what backs each:
 *
 *   Approved landlords      — Tenant.status reaches ACTIVE only through a
 *                             deliberate admin approval.
 *   Pay by M-Pesa           — the STK push flow, plainly stated.
 *   Digital lease agreements— leases exist with a real state machine.
 *   Every payment receipted — rent_transactions is append-only at the
 *                             database (V81) and each payment carries its
 *                             M-Pesa receipt number. This is the strongest
 *                             true claim on the page and worth leading with.
 */
const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Approved landlords" },
  { icon: Smartphone, label: "Pay by M-Pesa" },
  { icon: FileText, label: "Digital lease agreements" },
  { icon: Receipt, label: "Every payment receipted" },
];

export function TrustBar() {
  return (
    <section className="relative border-y border-white/5 bg-white/[0.02]" aria-label="Trust signals">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex items-center gap-2 text-[13px] font-medium text-white/60">
                <Icon className="w-4 h-4 text-jade-400" strokeWidth={1.75} aria-hidden="true" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}