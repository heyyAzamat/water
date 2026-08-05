import Image from "next/image";
import { cn } from "@/lib/utils";

/* =================================================================== *
 * Abyss atmosphere
 *
 * The whole underwater look is drawn with gradients and blur rather than
 * imagery: nothing to download, nothing to art-direct per breakpoint, and it
 * recolours with the theme tokens. Three layers stack to make it read as
 * water — shafts of surface light, caustic bloom, drifting plankton.
 * =================================================================== */

/**
 * A real photograph behind the whole section.
 *
 * The drawn layers below (rays, caustics, plankton) sit on top of it, so the
 * scene keeps moving even though the base image is still. It is pushed dark
 * and desaturated on purpose: the photograph is the atmosphere, the copy is
 * the subject, and white text has to stay readable across every crop.
 */
export function PhotoBackdrop({
  src,
  className,
  priority = false,
  dim = 0.62,
  focus = "center",
}: {
  src: string;
  className?: string;
  priority?: boolean;
  /** 0 = untouched photograph, 1 = black. */
  dim?: number;
  /** CSS `object-position`, to keep the subject out from behind the copy. */
  focus?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="scale-105 object-cover"
        style={{
          objectPosition: focus,
          // Deep water is dark and saturated; straight off the camera these
          // frames read milky, which is what makes white type sit badly.
          filter: "brightness(0.72) contrast(1.22) saturate(1.25)",
        }}
      />
      {/* Flat dim, then a vignette that lands the edges on trench black. */}
      <div
        className="absolute inset-0"
        style={{ background: `oklch(0.02 0.004 250 / ${dim})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(105% 75% at 50% 26%, transparent 8%, oklch(0.02 0.004 250 / 0.5) 48%, oklch(0.02 0.004 250 / 0.88) 78%, oklch(0.02 0.004 250) 100%)",
        }}
      />
      {/* A cool cast over the whole frame ties the photograph to the palette. */}
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: "oklch(0.28 0.078 242 / 0.55)" }}
      />
      {/* Fade into whatever section follows. */}
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.02 0.004 250))",
        }}
      />
    </div>
  );
}

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
          opacity: 1.15 * intensity,
          maskImage:
            "radial-gradient(70% 65% at 50% 0%, black 0%, rgba(0,0,0,0.6) 46%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(70% 65% at 50% 0%, black 0%, rgba(0,0,0,0.6) 46%, transparent 82%)",
        }}
      />
      {/* Two bright shafts, splayed, so the light reads as coming through a
          gap above rather than as a flat wash. */}
      {[
        { from: 172, x: "-56%", w: "34rem", o: 1 },
        { from: 186, x: "-30%", w: "26rem", o: 0.7 },
      ].map((shaft, i) => (
        <div
          key={i}
          className="absolute -top-32 left-1/2 h-[130%] animate-breathe"
          style={{
            width: shaft.w,
            transform: `translateX(${shaft.x})`,
            opacity: shaft.o * intensity,
            animationDelay: `${i * -3}s`,
            background: `conic-gradient(from ${shaft.from}deg at 50% 0%, transparent 0deg, oklch(0.92 0.07 203 / 0.3) 5deg, oklch(0.79 0.14 205 / 0.12) 11deg, transparent 19deg)`,
            filter: "blur(26px)",
          }}
        />
      ))}
      {/* The surface itself: a bright band at the very top of the column. */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          opacity: 0.9 * intensity,
          background:
            "linear-gradient(to bottom, oklch(0.86 0.11 202 / 0.22), transparent)",
          filter: "blur(30px)",
        }}
      />
    </div>
  );
}

/**
 * Rock walls closing in from the edges — the "looking up out of a cave"
 * framing. Pure blurred blobs: at this scale and blur, silhouettes read as
 * geology without needing a real photograph.
 */
export function CaveWalls({
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
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        style={{ opacity: 0.95 * intensity }}
      >
        <defs>
          <filter id="cave-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <linearGradient id="cave-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.37 0.09 240)" stopOpacity="0.55" />
            <stop offset="45%" stopColor="oklch(0.095 0.028 247)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="oklch(0.02 0.004 250)" stopOpacity="1" />
          </linearGradient>
        </defs>

        <g filter="url(#cave-blur)" fill="url(#cave-rim)">
          {/* Left wall */}
          <path d="M-40 -40 L330 -40 C300 90 250 150 268 250 C286 350 210 400 236 520 C258 620 180 690 210 840 L-40 840 Z" />
          {/* Right wall */}
          <path d="M1240 -40 L900 -40 C930 100 985 160 962 268 C940 372 1020 420 990 540 C965 640 1040 700 1010 840 L1240 840 Z" />
          {/* Ceiling overhang, leaving the gap the light falls through */}
          <path d="M300 -60 L920 -60 L900 40 C820 92 700 60 610 82 C520 104 420 70 330 34 Z" />
        </g>
      </svg>
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
  { left: 4, size: 2, delay: 0, duration: 30, drift: 0.5 },
  { left: 9, size: 3, delay: 7, duration: 24, drift: 0.9 },
  { left: 14, size: 1.5, delay: 14, duration: 34, drift: 0.4 },
  { left: 19, size: 2.5, delay: 3, duration: 27, drift: 0.7 },
  { left: 25, size: 2, delay: 18, duration: 31, drift: 1 },
  { left: 30, size: 4, delay: 10, duration: 22, drift: 0.6 },
  { left: 35, size: 1.5, delay: 21, duration: 36, drift: 0.8 },
  { left: 40, size: 2, delay: 5, duration: 28, drift: 0.5 },
  { left: 45, size: 2.5, delay: 16, duration: 25, drift: 1 },
  { left: 50, size: 1.5, delay: 9, duration: 33, drift: 0.7 },
  { left: 55, size: 3, delay: 24, duration: 26, drift: 0.4 },
  { left: 60, size: 2, delay: 13, duration: 32, drift: 0.9 },
  { left: 65, size: 3.5, delay: 2, duration: 23, drift: 0.6 },
  { left: 70, size: 1.5, delay: 19, duration: 35, drift: 0.85 },
  { left: 75, size: 2.5, delay: 11, duration: 29, drift: 0.45 },
  { left: 80, size: 2, delay: 26, duration: 21, drift: 1 },
  { left: 85, size: 3, delay: 6, duration: 34, drift: 0.55 },
  { left: 90, size: 1.5, delay: 15, duration: 27, drift: 0.75 },
  { left: 95, size: 2.5, delay: 22, duration: 31, drift: 0.65 },
  { left: 98, size: 2, delay: 4, duration: 25, drift: 0.95 },
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
          className="absolute bottom-0 rounded-full bg-lume-100 animate-rise"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: 0.75,
            filter: "blur(0.4px)",
            boxShadow: "0 0 10px 1px oklch(0.92 0.07 203 / 0.8)",
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
  cave = false,
  photo,
  photoPriority = false,
  photoDim = 0.62,
  photoFocus,
}: {
  className?: string;
  depth?: number;
  rays?: boolean;
  particles?: boolean;
  /** Rock walls closing in from the edges. Drawn only without a photograph. */
  cave?: boolean;
  /** Path to a photograph in `public/photos` to sit behind everything. */
  photo?: string;
  photoPriority?: boolean;
  photoDim?: number;
  photoFocus?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      {photo && (
        <PhotoBackdrop
          src={photo}
          priority={photoPriority}
          dim={photoDim}
          focus={photoFocus}
        />
      )}
      <Caustics intensity={photo ? depth * 0.5 : depth} />
      {rays && <LightShafts intensity={photo ? depth * 0.55 : depth} />}
      {cave && !photo && <CaveWalls intensity={depth} />}
      {particles && <Plankton />}
      {/* Vignette back to trench black so sections never fight each other. */}
      <div
        className="absolute inset-0"
        style={{
          background: photo
            ? "radial-gradient(140% 100% at 50% 18%, transparent 46%, oklch(0.02 0.004 250 / 0.45) 100%)"
            : cave
              ? "radial-gradient(130% 90% at 50% 12%, transparent 34%, oklch(0.02 0.004 250 / 0.6) 100%)"
              : "radial-gradient(120% 80% at 50% 40%, transparent 30%, oklch(0.02 0.004 250 / 0.75) 100%)",
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
