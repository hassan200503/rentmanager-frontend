"use client";

/**
 * Optimized skyline: a single dusk scene with twinkling windows.
 * Replaces the original 3-scene crossfade (~1300 animated SVG nodes) with
 * one scene (~430 nodes + CSS opacity flicker only), and drops the
 * scroll-driven parallax that re-rendered the whole page on every scroll.
 */

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
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Window = {
  cx: number;
  cy: number;
  variant: "bright" | "mid" | "dim";
  delay: number;
  duration: number;
};

type SkylineBuilding = Building & {
  id: string;
  y: number;
  height: number;
  windows: Window[];
};

const GROUND_Y = 340;
const FLOOR_H = 12;

function buildScene(seed: number) {
  const rand = mulberry32(seed);
  return LAYOUT.map((b, index) => {
    const height = b.floors * FLOOR_H;
    const y = GROUND_Y - height;
    const windows: Window[] = [];
    for (let f = 0; f < b.floors; f++) {
      for (let c = 0; c < b.cols; c++) {
        if (rand() < 0.08) continue;
        const roll = rand();
        const variant: Window["variant"] = roll < 0.22 ? "bright" : roll < 0.55 ? "mid" : "dim";
        windows.push({
          cx: b.x + 10 + c * ((b.width - 20) / Math.max(1, b.cols - 1)),
          cy: y + 8 + f * FLOOR_H,
          variant,
          delay: rand() * 12,
          duration: 4 + rand() * 8,
        });
      }
    }
    return { ...b, id: `bld-${((seed + index * 7919) % 10000)}`, y, height, windows };
  });
}

const SCENE: SkylineBuilding[] = buildScene(1337);

export function SkylineBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0A0F1C 0%, #101A31 55%, #16213D 100%)" }} />
      <div
        className="absolute left-0 right-0 bottom-0 h-40"
        style={{ background: "linear-gradient(180deg, rgba(5,150,105,0) 0%, rgba(5,150,105,0.12) 100%)" }}
      />
      <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice">
        {SCENE.map((b) => (
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
                key={`${b.id}-w${wi}`}
                x={w.cx}
                y={w.cy}
                width={5}
                height={7}
                rx={0.5}
                className={`sky-window sky-window--${w.variant}`}
                style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.duration}s` }}
                fill="#F2C879"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}