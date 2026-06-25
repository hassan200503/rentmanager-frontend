import Link from "next/link";

export default function HomePage() {
  return (
      <main className="min-h-screen bg-[#F7F7F4] text-[#14213D]">
        {/* ============ HEADER ============ */}
        <header className="border-b border-[#14213D]/10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
            RentManager
          </span>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5B6472]">
              <Link href="/listings" className="hover:text-[#14213D] transition-colors">
                Browse properties
              </Link>
              <Link href="/public/sign-up" className="hover:text-[#14213D] transition-colors">
                List your property
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                  href="/public/sign-in"
                  className="text-sm font-medium text-[#14213D] hover:text-[#5B6472] transition-colors"
              >
                Sign in
              </Link>
              <Link
                  href="/public/sign-up"
                  className="text-sm font-medium px-4 py-2 rounded-md bg-[#14213D] text-white hover:bg-[#1F2F54] transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </header>

        {/* ============ HERO ============ */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[#C1502E] bg-[#C1502E]/10 px-3 py-1 rounded-full">
            Built for the Kenyan rental market
          </span>

            <h1 className="font-[var(--font-display)] text-4xl md:text-5xl font-semibold leading-[1.08] tracking-tight">
              Find a vacant unit.
              <br />
              Reserve it. Move in.
            </h1>

            <p className="text-lg text-[#5B6472] max-w-md leading-relaxed">
              Search verified properties across Kenya, see real vacancies as
              they open up, and secure a unit with a refundable deposit —
              no agent calls, no fake listings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                  href="/listings"
                  className="px-6 py-3 rounded-md text-base font-semibold bg-[#E8A33D] text-[#14213D] hover:bg-[#DC9530] transition-colors shadow-sm text-center"
              >
                Browse properties
              </Link>
              <Link
                  href="/public/sign-up"
                  className="px-6 py-3 rounded-md text-base font-semibold border border-[#14213D]/15 text-[#14213D] hover:bg-[#14213D]/5 transition-colors text-center"
              >
                List your property
              </Link>
            </div>
          </div>

          {/* Signature element: a live unit card preview, not a stock photo */}
          <div className="relative">
            <div className="rounded-2xl border border-[#14213D]/10 bg-white shadow-[0_20px_50px_-20px_rgba(20,33,61,0.25)] p-5 space-y-4 max-w-sm mx-auto">
              <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#5B6472]">
                Kilimani, Nairobi
              </span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#1F8A55]/10 text-[#1F8A55]">
                Vacant now
              </span>
              </div>
              <div className="h-36 rounded-lg bg-gradient-to-br from-[#14213D]/10 to-[#E8A33D]/20" />
              <div>
                <p className="font-[var(--font-display)] text-xl font-semibold">
                  KES 32,000 <span className="text-sm font-normal text-[#5B6472]">/ month</span>
                </p>
                <p className="text-sm text-[#5B6472] mt-1">
                  2 Bedroom · Greenfield Apartments, Unit 4B
                </p>
              </div>
              <div className="text-sm font-semibold text-[#C1502E] flex items-center gap-1">
                Reserve with KES 5,000 deposit →
              </div>
            </div>

            {/* secondary floating card for depth */}
            <div className="hidden md:block absolute -bottom-6 -left-8 rounded-xl border border-[#14213D]/10 bg-white shadow-md px-4 py-3 text-xs text-[#5B6472] w-44">
              <p className="font-semibold text-[#14213D]">Verified listing</p>
              <p>Owner confirmed by RentManager</p>
            </div>
          </div>
        </section>

        {/* ============ LIVE AVAILABILITY STRIP (signature element) ============ */}
        <section className="border-y border-[#14213D]/10 bg-[#14213D] text-white">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <p className="font-[var(--font-display)] text-2xl font-semibold">1,240+</p>
              <p className="text-xs text-white/60 mt-1">vacant units listed</p>
            </div>
            <div>
              <p className="font-[var(--font-display)] text-2xl font-semibold">38</p>
              <p className="text-xs text-white/60 mt-1">towns &amp; estates covered</p>
            </div>
            <div>
              <p className="font-[var(--font-display)] text-2xl font-semibold">KES 5,000</p>
              <p className="text-xs text-white/60 mt-1">avg. refundable deposit</p>
            </div>
            <div>
              <p className="font-[var(--font-display)] text-2xl font-semibold">100%</p>
              <p className="text-xs text-white/60 mt-1">owner-verified listings</p>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS (real sequence — numbering earns its place) ============ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-[var(--font-display)] text-2xl md:text-3xl font-semibold text-center mb-12">
            From search to move-in, in three steps
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Search",
                body: "Filter by location, price, or property name to find units that are vacant right now — not last month.",
              },
              {
                step: "02",
                title: "Reserve",
                body: "Pay a small, refundable deposit to hold your unit while you finalize your move — no cash to agents, no guesswork.",
              },
              {
                step: "03",
                title: "Move in",
                body: "Your lease activates automatically. Rent due dates, receipts, and reminders are all handled for you.",
              },
            ].map((item) => (
                <div key={item.step} className="space-y-3">
              <span className="font-[var(--font-display)] text-sm font-semibold text-[#C1502E]">
                {item.step}
              </span>
                  <h3 className="font-[var(--font-display)] text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-[#5B6472] leading-relaxed">{item.body}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ============ FOR LANDLORDS ============ */}
        <section className="bg-[#C1502E]/[0.06] border-y border-[#C1502E]/10">
          <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
            <span className="inline-flex text-xs font-semibold tracking-wide uppercase text-[#C1502E]">
              For property owners
            </span>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold leading-tight">
                List your vacant units.
                <br />
                Let RentManager fill them.
              </h2>
              <p className="text-[#5B6472] leading-relaxed max-w-md">
                Manage your portfolio, track rent and deposits, and reach
                renters actively searching in your area — all from one
                dashboard built for Kenyan landlords.
              </p>
              <Link
                  href="/public/sign-up"
                  className="inline-block px-6 py-3 rounded-md text-base font-semibold bg-[#C1502E] text-white hover:bg-[#A8432A] transition-colors"
              >
                Create a free account
              </Link>
            </div>

            <ul className="space-y-4">
              {[
                "Set up properties and units in minutes",
                "Get paid deposits directly, held until move-in is confirmed",
                "Automatic rent tracking once a lease activates",
                "Reach renters across Kenya searching by location",
              ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#C1502E] flex-shrink-0" />
                    <span className="text-[#14213D]">{point}</span>
                  </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#5B6472]">
          <span>© {new Date().getFullYear()} RentManager. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/listings" className="hover:text-[#14213D] transition-colors">
              Browse properties
            </Link>
            <Link href="/public/sign-in" className="hover:text-[#14213D] transition-colors">
              Sign in
            </Link>
            <Link href="/public/sign-up" className="hover:text-[#14213D] transition-colors">
              Sign up
            </Link>
          </div>
        </footer>
      </main>
  );
}