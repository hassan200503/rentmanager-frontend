"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/**
 * Camera intro for the map: when the scene first comes into view, the camera
 * dollies in from an elevated angle down to the hero view — like a film
 * establishing shot. User controls are locked until the move completes.
 * Plays once per mount (the scene only mounts when scrolled into view).
 */

const START_POS = new THREE.Vector3(0.7, 6.9, 11.4);
const END_POS = new THREE.Vector3(0.2, 5.4, 9.5);
const START_TARGET = new THREE.Vector3(0, 0.6, 0);
const END_TARGET = new THREE.Vector3(0, 0, 0);
const DURATION = 2.6;

export function CinematicIntro({ enabled }: { enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const state = useRef({ t: 0, done: false, initialized: false });

  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, rawDelta) => {
    if (!enabled || state.current.done) return;
    const s = state.current;

    if (!s.initialized) {
      s.initialized = true;
      camera.position.copy(START_POS);
      if (controls) {
        controls.target.copy(START_TARGET);
        // eslint-disable-next-line react-hooks/immutability
        controls.enabled = false;
      }
    }

    const dt = Math.min(rawDelta, 0.05);
    s.t = Math.min(1, s.t + dt / DURATION);
    const e = 1 - Math.pow(1 - s.t, 3); // easeOutCubic

    camera.position.lerpVectors(START_POS, END_POS, e);
    if (controls) {
      controls.target.lerpVectors(START_TARGET, END_TARGET, e);
      controls.update();
    }

    if (s.t >= 1) {
      s.done = true;
      if (controls) controls.enabled = true;
    }
  });

  return null;
}
