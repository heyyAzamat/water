import { cn } from "@/lib/utils";

/* =================================================================== *
 * Abyss atmosphere
 *
 * The whole underwater look is drawn with gradients and blur rather than
 * imagery: nothing to download, nothing to art-direct per breakpoint, and it
 * recolours with the theme tokens. Three layers stack to make it read as
 * water — shafts of surface light, caustic bloom, drifting plankton.
 * =================================================================== */

/** Shafts of light falling from the surface. */
export function LightShafts({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute -top-1/3 left-1/2 h-[150%] w-[150%] -translate-x-1/2 god-rays animate-ray origin-top"
        style={{
          opacity: 0.9 * intensity,
          maskImage:
            "radial-gradient(60% 55% at 50% 0%, black 0%, rgba(0,0,0,0.55) 42%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(60% 55% at 50% 0%, black 0%, rgba(0,0,0,0.55) 42%, transparent 78%)",
        }}
      />
      {/* A single brighter shaft to give the light a source. */}
      <div
        className="absolute -top-24 left-1/2 h-[120%] w-[38rem] -translate-x-1/2 animate-breathe"
        style={{
          opacity: 0.75 * intensity,
          background:
            "conic-gradient(from 175deg at 50% 0%, transparent 0deg, oklch(0.86 0.11 202 / 0.16) 6deg, oklch(0.79 0.14 205 / 0.05) 12deg, transparent 20deg)",
          filter: "blur(28px)",
        }}
      />
    </div>
  );
}

/** Soft rippling bloom, as if light were refracting through the surface. */
export function Caustics({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-[-20%] caustics animate-caustic blur-3xl"
        style={{ opacity: 0.85 * intensity }}
      />
      <div
        className="absolute inset-[-25%] caustics animate-caustic blur-3xl"
        style={{
          opacity: 0.5 * intensity,
          animationDelay: "-14s",
          transform: "scaleX(-1)",
        }}
      />
    </div>
  );
}

/**
 * Drifting particles. Positions are a fixed table rather than `Math.random()`
 * so the server and client markup agree — a random layout would hydrate as a
 * mismatch and flash.
 */
const PARTICLES = [
  { left: 6, size: 2, delay: 0, duration: 30, drift: 0.5 },
  { left: 14, size: 3, delay: 7, duration: 24, drift: 0.9 },
  { left: 23, size: 1.5, delay: 14, duration: 34, drift: 0.4 },
  { left: 31, size: 2.5, delay: 3, duration: 27, drift: 0.7 },
  { left: 39, size: 2, delay: 18, duration: 31, drift: 1 },
  { left: 47, size: 3.5, delay: 10, duration: 22, drift: 0.6 },
  { left: 55, size: 1.5, delay: 21, duration: 36, drift: 0.8 },
  { left: 63, size: 2, delay: 5, duration: 28, drift: 0.5 },
  { left: 71, size: 2.5, delay: 16, duration: 25, drift: 1 },
  { left: 79, size: 1.5, delay: 9, duration: 33, drift: 0.7 },
  { left: 87, size: 3, delay: 24, duration: 26, drift: 0.4 },
  { left: 94, size: 2, delay: 13, duration: 32, drift: 0.9 },
] as const;

export function Plankton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {PARTICLES.map((particle, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-lume-200 animate-rise"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: 0.5,
            filter: "blur(0.5px)",
            boxShadow: "0 0 8px oklch(0.92 0.07 203 / 0.7)",
            animationDelay: `-${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            ["--drift" as string]: particle.drift,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The full stack, for sections that should feel submerged.
 * `depth` dims everything at once — deeper sections get less light.
 */
export function AbyssBackdrop({
  className,
  depth = 1,
  rays = true,
  particles = false,
}: {
  className?: string;
  depth?: number;
  rays?: boolean;
  particles?: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      <Caustics intensity={depth} />
      {rays && <LightShafts intensity={depth} />}
      {particles && <Plankton />}
      {/* Vignette back to trench black so sections never fight each other. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, transparent 30%, oklch(0.02 0.004 250 / 0.75) 100%)",
        }}
      />
    </div>
  );
}

/**
 * Thin horizontal rule that fades in from both ends — used between editorial
 * blocks where a solid border would read as a box.
 */
export function FadeRule({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-px w-full bg-gradient-to-r from-transparent via-white/14 to-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

/** Small uppercase mark, the "First edition / 2025" device from the reference. */
export function EditionMark({
  left,
  right,
  className,
}: {
  left: string;
  right: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 eyebrow-mark",
        className,
      )}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
