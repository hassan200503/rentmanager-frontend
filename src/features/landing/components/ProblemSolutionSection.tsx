import { X , ShieldCheck, BadgeCheck, Wallet } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const PAIN_POINTS = [
  {
    title: "Fake listings waste your time",
    desc: "You travel across town to view a unit that doesn't exist — or was already rented weeks ago.",
  },
  {
    title: "Brokers take a cut of everything",
    desc: "A 'finding fee' here, a 'service fee' there. You end up paying a month's rent for a phone number.",
  },
  {
    title: "Paperwork lives in a shoebox",
    desc: "Handwritten leases, lost receipts, deposits chased for months. One shrug and you start over.",
  },
];

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    title: "Every listing is ID-verified",
    desc: "A property goes live only after the owner has been verified. Fake listings never make it to the platform.",
  },
  {
    icon: Wallet,
    title: "Reserve directly, zero broker fees",
    desc: "You deal with the verified owner. Your deposit is held securely and refunded if a listing falls through.",
  },
  {
    icon: BadgeCheck,
    title: "Signed digitally, kept forever",
    desc: "Your lease and every receipt live in one place — accessible, permanent, and legally binding.",
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.03] to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Why RentManager"
          title="Renting in Kenya shouldn't mean this"
          description="The pain every renter knows — and the way RentManager removes it."
        />

        <div className="grid md:grid-cols-3 gap-6 mb-2">
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center mb-4">
                <X className="w-5 h-5 text-red-400/80" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-white/85">{p.title}</h3>
              <p className="text-sm text-white/45 mt-2 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 my-4" aria-hidden="true">
          <span className="h-px flex-1 max-w-28 bg-gradient-to-r from-transparent to-jade-500/40" />
          <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-jade-400">
            RentManager fixes this
          </span>
          <span className="h-px flex-1 max-w-28 bg-gradient-to-l from-transparent to-jade-500/40" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SOLUTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-jade-500/15 bg-jade-500/[0.03] p-6">
                <div className="w-10 h-10 rounded-xl bg-jade-500/10 border border-jade-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-jade-400" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-white">{s.title}</h3>
                <p className="text-sm text-white/50 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}