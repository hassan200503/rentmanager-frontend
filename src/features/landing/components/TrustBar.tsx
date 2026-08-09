import { ShieldCheck, Lock, FileText, HeadphonesIcon } from "lucide-react";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "ID-verified owners" },
  { icon: Lock, label: "Encrypted M-Pesa payments" },
  { icon: FileText, label: "Legally binding leases" },
  { icon: HeadphonesIcon, label: "24/7 human support" },
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