"use client";

/**
 * Layer 1 — static film grain.
 *
 * Purely presentational: a single static turbulence tile (inline data-URI,
 * zero network requests) that breaks up flat gradients. Deliberately NOT
 * animated — animated grain forces constant repaints for negligible gain.
 */
export function GrainOverlay() {
  return <div className="coverage-grain" aria-hidden="true" />;
}
