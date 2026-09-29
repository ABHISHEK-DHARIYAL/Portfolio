"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useIsMobile, useWebglSupported } from "./useSceneCapability";

/**
 * "Infinite Tunnel" — a Zooming User Interface (ZUI) style hero scene,
 * replacing the previous "Orbital Core" motif entirely (per request).
 * Instead of objects orbiting a fixed camera, this is a continuous dive
 * through nested rings receding into the distance — the camera stays
 * put; the rings are what move, endlessly recycled from far to near so
 * the tunnel never visibly "ends" or repeats in an obvious loop.
 *
 * How the infinite recycling works: RingTunnel keeps each ring's z
 * position in a plain ref array (NOT React state — this updates every
 * frame, and re-rendering React for that would be wasteful). Every
 * frame, each ring's z increases (moving toward the camera). Once a
 * ring passes a near threshold, its z jumps back by the tunnel's total
 * depth — instantly placing it at the far end again — rather than being
 * destroyed and recreated. Because fog fades rings out well before they
 * reach that threshold (see fogFar below), the jump itself is never
 * visible; it happens off in the fog.
 *
 * THEME AWARENESS: colors come from PALETTE, keyed by the current theme
 * (useTheme()) — background, fog, ring colors, sparkle color, light
 * intensities. Geometry/motion is identical in both themes.
 *
 * DEVICE AWARENESS: useIsMobile() reduces ring count, tunnel depth, and
 * sparkle count on small/touch screens, and the top-level HeroScene
 * component lowers DPR and disables antialiasing there too — same
 * pattern the previous scene used.
 */

const PALETTE = {
  dark: {
    background: "#050816",
    fogColor: "#050816",
    ambientIntensity: 0.6,
    beacon: "#a78bfa",
    ringColors: ["#7C3AED", "#3B82F6", "#22D3EE"],
    ringOpacity: 0.75,
    sparkleColor: "#a78bfa",
    sparkleOpacity: 0.55,
    pointLight1: "#7C3AED",
    pointLight2: "#3B82F6",
    pointLightIntensity1: 35,
    pointLightIntensity2: 20,
  },
  light: {
    background: "#fcfcff",
    fogColor: "#fcfcff",
    ambientIntensity: 0.9,
    beacon: "#7C3AED",
    ringColors: ["#6D28D9", "#2563EB", "#0891B2"],
    ringOpacity: 0.65,
    sparkleColor: "#7C3AED",
    sparkleOpacity: 0.4,
    pointLight1: "#7C3AED",
    pointLight2: "#3B82F6",
    pointLightIntensity1: 18,
    pointLightIntensity2: 12,
  },
} as const;

type Palette = (typeof PALETTE)["dark"];

const NEAR_Z = 4; // roughly where the camera sits — a ring recycles once it passes this

type TunnelConfig = {
  ringCount: number;
  spacing: number;
  speed: number;
};

/** The recycled ring stream itself. */
function RingTunnel({ palette, config }: { palette: Palette; config: TunnelConfig }) {
  const { ringCount, spacing, speed } = config;
  const depth = ringCount * spacing;

  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const zValues = useRef<number[]>(
    Array.from({ length: ringCount }, (_, i) => NEAR_Z - (i + 1) * spacing)
  );

  useFrame((_, delta) => {
    for (let i = 0; i < ringCount; i++) {
      zValues.current[i] += delta * speed;
      if (zValues.current[i] > NEAR_Z) {
        zValues.current[i] -= depth;
      }
      const g = groupRefs.current[i];
      if (g) {
        g.position.z = zValues.current[i];
        g.rotation.z += delta * 0.12 * (i % 2 === 0 ? 1 : -1);
      }
    }
  });

  return (
    <>
      {Array.from({ length: ringCount }).map((_, i) => {
        const radius = 1.5 + (i % 3) * 0.18;
        const color = palette.ringColors[i % palette.ringColors.length];
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
          >
            <mesh>
              <torusGeometry args={[radius, 0.02, 8, 48]} />
              <meshBasicMaterial color={color} transparent opacity={palette.ringOpacity} />
            </mesh>
            {/* faint inner disc so each ring reads as a "portal slice," not just an outline */}
            <mesh>
              <ringGeometry args={[radius * 0.05, radius - 0.05, 48]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.04}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/** A small pulsing wireframe marker way out at the vanishing point — a focal target for the dive, not part of the recycled stream. */
function Beacon({ palette, depth }: { palette: Palette; depth: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.15;
      ref.current.scale.setScalar(pulse);
      ref.current.rotation.y += 0.003;
      ref.current.rotation.x += 0.0015;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -depth]}>
      <icosahedronGeometry args={[0.4, 1]} />
      <meshBasicMaterial color={palette.beacon} wireframe transparent opacity={0.6} />
    </mesh>
  );
}

function Rig({ palette, config }: { palette: Palette; config: TunnelConfig }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!group.current) return;
    // Gentler parallax than the old orbital scene on purpose — the
    // forward motion already reads as strongly directional, so a big
    // mouse-driven tilt on top of it would feel disorienting rather
    // than interactive.
    const targetY = (state.mouse.x * Math.PI) / 18;
    const targetX = (-state.mouse.y * Math.PI) / 26;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04;
  });

  return (
    <group ref={group} scale={viewport.width < 6 ? 0.85 : 1}>
      <RingTunnel palette={palette} config={config} />
      <Beacon palette={palette} depth={config.ringCount * config.spacing} />
    </group>
  );
}

function SceneContents() {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const palette = PALETTE[theme];

  const config: TunnelConfig = isMobile
    ? { ringCount: 7, spacing: 2.3, speed: 2.6 }
    : { ringCount: 12, spacing: 2, speed: 3.5 };

  // Fog fades rings into the background well before they'd reach the
  // recycle point at the far end of the tunnel — that's what hides the
  // "jump back to the start" from ever being visible.
  const fogFar = config.ringCount * config.spacing * 0.75;

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fogColor, 1.5, fogFar]} />
      <ambientLight intensity={palette.ambientIntensity} />
      <pointLight position={[3, 3, 3]} intensity={palette.pointLightIntensity1} color={palette.pointLight1} />
      <pointLight position={[-3, -2, 2]} intensity={palette.pointLightIntensity2} color={palette.pointLight2} />

      <Suspense fallback={null}>
        <Rig palette={palette} config={config} />
        <Sparkles
          count={isMobile ? 25 : 60}
          scale={[7, 4, 4]}
          size={2}
          speed={0.25}
          color={palette.sparkleColor}
          opacity={palette.sparkleOpacity}
        />
      </Suspense>
    </>
  );
}

/** Plain CSS fallback for devices that can't create a WebGL context — never leaves the hero blank. */
function CssFallbackGlow() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 animate-[spin_50s_linear_infinite] opacity-60 [background:conic-gradient(from_0deg_at_50%_50%,#7C3AED33,transparent_25%,#3B82F633,transparent_50%,#7C3AED33,transparent_75%,#3B82F633)]"
    />
  );
}

export default function HeroScene() {
  const isMobile = useIsMobile();
  const webglSupported = useWebglSupported();

  // Not checked yet (first paint) or genuinely unsupported: skip the
  // Canvas entirely rather than let R3F attempt (and potentially throw
  // trying) to acquire a context that isn't there.
  if (webglSupported === false) {
    return <CssFallbackGlow />;
  }
  if (webglSupported === null) {
    return null; // brief instant before the capability check resolves — Hero's own background covers this
  }

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={isMobile ? [1, 1.3] : [1, 1.75]}
      camera={{ position: [0, 0.3, 5], fov: 45 }}
      gl={{ antialias: !isMobile, alpha: true }}
    >
      <SceneContents />
    </Canvas>
  );
}
