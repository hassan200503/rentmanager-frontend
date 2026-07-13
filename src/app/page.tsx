import Link from "next/link";

import { publicUnitApi } from "@/features/public-listings/api/public-unit-api";

export const dynamic = "force-dynamic";

function daysVacant(vacatedAt?: string): number | null {
  if (!vacatedAt) return null;
  const diff = Date.now() - new Date(vacatedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/* ============================================================
   SIGNATURE ELEMENT: three skylines — dusk, night, dawn — that
   crossfade into each other on a slow infinite loop. Pure SVG +
   CSS keyframes, no images, no client JS, deterministic seeded
   random so markup is stable across renders.
   ============================================================ */

type Building = {
  x: number;
  width: number;
  floors: number;
  cols: number;
  depth: "back" | "front";
};

const LAYOUT: Building[] = [
  { x: -20, width: 110, floors: 10, cols: 3, depth: "back" },
  { x: 90, width: 80, floors: 7, cols: 2, depth: "back" },
  { x: 175, width: 130, floors: 14, cols: 4, depth: "front" },
  { x: 300, width: 90, floors: 8, cols: 3, depth: "back" },
  { x: 385, width: 115, floors: 12, cols: 3, depth: "front" },
  { x: 495, width: 75, floors: 6, cols: 2, depth: "back" },
  { x: 565, width: 140, floors: 17, cols: 4, depth: "front" },
  { x: 700, width: 95, floors: 9, cols: 3, depth: "back" },
  { x: 790, width: 120, floors: 13, cols: 4, depth: "front" },
  { x: 905, width: 85, floors: 7, cols: 2, depth: "back" },
  { x: 985, width: 135, floors: 15, cols: 4, depth: "front" },
  { x: 1115, width: 90, floors: 8, cols: 3, depth: "back" },
  { x: 1200, width: 110, floors: 11, cols: 3, depth: "front" },
  { x: 1305, width: 80, floors: 6, cols: 2, depth: "back" },
  { x: 1380, width: 100, floors: 9, cols: 3, depth: "front" },
];

function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type SceneName = "dusk" | "night" | "dawn";

const SCENE_PALETTES: Record<
    SceneName,
    { sky: string; glow: string; litBias: number; heightJitter: number }
> = {
  dusk: {
    sky: "linear-gradient(180deg, #0A0F1C 0%, #101A31 55%, #16213D 100%)",
    glow: "linear-gradient(180deg, rgba(232,163,61,0) 0%, rgba(232,163,61,0.16) 100%)",
    litBias: 0,
    heightJitter: 0,
  },
  night: {
    sky: "linear-gradient(180deg, #05070C 0%, #0B1020 55%, #11162A 100%)",
    glow: "linear-gradient(180deg, rgba(120,150,255,0) 0%, rgba(120,150,255,0.10) 100%)",
    litBias: 0.18,
    heightJitter: 7,
  },
  dawn: {
    sky: "linear-gradient(180deg, #1B1330 0%, #3A2C4F 55%, #6A4A5A 100%)",
    glow: "linear-gradient(180deg, rgba(255,150,120,0) 0%, rgba(255,150,120,0.22) 100%)",
    litBias: -0.1,
    heightJitter: 14,
  },
};

function buildSkyline(seed: number, litBias: number, heightJitter: number) {
  const rand = mulberry32(seed);
  return LAYOUT.map((b, bi) => {
    const groundY = 340;
    const floorH = 12;
    const floors = Math.max(4, b.floors + Math.round((rand() - 0.5) * 2 * (heightJitter / floorH)));
    const height = floors * floorH;
    const y = groundY - height;
    const windows: {
      cx: number;
      cy: number;
      variant: "bright" | "mid" | "dim";
      delay: number;
      duration: number;
    }[] = [];

    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < b.cols; c++) {
        if (rand() < 0.08) continue;
        const roll = rand() - litBias;
        const variant = roll < 0.18 ? "bright" : roll < 0.55 ? "mid" : "dim";
        windows.push({
          cx: b.x + 10 + c * ((b.width - 20) / Math.max(1, b.cols - 1 || 1)),
          cy: y + 8 + f * floorH,
          variant,
          delay: rand() * 10,
          duration: 4 + rand() * 8,
        });
      }
    }

    return { ...b, id: `bld-${bi}`, y, height, windows };
  });
}

const SCENES: { name: SceneName; buildings: ReturnType<typeof buildSkyline> }[] = [
  { name: "dusk", buildings: buildSkyline(1337, SCENE_PALETTES.dusk.litBias, SCENE_PALETTES.dusk.heightJitter) },
  { name: "night", buildings: buildSkyline(7919, SCENE_PALETTES.night.litBias, SCENE_PALETTES.night.heightJitter) },
  { name: "dawn", buildings: buildSkyline(4242, SCENE_PALETTES.dawn.litBias, SCENE_PALETTES.dawn.heightJitter) },
];

const CYCLE_SECONDS = 30;

function SkylineBackground() {
  const segment = CYCLE_SECONDS / SCENES.length;
  return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {SCENES.map((scene, i) => {
          const palette = SCENE_PALETTES[scene.name];
          return (
              <div
                  key={scene.name}
                  className="sky-scene absolute inset-0"
                  style={{ animationDelay: `${-(i * segment)}s` }}
              >
                <div className="absolute inset-0" style={{ background: palette.sky }} />
                <div className="absolute left-0 right-0 bottom-0 h-40" style={{ background: palette.glow }} />
                <svg
                    className="absolute bottom-0 left-0 w-full h-full"
                    viewBox="0 0 1440 400"
                    preserveAspectRatio="xMidYMax slice"
                >
                  {scene.buildings.map((b) => (
                      <g key={b.id}>
                        <rect
                            x={b.x}
                            y={b.y}
                            width={b.width}
                            height={b.height}
                            fill={b.depth === "back" ? "#182647" : "#0A0F1C"}
                            opacity={b.depth === "back" ? 0.75 : 1}
                        />
                        {b.windows.map((w, wi) => (
                            <rect
                                key={wi}
                                x={w.cx}
                                y={w.cy}
                                width={5}
                                height={7}
                                rx={0.5}
                                className={`sky-window sky-window--${w.variant}`}
                                style={{
                                  animationDelay: `${w.delay}s`,
                                  animationDuration: `${w.duration}s`,
                                }}
                                fill="#F2C879"
                            />
                        ))}
                      </g>
                  ))}
                </svg>
              </div>
          );
        })}
      </div>
  );
}

export default async function HomePage() {
  const featuredUnit = await publicUnitApi.getLongestVacant();
  const vacantDays = daysVacant(featuredUnit?.vacatedAt);

  // NOTE: assumes publicUnitApi returns `depositAmount` on the unit DTO,
  // mirroring `rentAmount`. Rename this one line if your field differs.
  const depositAmount = (featuredUnit as { depositAmount?: number } | null)?.depositAmount;

  return (
      <main className="min-h-screen bg-[#F7F5F0] text-[#14213D]">
        <style>{`
        @keyframes skyFlicker {
          0%, 100% { opacity: var(--w-lo); }
          45% { opacity: var(--w-lo); }
          50% { opacity: var(--w-hi); }
          92% { opacity: var(--w-hi); }
        }
        .sky-window {
          animation-name: skyFlicker;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        .sky-window--bright { --w-lo: 0.55; --w-hi: 1; }
        .sky-window--mid { --w-lo: 0.22; --w-hi: 0.6; }
        .sky-window--dim { --w-lo: 0.04; --w-hi: 0.22; }

        @keyframes sceneFade {
          0% { opacity: 0; }
          3% { opacity: 1; }
          ${Math.round((10 / CYCLE_SECONDS) * 100)}% { opacity: 1; }
          ${Math.round((11.5 / CYCLE_SECONDS) * 100)}% { opacity: 0; }
          100% { opacity: 0; }
        }
        .sky-scene {
          animation-name: sceneFade;
          animation-duration: ${CYCLE_SECONDS}s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .sky-window { animation: none; opacity: 0.4; }
          .sky-scene { animation: none; opacity: 1; }
          .sky-scene:not(:first-child) { display: none; }
        }
      `}</style>

        {/* ============ HEADER ============ */}
        <header className="sticky top-0 z-30 bg-[#0A0F1C]/90 backdrop-blur border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
            <span className="relative w-6 h-6 flex-shrink-0">
              <span className="absolute inset-0 rounded-[6px] bg-[#E8A33D]" />
              <span className="absolute inset-0 rounded-[6px] bg-[#C1502E] translate-x-1.5 translate-y-1.5 opacity-90" />
            </span>
              <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-white">
              RentManager
            </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
              <Link href="/listings" className="hover:text-white transition-colors">
                Browse properties
              </Link>
              <Link href="/public/sign-up" className="hover:text-white transition-colors">
                List your property
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                  href="/public/sign-in"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                  href="/public/sign-up"
                  className="text-sm font-semibold px-4 py-2 rounded-md bg-[#E8A33D] text-[#14213D] hover:bg-[#DC9530] transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </header>

        {/* ============ HERO (dark, cycling skyline) ============ */}
        <section className="relative isolate">
          <SkylineBackground />

          <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-28 md:pt-24 md:pb-40 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-7">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[#F2C879] bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Built for the Kenyan rental market
            </span>

              <h1 className="font-[var(--font-display)] text-4xl md:text-5xl font-semibold leading-[1.08] tracking-tight text-white">
                Find a vacant unit.
                <br />
                Reserve it. Move in.
              </h1>

              <p className="text-lg text-white/65 max-w-md leading-relaxed">
                Search verified properties across Kenya, see real vacancies as
                they open up, and secure a unit with a refundable deposit —
                no agent calls, no fake listings.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                    href="/listings"
                    className="px-6 py-3 rounded-md text-base font-semibold bg-[#E8A33D] text-[#14213D] hover:bg-[#DC9530] transition-colors shadow-[0_8px_24px_-8px_rgba(232,163,61,0.6)] text-center"
                >
                  Browse properties
                </Link>
                <Link
                    href="/public/sign-up"
                    className="px-6 py-3 rounded-md text-base font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors text-center"
                >
                  List your property
                </Link>
              </div>
            </div>

            {/* Live unit card preview, sourced from the real backend */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/95 backdrop-blur shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] p-5 space-y-4 max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#5B6472]">
                  {featuredUnit?.propertyArea ?? "Across Kenya"}
                </span>
                  <span className="font-[var(--font-mono)] text-xs font-semibold px-2 py-1 rounded-full bg-[#1F8A55]/10 text-[#1F8A55]">
                  {vacantDays !== null ? `Vacant ${vacantDays}d` : "Vacant now"}
                </span>
                </div>

                {featuredUnit?.images?.[0] ? (
                    <img
                        src={featuredUnit.images[0]}
                        alt={`${featuredUnit.propertyName ?? "Unit"} ${featuredUnit.unitNumber}`}
                        className="h-36 w-full object-cover rounded-lg"
                    />
                ) : (
                    <div className="h-36 rounded-lg bg-gradient-to-br from-[#14213D]/10 to-[#E8A33D]/20" />
                )}

                <div>
                  <p className="font-[var(--font-mono)] text-xl font-semibold">
                    KES {featuredUnit ? featuredUnit.rentAmount.toLocaleString() : "—"}{" "}
                    <span className="text-sm font-normal text-[#5B6472]">/ month</span>
                  </p>
                  <p className="text-sm text-[#5B6472] mt-1">
                    {featuredUnit
                        ? `${featuredUnit.propertyName ?? "Unit"}, Unit ${featuredUnit.unitNumber}`
                        : "No vacant units listed yet"}
                  </p>
                </div>

                <Link
                    href={featuredUnit ? `/listings/${featuredUnit.propertyId}` : "/listings"}
                    className="text-sm font-semibold text-[#C1502E] flex items-center gap-1"
                >
                  {featuredUnit && depositAmount
                      ? `Reserve with KES ${depositAmount.toLocaleString()} deposit →`
                      : "Reserve now →"}
                </Link>
              </div>

              <div className="hidden md:block absolute -bottom-6 -left-8 rounded-xl border border-white/10 bg-white/95 backdrop-blur shadow-md px-4 py-3 text-xs text-[#5B6472] w-44">
                <p className="font-semibold text-[#14213D]">Verified listing</p>
                <p>Owner confirmed by RentManager</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STATS STRIP (continues the dark hero) ============ */}
        <section className="bg-[#0A0F1C] text-white">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { value: "1,240+", label: "vacant units listed" },
              { value: "38", label: "towns & estates covered" },
              { value: "KES 5,000", label: "avg. refundable deposit" },
              { value: "100%", label: "owner-verified listings" },
            ].map((s) => (
                <div key={s.label}>
                  <p className="font-[var(--font-mono)] text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-white/50 mt-1">{s.label}</p>
                </div>
            ))}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-[var(--font-display)] text-2xl md:text-3xl font-semibold text-center mb-14">
            From search to move-in, in three steps
          </h2>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div
                className="hidden md:block absolute top-3 left-[16.6%] right-[16.6%] h-px bg-[#14213D]/10"
                aria-hidden="true"
            />
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
                <div key={item.step} className="space-y-3 relative">
              <span className="font-[var(--font-mono)] text-sm font-semibold text-[#C1502E] bg-[#F7F5F0] pr-2">
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