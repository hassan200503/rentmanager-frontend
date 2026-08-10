"use client";

import * as THREE from "three";
import { KENYA_BBOX, KENYA_MAIN_LAND } from "./kenya-outline";

/**
 * Geographic data + geometry builders for the Kenya 3D section.
 *
 * Uses an equirectangular projection centered on Kenya that exactly matches the
 * pre-cropped NASA Blue Marble satellite texture (same lon/lat bounds as
 * TEX_BOUNDS) so the photo lines up with the Natural Earth border outline
 * ("kenya-outline.ts" is a generated file - do not edit).
 */

/** World units per degree of latitude/longitude. */
export const MAP_SCALE = 0.95;
/** Lon/lat bounds baked into the satellite texture (see crop-script). */
export const TEX_BOUNDS = {
  west: 32.7,
  east: 43.9,
  south: -5.9,
  north: 5.9,
} as const;

export const MAP_CENTER_LON = (KENYA_BBOX.west + KENYA_BBOX.east) / 2;
export const MAP_CENTER_LAT = (KENYA_BBOX.south + KENYA_BBOX.north) / 2;

/** Top of the country plateau (world Y). Everything sits above this. */
export const PLATEAU_TOP = 0.03;
export const PLATEAU_DEPTH = 0.42;

/** lon/lat -> shape plane coordinates (x = east, y = north). */
export function lonLatToShape(lon: number, lat: number): THREE.Vector2 {
  return new THREE.Vector2((lon - MAP_CENTER_LON) * MAP_SCALE, (lat - MAP_CENTER_LAT) * MAP_SCALE);
}

/** lon/lat -> world position (x = east, z = north, +y = up). */
export function lonLatToWorld(lon: number, lat: number, y = 0): THREE.Vector3 {
  return new THREE.Vector3((lon - MAP_CENTER_LON) * MAP_SCALE, y, (lat - MAP_CENTER_LAT) * MAP_SCALE);
}

/** lon/lat -> UV in the satellite texture. */
export function lonLatToUv(lon: number, lat: number): [number, number] {
  return [((lon - TEX_BOUNDS.west) / (TEX_BOUNDS.east - TEX_BOUNDS.west)), (1 - (lat - TEX_BOUNDS.south) / (TEX_BOUNDS.north - TEX_BOUNDS.south))];
}

export interface CityDef {
  name: string;
  description: string;
  population: string;
  lon: number;
  lat: number;
  color: string;
  importance: number;
}

/** Real WGS84 city-centres. */
export const CITIES: CityDef[] = [
  { name: "Nairobi", description: "Capital city · 4M+ residents", population: "4.3M", lon: 36.8219, lat: -1.2921, color: "#6EE7B7", importance: 1.4 },
  { name: "Mombasa", description: "Coastal metropolis", population: "1.2M", lon: 39.6682, lat: -4.0435, color: "#34D399", importance: 1.15 },
  { name: "Kisumu", description: "Lakeside city", population: "610K", lon: 34.768, lat: -0.0917, color: "#34D399", importance: 0.95 },
  { name: "Nakuru", description: "Rift Valley hub", population: "570K", lon: 36.0746, lat: -0.2827, color: "#34D399", importance: 0.85 },
  { name: "Eldoret", description: "North Rift economic center", population: "475K", lon: 35.2699, lat: 0.5204, color: "#34D399", importance: 0.8 },
];

/**
 * The great corridor the Mercedes-Benz follows (real Kenya roads east-west),
 * closed as a loop so the car never stops driving.
 */
export const ROUTE_WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [39.67, -4.04], // Mombasa
  [38.2, -2.9], // Tsavo
  [36.82, -1.29], // Nairobi
  [36.43, -0.72], // Naivasha
  [36.07, -0.28], // Nakuru
  [35.27, 0.52], // Eldoret
  [34.74, -0.1], // Kisumu
  [35.98, -1.08], // Narok
  [37.19, -2.65], // Amboseli
  [38.56, -3.4], // Voi
];

let routeCurve: THREE.CatmullRomCurve3 | null = null;

/** Lazy singleton spline (client-only; safe under multiple calls). */
export function getRouteCurve(): THREE.CatmullRomCurve3 {
  if (!routeCurve) {
    routeCurve = new THREE.CatmullRomCurve3(
      ROUTE_WAYPOINTS.map(([lon, lat]) => lonLatToWorld(lon, lat, 0)),
      true, // closed loop
      "catmullrom",
      0.32
    );
  }
  return routeCurve;
}

let borderCurve: THREE.CatmullRomCurve3 | null = null;

/**
 * Closed spline tracing Kenya's national border (coastline + land borders),
 * from the same generated Natural Earth outline as the terrain, so the car
 * drives exactly along the visible country edge. Arc-length parameterised.
 */
export function getBorderCurve(): THREE.CatmullRomCurve3 {
  if (!borderCurve) {
    borderCurve = new THREE.CatmullRomCurve3(
      KENYA_MAIN_LAND.map(([lon, lat]) => lonLatToWorld(lon, lat, 0)),
      true, // closed loop
      "centripetal",
      0.5
    );
  }
  return borderCurve;
}

export function buildCountryShape(): THREE.Shape {
  const shape = new THREE.Shape();
  KENYA_MAIN_LAND.forEach(([lon, lat], i) => {
    const p = lonLatToShape(lon, lat);
    if (i === 0) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  });
  shape.closePath();
  return shape;
}

/** Mapped top face ONLY (flat, per-vertex UVs aligned to the satellite). */
export function buildCountryTopGeometry(): THREE.BufferGeometry {
  const pairs = KENYA_MAIN_LAND;
  const pts = pairs.map(([lon, lat]) => lonLatToShape(lon, lat));
  const tris = THREE.ShapeUtils.triangulateShape(pts, []);
  const pos: number[] = [];
  const uv: number[] = [];

  for (const [a, b, c] of tris) {
    for (const idx of [a, b, c]) {
      pos.push(pts[idx].x, PLATEAU_TOP, pts[idx].y);
      uv.push(...lonLatToUv(pairs[idx][0], pairs[idx][1]));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Solid country plateau: top + walls + bottom with correct outward normals.
 * Used for the "satellite photo on a lit slab" premium look.
 */
export function buildCountryPlateauGeometry(): THREE.BufferGeometry {
  const pts = KENYA_MAIN_LAND.map(([lon, lat]) => lonLatToShape(lon, lat));
  const tris = THREE.ShapeUtils.triangulateShape(pts, []);
  const pos: number[] = [];
  const np = pts.length;
  const D = PLATEAU_DEPTH;
  const T = PLATEAU_TOP;

  // Top
  for (const [a, b, c] of tris) {
    pos.push(pts[a].x, T, pts[a].y, pts[b].x, T, pts[b].y, pts[c].x, T, pts[c].y);
  }
  // Walls
  for (let i = 0; i < np; i++) {
    const j = (i + 1) % np;
    const p1 = pts[i];
    const p2 = pts[j];
    pos.push(p1.x, T - D, p1.y, p2.x, T, p2.y, p1.x, T, p1.y); // outward wind
    pos.push(p1.x, T - D, p1.y, p2.x, T - D, p2.y, p2.x, T, p2.y);
  }
  // Bottom (inverted)
  for (const [a, b, c] of tris) {
    pos.push(pts[a].x, T - D, pts[a].y, pts[c].x, T - D, pts[c].y, pts[b].x, T - D, pts[b].y);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Outline as world-space points (for the glowing border). */
export function buildBorderPoints(y = 0.03): THREE.Vector3[] {
  return KENYA_MAIN_LAND.map(([lon, lat]) => lonLatToWorld(lon, lat, y));
}

/* ---- Procedural relief ---------------------------------------------
   Kenya's real topography rebuilt as a deterministic height field so
   the satellite photo gains genuine 3D shape with zero external
   assets: tectonic-noise plains, the Central Highlands (Mt Kenya +
   Aberdares), the Rift Valley trough, western shield volcanoes and a
   coastal belt that falls away to the Indian Ocean. */

/** Relief amplitude above the plateau top, in world units. */
export const RELIEF_HEIGHT = 0.36;

/** Folded integer hash - deterministic across platforms. */
function hash2(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number): number {
  return (
    smoothNoise(x, y) * 0.62 +
    smoothNoise(x * 2.07 + 13.7, y * 2.07 + 2.9) * 0.26 +
    smoothNoise(x * 4.33 - 7.3, y * 4.33 + 11.2) * 0.12
  );
}

/** Radial highland dome (elliptical gaussian). */
function dome(lon: number, lat: number, cx: number, cy: number, radius: number): number {
  const dx = (lon - cx) / radius;
  const dy = (lat - cy) / (radius * 0.82);
  return Math.exp(-(dx * dx + dy * dy) * 2.1);
}

/** Falloff from a local segment (rift ridge / trough). */
function ridgeFalloff(
  lon: number,
  lat: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number
): number {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : THREE.MathUtils.clamp(((lon - ax) * vx + (lat - ay) * vy) / len2, 0, 1);
  const px = ax + vx * t;
  const py = ay + vy * t;
  const dx = (lon - px) / width;
  const dy = (lat - py) / (width * 0.7);
  return Math.exp(-(dx * dx + dy * dy) * 1.8);
}

/** Normalised elevation 0..1 for any lon/lat. Pure math, no allocation. */
export function elevationAt(lon: number, lat: number): number {
  // Rolling plains backbone
  let h = 0.06 + fbm(lon * 0.5, lat * 0.5) * 0.3;

  // Central Highlands - Mt Kenya, Aberdares and the southern escarpments
  h += dome(lon, lat, 37.32, -0.16, 1.15) * 0.52;
  h += dome(lon, lat, 36.72, -0.62, 0.4) * 0.3;
  h += dome(lon, lat, 36.52, -1.12, 0.34) * 0.22;
  h += ridgeFalloff(lon, lat, 36.52, -0.8, 36.88, -0.28, 0.26) * 0.18;

  // Western highlands - Mt Elgon, Cherangani, Nandi
  h += dome(lon, lat, 34.57, 1.06, 0.72) * 0.28;
  h += dome(lon, lat, 35.4, 0.85, 0.6) * 0.16;
  h += dome(lon, lat, 35.55, -0.1, 0.5) * 0.1;

  // Rift Valley floor - trough carved between the shields
  h -= ridgeFalloff(lon, lat, 36.12, -1.2, 36.32, 0.5, 0.3) * 0.13;

  // Great Lakes depressions - Victoria (west) and Turkana (north)
  h -= dome(lon, lat, 33.95, -0.62, 0.62) * 0.3;
  h -= dome(lon, lat, 36.2, 3.15, 1.1) * 0.14;

  // Coastal belt - elevation evaporates toward the Indian Ocean
  const coastLon = 39.55 + (lat + 4.05) * 0.42;
  const coastGain = THREE.MathUtils.clamp((coastLon - lon) / 2.4, 0, 1);
  h *= 0.3 + 0.7 * coastGain;

  // Fine-grain modulation (rocky highland texture)
  h *= 0.88 + 0.24 * fbm(lon * 1.9 + 31.7, lat * 1.9 + 4.1);

  return THREE.MathUtils.clamp(h, 0, 1);
}

/** World Y of the terrain surface at a lon/lat. */
export function terrainHeightAt(lon: number, lat: number): number {
  return PLATEAU_TOP + elevationAt(lon, lat) * RELIEF_HEIGHT;
}

/** World Y of the terrain surface at a world (x, z) point. */
export function terrainHeightAtWorld(x: number, z: number): number {
  return terrainHeightAt(x / MAP_SCALE + MAP_CENTER_LON, z / MAP_SCALE + MAP_CENTER_LAT);
}

/** Border ring lifted onto the terrain (so the glow rides the ridges). */
export function buildBorderPointsOnTerrain(yOffset: number): THREE.Vector3[] {
  return KENYA_MAIN_LAND.map(([lon, lat]) =>
    lonLatToWorld(lon, lat, terrainHeightAt(lon, lat) + yOffset)
  );
}

/* ---- Relief mesh ----------------------------------------------
   Dense lon/lat grid clipped to the national outline. Interior
   cells become a displaced, texture-mapped surface; boundary cells
   spawn vertical skirt quads so the slab stays water-tight. */

const RELIEF_CELLS_X = 200;
const RELIEF_CELLS_Y = 208;

/** Ray-cast point-in-polygon against the national outline. */
function pointInKenya(lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = KENYA_MAIN_LAND.length - 1; i < KENYA_MAIN_LAND.length; j = i++) {
    const xi = KENYA_MAIN_LAND[i][0];
    const yi = KENYA_MAIN_LAND[i][1];
    const xj = KENYA_MAIN_LAND[j][0];
    const yj = KENYA_MAIN_LAND[j][1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export interface ReliefGeometry {
  surface: THREE.BufferGeometry;
  skirt: THREE.BufferGeometry;
}

export function buildReliefGeometry(): ReliefGeometry {
  const nx = RELIEF_CELLS_X + 1;
  const ny = RELIEF_CELLS_Y + 1;
  const lons = new Float32Array(nx);
  const lats = new Float32Array(ny);
  for (let i = 0; i < nx; i++) {
    lons[i] = TEX_BOUNDS.west + (TEX_BOUNDS.east - TEX_BOUNDS.west) * (i / RELIEF_CELLS_X);
  }
  for (let j = 0; j < ny; j++) {
    lats[j] = TEX_BOUNDS.south + (TEX_BOUNDS.north - TEX_BOUNDS.south) * (j / RELIEF_CELLS_Y);
  }

  // Per-corner data: inside flag, height, position, uv
  const inFlags = new Uint8Array(nx * ny);
  const pos = new Float32Array(nx * ny * 3);
  const uv = new Float32Array(nx * ny * 2);
  const UVX = TEX_BOUNDS.east - TEX_BOUNDS.west;
  const UVY = TEX_BOUNDS.north - TEX_BOUNDS.south;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const lon = lons[i];
      const lat = lats[j];
      inFlags[k] = pointInKenya(lon, lat) ? 1 : 0;
      pos[k * 3] = (lon - MAP_CENTER_LON) * MAP_SCALE;
      pos[k * 3 + 1] = terrainHeightAt(lon, lat);
      pos[k * 3 + 2] = (lat - MAP_CENTER_LAT) * MAP_SCALE;
      uv[k * 2] = (lon - TEX_BOUNDS.west) / UVX;
      uv[k * 2 + 1] = 1 - (lat - TEX_BOUNDS.south) / UVY;
    }
  }

  const indices: number[] = [];
  const skirtPos: number[] = [];
  const skirtIndices: number[] = [];
  const baseY = PLATEAU_TOP - PLATEAU_DEPTH;
  const skirtEdges = new Set<number>();
  const edgeKey = (p: number, q: number) => Math.min(p, q) * 2097152 + Math.max(p, q);

  const cell = (i: number, j: number): number => j * nx + i;

  const pushTri = (v0: number, v1: number, v2: number, out: number[]) => {
    const ux = pos[v1 * 3] - pos[v0 * 3];
    const uz = pos[v1 * 3 + 2] - pos[v0 * 3 + 2];
    const vx = pos[v2 * 3] - pos[v0 * 3];
    const vz = pos[v2 * 3 + 2] - pos[v0 * 3 + 2];
    const nz = ux * vz - uz * vx;
    if (nz > 0) out.push(v0, v1, v2);
    else out.push(v0, v2, v1);
  };

  for (let j = 0; j < RELIEF_CELLS_Y; j++) {
    for (let i = 0; i < RELIEF_CELLS_X; i++) {
      const a = cell(i, j);
      const b = cell(i + 1, j);
      const c = cell(i + 1, j + 1);
      const d = cell(i, j + 1);
      const ia = inFlags[a] === 1;
      const ib = inFlags[b] === 1;
      const ic = inFlags[c] === 1;
      const id = inFlags[d] === 1;
      const inCount = Number(ia) + Number(ib) + Number(ic) + Number(id);

      if (inCount === 4) {
        pushTri(a, c, b, indices);
        pushTri(a, d, c, indices);
      } else if (inCount === 3) {
        // Surface triangle across the three inside corners
        const inside = [ia, ib, ic, id];
        const corners = [a, b, c, d] as const;
        const star = inside[0] && inside[1] && inside[2] ? [0, 1, 2] : inside[0] && inside[1] && inside[3] ? [0, 1, 3] : inside[0] && inside[2] && inside[3] ? [0, 2, 3] : [1, 2, 3];
        pushTri(corners[star[0]], corners[star[1]], corners[star[2]], indices);
      }

      if (inCount > 0 && inCount < 4) {
        const inside = [ia, ib, ic, id];
        const corners = [a, b, c, d];
        for (let e = 0; e < 4; e++) {
          const p = corners[e];
          const q = corners[(e + 1) % 4];
          if (inside[e] === inside[(e + 1) % 4]) continue;
          const key = edgeKey(p, q);
          if (skirtEdges.has(key)) continue;
          skirtEdges.add(key);

          // Crossing edge: top at both corner heights, bottom at baseY
          const v0 = skirtPos.length / 3;
          skirtPos.push(
            pos[p * 3], pos[p * 3 + 1], pos[p * 3 + 2],
            pos[q * 3], pos[q * 3 + 1], pos[q * 3 + 2],
            pos[q * 3], baseY, pos[q * 3 + 2],
            pos[p * 3], baseY, pos[p * 3 + 2]
          );

          // Outward normal: cross(edge, up), flipped away from map centre
          const ex = pos[q * 3] - pos[p * 3];
          const ez = pos[q * 3 + 2] - pos[p * 3 + 2];
          const mx = (pos[p * 3] + pos[q * 3]) / 2;
          const mz = (pos[p * 3 + 2] + pos[q * 3 + 2]) / 2;
          const s = -ez * mx + ex * mz >= 0 ? 1 : -1;

          // Tri (v0,v1,v2) normal = (hq - base) * (ez, 0, -ex); its dot with
          // the outward normal is -s*(ex^2+ez^2), so s=+1 needs (0,2,1).
          if (s === 1) {
            skirtIndices.push(v0, v0 + 2, v0 + 1, v0, v0 + 3, v0 + 2);
          } else {
            skirtIndices.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
          }
        }
      }
    }
  }

  const surface = new THREE.BufferGeometry();
  surface.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  surface.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  surface.setIndex(indices);
  surface.computeVertexNormals();

  const skirt = new THREE.BufferGeometry();
  skirt.setAttribute("position", new THREE.Float32BufferAttribute(skirtPos, 3));
  skirt.setIndex(skirtIndices);
  skirt.computeVertexNormals();

  return { surface, skirt };
}