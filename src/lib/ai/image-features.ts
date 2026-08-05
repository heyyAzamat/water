/**
 * Lightweight client-side image statistics.
 *
 * Two jobs:
 *  1. Give the vision model measurable context it can be checked against.
 *  2. Drive the heuristic engine in `heuristic.ts` so the platform produces a
 *     genuine, image-derived assessment even with no vision API key configured.
 *
 * Everything here runs on a 96×96 downsample, so it costs well under a
 * millisecond and never blocks the upload.
 */

export interface ImageFeatures {
  /** Mean channel values, 0–255. */
  mean: { r: number; g: number; b: number };
  /** Mean perceptual lightness, 0–1. */
  brightness: number;
  /** Mean HSV saturation, 0–1. */
  saturation: number;
  /** Standard deviation of luminance, 0–1 — proxy for texture/contrast. */
  contrast: number;
  /** g − (r+b)/2, normalised. Positive = green cast (algae, duckweed). */
  greenExcess: number;
  /** Warm-muddy cast: red>green>blue with low saturation. */
  brownness: number;
  /** Share of bright, desaturated pixels — foam, whitewater, glare. */
  whiteRatio: number;
  /** Share of very dark pixels — deep shadow, oil, dark sludge. */
  darkRatio: number;
  /** Share of pixels above the specular threshold. */
  specularRatio: number;
  /** Normalised Sobel gradient magnitude — surface litter raises this. */
  edgeDensity: number;
  /** Shannon entropy of the 12-bin hue histogram, 0–1. */
  hueEntropy: number;
  /** Share of highly saturated non-natural hues (magenta/cyan/orange). */
  unnaturalHueRatio: number;
  /** 12-bin hue histogram, each 0–1, summing to 1. */
  hueHistogram: number[];
  /** Source pixel dimensions, before downsampling. */
  width: number;
  height: number;
}

const SAMPLE = 96;
const HUE_BINS = 12;

export async function extractImageFeatures(
  source: Blob | HTMLImageElement,
): Promise<ImageFeatures | null> {
  try {
    const { data, width, height, srcWidth, srcHeight } =
      await rasterise(source);
    return computeFeatures(data, width, height, srcWidth, srcHeight);
  } catch {
    // Feature extraction is strictly additive — never fail an upload over it.
    return null;
  }
}

async function rasterise(source: Blob | HTMLImageElement) {
  let srcWidth: number;
  let srcHeight: number;
  let drawable: CanvasImageSource;

  if (source instanceof Blob) {
    const bitmap = await createImageBitmap(source);
    srcWidth = bitmap.width;
    srcHeight = bitmap.height;
    drawable = bitmap;
  } else {
    srcWidth = source.naturalWidth || source.width;
    srcHeight = source.naturalHeight || source.height;
    drawable = source;
  }

  const scale = Math.min(SAMPLE / srcWidth, SAMPLE / srcHeight, 1);
  const width = Math.max(8, Math.round(srcWidth * scale));
  const height = Math.max(8, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");

  ctx.drawImage(drawable, 0, 0, width, height);
  if ("close" in drawable && typeof drawable.close === "function") {
    drawable.close();
  }

  const { data } = ctx.getImageData(0, 0, width, height);
  return { data, width, height, srcWidth, srcHeight };
}

function computeFeatures(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  srcWidth: number,
  srcHeight: number,
): ImageFeatures {
  const total = width * height;
  const luma = new Float32Array(total);
  const hueHistogram = new Array<number>(HUE_BINS).fill(0);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumSat = 0;
  let sumLuma = 0;
  let white = 0;
  let dark = 0;
  let specular = 0;
  let green = 0;
  let brown = 0;
  let unnatural = 0;
  let saturatedPixels = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    sumR += r;
    sumG += g;
    sumB += b;

    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    luma[p] = l;
    sumLuma += l;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    sumSat += sat;

    if (l > 0.78 && sat < 0.18) white++;
    if (l < 0.12) dark++;
    if (l > 0.94) specular++;

    // Green cast: green channel meaningfully above the red/blue average.
    const greenLead = g - (r + b) / 2;
    if (greenLead > 14 && sat > 0.12) green += Math.min(1, greenLead / 60);

    // Muddy brown: warm ordering with restrained saturation.
    if (r > g && g > b && sat > 0.14 && sat < 0.55 && l > 0.14 && l < 0.62) {
      brown += Math.min(1, (r - b) / 90);
    }

    if (delta > 0) {
      const hue = rgbToHue(r, g, b, max, min, delta);
      hueHistogram[Math.min(HUE_BINS - 1, Math.floor((hue / 360) * HUE_BINS))]++;

      if (sat > 0.45) {
        saturatedPixels++;
        // Magenta / hot-pink / vivid orange / electric cyan rarely occur in
        // natural water and are strong chemical-discharge tells.
        const chemical =
          (hue >= 270 && hue <= 345) ||
          (hue >= 15 && hue <= 45 && l > 0.45) ||
          (hue >= 165 && hue <= 200 && sat > 0.7);
        if (chemical) unnatural++;
      }
    }
  }

  const meanLuma = sumLuma / total;
  let variance = 0;
  for (let p = 0; p < total; p++) {
    const d = luma[p] - meanLuma;
    variance += d * d;
  }
  const contrast = Math.sqrt(variance / total);

  // Sobel magnitude over the luminance plane.
  let gradient = 0;
  let gradientSamples = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx =
        -luma[i - width - 1] -
        2 * luma[i - 1] -
        luma[i + width - 1] +
        luma[i - width + 1] +
        2 * luma[i + 1] +
        luma[i + width + 1];
      const gy =
        -luma[i - width - 1] -
        2 * luma[i - width] -
        luma[i - width + 1] +
        luma[i + width - 1] +
        2 * luma[i + width] +
        luma[i + width + 1];
      gradient += Math.sqrt(gx * gx + gy * gy);
      gradientSamples++;
    }
  }

  const histSum = hueHistogram.reduce((a, b) => a + b, 0) || 1;
  const normalisedHist = hueHistogram.map((v) => v / histSum);
  let entropy = 0;
  for (const p of normalisedHist) {
    if (p > 0) entropy -= p * Math.log2(p);
  }

  return {
    mean: { r: sumR / total, g: sumG / total, b: sumB / total },
    brightness: round(meanLuma),
    saturation: round(sumSat / total),
    contrast: round(contrast),
    greenExcess: round(green / total),
    brownness: round(brown / total),
    whiteRatio: round(white / total),
    darkRatio: round(dark / total),
    specularRatio: round(specular / total),
    edgeDensity: round(
      gradientSamples ? Math.min(1, gradient / gradientSamples / 2.4) : 0,
    ),
    hueEntropy: round(entropy / Math.log2(HUE_BINS)),
    unnaturalHueRatio: round(
      saturatedPixels ? unnatural / total : 0,
    ),
    hueHistogram: normalisedHist.map(round),
    width: srcWidth,
    height: srcHeight,
  };
}

function rgbToHue(
  r: number,
  g: number,
  b: number,
  max: number,
  min: number,
  delta: number,
) {
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

/** Human-readable digest, sent to the vision model as corroborating evidence. */
export function describeFeatures(f: ImageFeatures) {
  return [
    `resolution ${f.width}×${f.height}`,
    `mean RGB ${f.mean.r.toFixed(0)}/${f.mean.g.toFixed(0)}/${f.mean.b.toFixed(0)}`,
    `brightness ${(f.brightness * 100).toFixed(0)}%`,
    `saturation ${(f.saturation * 100).toFixed(0)}%`,
    `contrast ${(f.contrast * 100).toFixed(0)}%`,
    `green cast ${(f.greenExcess * 100).toFixed(0)}%`,
    `brown/sediment cast ${(f.brownness * 100).toFixed(0)}%`,
    `bright desaturated area ${(f.whiteRatio * 100).toFixed(0)}%`,
    `dark area ${(f.darkRatio * 100).toFixed(0)}%`,
    `edge density ${(f.edgeDensity * 100).toFixed(0)}%`,
    `hue entropy ${(f.hueEntropy * 100).toFixed(0)}%`,
  ].join(", ");
}
