"use client";

interface AmbientMeshProps {
  /**
   * Layer 2 master toggle. `false` removes the mesh entirely.
   */
  enabled?: boolean;
  /**
   * Drives the slow drift. `false` freezes the mesh on its first frame
   * (blur stays, motion drops) and drops the compositor layer hint.
   */
  isAnimating?: boolean;
}

/**
 * Layer 2 — ambient drifting gradient mesh.
 *
 * Soft, slow-moving brand-tone blobs behind the map so the terrain feels
 * like it is floating in a scene. The blur is baked once on a static,
 * oversized layer; the drift animates ONLY cheap GPU-composited
 * `translate3d()` transforms — never `background-position` or per-frame
 * blur recomputation.
 */
export function AmbientMesh({ enabled = true, isAnimating = false }: AmbientMeshProps) {
  if (!enabled) return null;

  return (
    <div
      className={`ambient-mesh${isAnimating ? " is-animating" : ""}`}
      aria-hidden="true"
    />
  );
}
