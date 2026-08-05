import type { PollutionTag } from "@/types";
import { seededRandom } from "@/lib/utils";

/**
 * Imagery for the bundled demo dataset.
 *
 * Reports are photographs, so the seed data uses photographs: a small library
 * of freely-licensed water pictures ships in `public/photos` and each sample
 * report is matched to one whose condition actually resembles its score — a
 * critical report shows polluted water, a clean one shows clear water. Credits
 * and licences live in `public/photos/CREDITS.md` and the site footer.
 *
 * The procedural SVG generator below is kept as the fallback for real uploads
 * that arrive without a stored image (demo mode has nowhere to put the file).
 */

/** Grouped by what the water looks like, not by where it was taken. */
const PHOTOS = {
  clean: ["clean-1", "clean-2", "clean-3", "river-1"],
  murky: ["river-2", "clean-3", "river-1"],
  algae: ["algae-1", "algae-2", "algae-3", "algae-4"],
  dirty: ["dirty-1", "dirty-2", "dirty-3", "dirty-4", "dirty-5"],
} as const;

const ALGAL_TAGS: PollutionTag[] = ["algae_bloom", "eutrophication"];
const FILTHY_TAGS: PollutionTag[] = [
  "oil_film",
  "industrial_discharge",
  "sewage",
  "plastic",
  "floating_garbage",
  "dead_fish",
  "construction_debris",
];

/**
 * Deterministic photo for a report: same seed always yields the same picture,
 * so the demo dataset is stable across renders and machines.
 */
export function samplePhoto(
  seed: string,
  score: number,
  tags: PollutionTag[] = [],
): string {
  const algal = tags.some((t) => ALGAL_TAGS.includes(t));
  const filthy = tags.some((t) => FILTHY_TAGS.includes(t));

  const bucket =
    score >= 66 && filthy
      ? PHOTOS.dirty
      : algal && score >= 35
        ? PHOTOS.algae
        : score >= 66
          ? PHOTOS.dirty
          : score >= 34
            ? PHOTOS.murky
            : PHOTOS.clean;

  const pick = bucket[Math.floor(seededRandom(seed) * bucket.length) % bucket.length];
  return `/photos/${pick}.jpg`;
}

interface Palette {
  deep: string;
  mid: string;
  shallow: string;
  sky: string;
}

const CLEAN: Palette = {
  deep: "#0b3d4f",
  mid: "#14657d",
  shallow: "#2a9db4",
  sky: "#8fd4e0",
};

const ALGAL: Palette = {
  deep: "#1c3a1a",
  mid: "#3f6b25",
  shallow: "#7fa832",
  sky: "#c3d97a",
};

const SEDIMENT: Palette = {
  deep: "#3a2a18",
  mid: "#6b4c26",
  shallow: "#9c7440",
  sky: "#cbab7d",
};

const OIL: Palette = {
  deep: "#0a0d16",
  mid: "#1d2033",
  shallow: "#3b3455",
  sky: "#6d5f86",
};

const CHEMICAL: Palette = {
  deep: "#2a1030",
  mid: "#5c1f55",
  shallow: "#a63b7a",
  sky: "#e089b4",
};

function paletteFor(score: number, tags: PollutionTag[]): Palette {
  if (tags.includes("oil_film")) return OIL;
  if (tags.includes("unnatural_color")) return CHEMICAL;
  if (tags.includes("algae_bloom") || tags.includes("eutrophication")) return ALGAL;
  if (tags.includes("turbidity") || tags.includes("sewage")) return SEDIMENT;
  if (score >= 61) return SEDIMENT;
  return CLEAN;
}

function mix(a: string, b: string, t: number) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

export function sampleWaterImage(
  seed: string,
  score: number,
  tags: PollutionTag[] = [],
  size: { w: number; h: number } = { w: 1280, h: 860 },
): string {
  const rnd = (salt: string) => seededRandom(`${seed}:${salt}`);
  const base = paletteFor(score, tags);

  // Dirtier water desaturates toward the sediment palette regardless of tag.
  const grime = Math.min(0.55, score / 190);
  const palette: Palette = {
    deep: mix(base.deep, "#2b2418", grime),
    mid: mix(base.mid, "#4d4231", grime),
    shallow: mix(base.shallow, "#8a7f66", grime * 0.8),
    sky: mix(base.sky, "#b9b3a2", grime * 0.6),
  };

  const { w, h } = size;
  const horizon = Math.round(h * (0.2 + rnd("horizon") * 0.14));
  const turbulence = (0.006 + rnd("turb") * 0.012).toFixed(4);
  const displacement = (8 + score * 0.16).toFixed(1);

  const debrisCount = score >= 45 ? Math.round(6 + (score - 45) / 4) : 0;
  const hasFoam = tags.includes("foam") || score >= 72;
  const hasSheen = tags.includes("oil_film");

  const debris =
    tags.includes("plastic") || tags.includes("floating_garbage") || debrisCount > 0
      ? Array.from({ length: debrisCount }, (_, i) => {
          const x = rnd(`dx${i}`) * w;
          const depth = rnd(`dy${i}`);
          const y = horizon + depth * (h - horizon) * 0.98;
          const scale = 0.35 + depth * 1.5;
          const rw = (5 + rnd(`dw${i}`) * 16) * scale;
          const rh = rw * (0.32 + rnd(`dh${i}`) * 0.4);
          const rot = Math.round(rnd(`dr${i}`) * 180 - 90);
          const litterHue = ["#e8ecef", "#d9d2c2", "#c8443c", "#3f7fb5", "#e0a93b"][
            Math.floor(rnd(`dc${i}`) * 5)
          ];
          const op = (0.5 + rnd(`do${i}`) * 0.42).toFixed(2);
          return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot})"><ellipse rx="${rw.toFixed(1)}" ry="${rh.toFixed(1)}" fill="${litterHue}" opacity="${op}"/><ellipse rx="${(rw * 0.9).toFixed(1)}" ry="${(rh * 0.5).toFixed(1)}" cy="${(rh * 0.7).toFixed(1)}" fill="#000" opacity="0.18"/></g>`;
        }).join("")
      : "";

  const foam = hasFoam
    ? Array.from({ length: 5 }, (_, i) => {
        const y = horizon + rnd(`fy${i}`) * (h - horizon) * 0.9;
        const x = rnd(`fx${i}`) * w;
        const rw = 90 + rnd(`fw${i}`) * 240;
        return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rw.toFixed(0)}" ry="${(10 + rnd(`fh${i}`) * 22).toFixed(0)}" fill="#f4f6f4" opacity="${(0.16 + rnd(`fo${i}`) * 0.3).toFixed(2)}" filter="url(#soft)"/>`;
      }).join("")
    : "";

  const sheen = hasSheen
    ? `<ellipse cx="${(w * (0.3 + rnd("sx") * 0.4)).toFixed(0)}" cy="${(horizon + (h - horizon) * 0.5).toFixed(0)}" rx="${(w * 0.34).toFixed(0)}" ry="${(h * 0.16).toFixed(0)}" fill="url(#iridescent)" opacity="0.5" filter="url(#soft)"/>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.sky}"/><stop offset="1" stop-color="${mix(palette.sky, palette.shallow, 0.7)}"/></linearGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.shallow}"/><stop offset="0.45" stop-color="${palette.mid}"/><stop offset="1" stop-color="${palette.deep}"/></linearGradient>
<linearGradient id="iridescent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7de0c8"/><stop offset="0.35" stop-color="#c9a6f0"/><stop offset="0.7" stop-color="#f0c98a"/><stop offset="1" stop-color="#7aa7e0"/></linearGradient>
<radialGradient id="vignette" cx="0.5" cy="0.42" r="0.78"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></radialGradient>
<filter id="ripple" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="${turbulence} ${(Number(turbulence) * 3.4).toFixed(4)}" numOctaves="4" seed="${Math.floor(rnd("s") * 9999)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${displacement}" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${Math.floor(rnd("g") * 999)}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${(0.05 + score / 900).toFixed(3)}"/></feComponentTransfer></filter>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(6 + rnd("b") * 8).toFixed(1)}"/></filter>
</defs>
<rect width="${w}" height="${horizon}" fill="url(#sky)"/>
<g filter="url(#ripple)">
<rect y="${horizon - 2}" width="${w}" height="${h - horizon + 4}" fill="url(#water)"/>
${Array.from({ length: 9 }, (_, i) => {
  const y = horizon + ((h - horizon) / 9) * i + rnd(`ly${i}`) * 18;
  return `<rect y="${y.toFixed(0)}" width="${w}" height="${(1.5 + rnd(`lh${i}`) * 5).toFixed(1)}" fill="${palette.sky}" opacity="${(0.05 + rnd(`lo${i}`) * 0.13).toFixed(2)}"/>`;
}).join("")}
</g>
<rect y="${horizon - 6}" width="${w}" height="14" fill="${mix(palette.mid, "#000", 0.35)}" opacity="0.5" filter="url(#soft)"/>
${sheen}
${foam}
${debris}
<rect width="${w}" height="${h}" fill="url(#vignette)"/>
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n/g, ""))}`;
}

/** Deterministic avatar for demo contributors — initials on a brand gradient. */
export function sampleAvatar(seed: string, label: string) {
  const hue = Math.floor(seededRandom(`avatar:${seed}`) * 360);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 68% 58%)"/><stop offset="1" stop-color="hsl(${(hue + 58) % 360} 72% 42%)"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#g)"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="52" font-weight="600" fill="rgba(255,255,255,0.94)">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
