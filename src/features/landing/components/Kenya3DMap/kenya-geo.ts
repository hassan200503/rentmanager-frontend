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