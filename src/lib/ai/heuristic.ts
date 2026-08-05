import type { AiIndicator, PollutionTag, VisionAnalysis } from "@/types";
import type { ImageFeatures } from "./image-features";
import { clamp } from "@/lib/utils";
import {
  computeComposite,
  defaultRecommendations,
  INDICATOR_SPECS,
  normaliseAnalysis,
} from "./scoring";

/**
 * Deterministic fallback analyser.
 *
 * When `GOOGLE_GENERATIVE_AI_API_KEY` is absent the platform still has to
 * produce a defensible assessment, otherwise the whole product is a dead demo.
 * This engine maps the colourimetric features measured in the browser onto the
 * same indicator matrix the vision model fills in, so every downstream
 * consumer — score ring, trend engine, PDF report — behaves identically.
 *
 * It is honest about what it is: results are flagged `simulated: true` and the
 * UI labels them "Heuristic engine".
 */
export function heuristicAnalysis(
  features: ImageFeatures | null,
  context?: { userNotes?: string | null; observations?: string[] },
): VisionAnalysis {
  const f = features ?? NEUTRAL_FEATURES;
  const indicators: AiIndicator[] = [];
  const objects = new Set<string>();

  /* ---------------------------- clarity ---------------------------- */
  // Murk reads as low contrast plus a heavy brown/green cast.
  const turbiditySignal =
    f.brownness * 210 + (1 - f.contrast) * 34 + f.greenExcess * 90;
  const claritySeverity = clamp(Math.round(turbiditySignal), 4, 96);
  indicators.push({
    key: "clarity",
    label: label("clarity"),
    severity: claritySeverity,
    detected: true,
    note:
      claritySeverity > 55
        ? `Low transparency: contrast ${(f.contrast * 100).toFixed(0)}% with a strong sediment cast.`
        : `Water column reads as reasonably transparent (contrast ${(f.contrast * 100).toFixed(0)}%).`,
  });

  /* --------------------------- sediment --------------------------- */
  const sediment = clamp(Math.round(f.brownness * 260 + f.contrast * 10), 0, 95);
  if (sediment >= 18) {
    indicators.push({
      key: "turbidity",
      label: label("turbidity"),
      severity: sediment,
      detected: sediment >= 28,
      note: `Warm muddy tint across ${(f.brownness * 100).toFixed(0)}% of the frame.`,
    });
    if (sediment >= 40) objects.add("Sediment-laden water");
  }

  /* ---------------------------- algae ----------------------------- */
  const algae = clamp(Math.round(f.greenExcess * 340 + f.saturation * 18), 0, 97);
  if (algae >= 18) {
    indicators.push({
      key: "algae_bloom",
      label: label("algae_bloom"),
      severity: algae,
      detected: algae >= 30,
      note: `Green channel leads red/blue by ${(f.greenExcess * 100).toFixed(0)}% — consistent with algal biomass.`,
    });
    if (algae >= 35) objects.add("Green algal mats");
    if (algae >= 55) {
      indicators.push({
        key: "eutrophication",
        label: label("eutrophication"),
        severity: clamp(algae - 12, 0, 92),
        detected: true,
        note: "Dense surface vegetation suggests elevated nutrient load.",
      });
    }
  }

  /* ----------------------------- foam ----------------------------- */
  // Foam is bright + desaturated, but so is sky glare, so require edges too.
  const foamRaw = f.whiteRatio * 250 * (0.45 + f.edgeDensity * 1.5);
  const foam = clamp(Math.round(foamRaw - f.specularRatio * 90), 0, 94);
  if (foam >= 16) {
    indicators.push({
      key: "foam",
      label: label("foam"),
      severity: foam,
      detected: foam >= 26,
      note: `Bright desaturated texture over ${(f.whiteRatio * 100).toFixed(0)}% of the surface.`,
    });
    if (foam >= 30) objects.add("Surface foam");
  }

  /* ------------------------- oil / sheen -------------------------- */
  // Iridescence: unusually high hue spread inside dark, low-contrast regions.
  const oil = clamp(
    Math.round(f.hueEntropy * 62 * f.darkRatio * 3.4 + f.specularRatio * 40 * f.darkRatio * 4),
    0,
    92,
  );
  if (oil >= 16) {
    indicators.push({
      key: "oil_film",
      label: label("oil_film"),
      severity: oil,
      detected: oil >= 28,
      note: `Iridescent hue spread (${(f.hueEntropy * 100).toFixed(0)}%) inside dark surface regions.`,
    });
    if (oil >= 30) objects.add("Oil sheen");
  }

  /* -------------------- unnatural coloration ---------------------- */
  const unnatural = clamp(Math.round(f.unnaturalHueRatio * 420), 0, 96);
  if (unnatural >= 14) {
    indicators.push({
      key: "unnatural_color",
      label: label("unnatural_color"),
      severity: unnatural,
      detected: unnatural >= 24,
      note: `${(f.unnaturalHueRatio * 100).toFixed(1)}% of pixels fall in hue ranges rare in natural water.`,
    });
    if (unnatural >= 30) objects.add("Discoloured plume");
  }

  /* ---------------------- solid waste / litter -------------------- */
  // High edge density with broad hue variety = heterogeneous solid objects.
  const litter = clamp(
    Math.round((f.edgeDensity * 96 + f.hueEntropy * 34) * 0.72 - 14),
    0,
    93,
  );
  if (litter >= 18) {
    indicators.push({
      key: "floating_garbage",
      label: label("floating_garbage"),
      severity: litter,
      detected: litter >= 30,
      note: `Fragmented high-contrast edges across the surface (edge density ${(f.edgeDensity * 100).toFixed(0)}%).`,
    });
    if (litter >= 34) {
      indicators.push({
        key: "plastic",
        label: label("plastic"),
        severity: clamp(litter - 8, 0, 90),
        detected: litter >= 42,
        note: "Bright, saturated, geometrically irregular fragments typical of packaging waste.",
      });
      objects.add("Floating debris");
      objects.add("Plastic fragments");
    }
  }

  /* -------------- community observations as evidence -------------- */
  // Human field notes are corroborating signal, capped so they can never
  // manufacture a critical score on their own.
  for (const observation of context?.observations ?? []) {
    const mapped = OBSERVATION_TO_INDICATOR[observation];
    if (!mapped) continue;
    const existing = indicators.find((i) => i.key === mapped.key);
    if (existing) {
      existing.severity = clamp(
        Math.round(existing.severity * 0.75 + mapped.severity * 0.25),
        0,
        96,
      );
      existing.detected = true;
      existing.note = `${existing.note ?? ""} Corroborated by reporter observation.`.trim();
    } else {
      indicators.push({
        key: mapped.key,
        label: label(mapped.key),
        severity: mapped.severity,
        detected: true,
        note: "Reported by the observer on site; not independently visible in this frame.",
      });
    }
  }

  const modelScore = estimateOverall(indicators);
  const confidence = estimateConfidence(f, features !== null, indicators.length);

  const composite = computeComposite(indicators, modelScore, confidence);
  const tags = indicators
    .filter((i) => i.detected && i.key !== "clarity")
    .map((i) => i.key as PollutionTag);

  if (objects.size === 0) objects.add("Open water surface");

  return normaliseAnalysis({
    is_water_body: true,
    scene_summary: sceneSummary(f, composite.score),
    pollution_score: composite.score,
    water_quality: composite.quality,
    clarity_score: 100 - claritySeverity,
    confidence,
    detected_objects: [...objects],
    pollution_tags: tags,
    indicators,
    explanation: explain(f, indicators, composite.score, context?.userNotes),
    recommendations: defaultRecommendations(composite.score, tags),
  });
}

function estimateOverall(indicators: AiIndicator[]) {
  const pollution = indicators.filter((i) => i.key !== "clarity");
  if (pollution.length === 0) {
    const clarity = indicators.find((i) => i.key === "clarity");
    return clamp(Math.round((clarity?.severity ?? 20) * 0.55), 0, 100);
  }
  const peak = Math.max(...pollution.map((i) => i.severity));
  const mean =
    pollution.reduce((sum, i) => sum + i.severity, 0) / pollution.length;
  return clamp(Math.round(peak * 0.55 + mean * 0.45), 0, 100);
}

function estimateConfidence(
  f: ImageFeatures,
  hasFeatures: boolean,
  indicatorCount: number,
) {
  if (!hasFeatures) return 46;

  let confidence = 82;

  // Under- and over-exposed frames hide evidence.
  if (f.brightness < 0.16) confidence -= 20;
  else if (f.brightness < 0.26) confidence -= 9;
  if (f.brightness > 0.88) confidence -= 14;
  if (f.specularRatio > 0.12) confidence -= 8;

  // Flat frames carry almost no usable texture.
  if (f.contrast < 0.05) confidence -= 14;

  // Small source images lose the fine detail litter detection depends on.
  const megapixels = (f.width * f.height) / 1_000_000;
  if (megapixels < 0.12) confidence -= 16;
  else if (megapixels < 0.4) confidence -= 7;

  if (indicatorCount <= 2) confidence -= 6;

  return clamp(Math.round(confidence), 38, 88);
}

function sceneSummary(f: ImageFeatures, score: number) {
  const light =
    f.brightness > 0.62 ? "brightly lit" : f.brightness < 0.28 ? "dim" : "evenly lit";
  const tone =
    f.greenExcess > 0.08
      ? "green-tinted"
      : f.brownness > 0.1
        ? "brown-tinted"
        : "neutral-toned";
  return `A ${light}, ${tone} water surface with composite severity ${score}/100.`;
}

function explain(
  f: ImageFeatures,
  indicators: AiIndicator[],
  score: number,
  userNotes?: string | null,
) {
  const drivers = indicators
    .filter((i) => i.key !== "clarity" && i.detected)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  const parts: string[] = [];

  if (drivers.length) {
    parts.push(
      `Colourimetric analysis of this frame flags ${drivers
        .map((d) => `${d.label.toLowerCase()} (${d.severity}/100)`)
        .join(", ")}.`,
    );
  } else {
    parts.push(
      "No significant anthropogenic pollution signature was measurable in this frame.",
    );
  }

  const clarity = indicators.find((i) => i.key === "clarity");
  if (clarity) {
    parts.push(
      clarity.severity > 55
        ? `Water transparency is poor — luminance contrast sits at ${(f.contrast * 100).toFixed(0)}% with a heavy sediment cast.`
        : `Water transparency is acceptable, with luminance contrast at ${(f.contrast * 100).toFixed(0)}%.`,
    );
  }

  parts.push(
    `The weighted indicator matrix yields a composite environmental severity of ${score}/100.`,
  );

  if (userNotes) {
    parts.push(
      "The reporter's field note has been recorded alongside this assessment but was not used to raise the visual score beyond corroboration.",
    );
  }

  return parts.join(" ");
}

const OBSERVATION_TO_INDICATOR: Record<
  string,
  { key: PollutionTag; severity: number }
> = {
  bad_smell: { key: "sewage", severity: 54 },
  dead_fish: { key: "dead_fish", severity: 72 },
  foam: { key: "foam", severity: 48 },
  illegal_dumping: { key: "construction_debris", severity: 58 },
  nearby_factory: { key: "industrial_discharge", severity: 52 },
  discolored_water: { key: "unnatural_color", severity: 50 },
  oil_sheen: { key: "oil_film", severity: 58 },
  excess_vegetation: { key: "eutrophication", severity: 46 },
};

function label(key: PollutionTag | "clarity") {
  return INDICATOR_SPECS.find((s) => s.key === key)?.label ?? key;
}

const NEUTRAL_FEATURES: ImageFeatures = {
  mean: { r: 96, g: 108, b: 112 },
  brightness: 0.4,
  saturation: 0.18,
  contrast: 0.12,
  greenExcess: 0.02,
  brownness: 0.04,
  whiteRatio: 0.03,
  darkRatio: 0.06,
  specularRatio: 0.01,
  edgeDensity: 0.22,
  hueEntropy: 0.4,
  unnaturalHueRatio: 0.002,
  hueHistogram: new Array(12).fill(1 / 12),
  width: 1280,
  height: 960,
};
