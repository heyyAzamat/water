import type {
  AiIndicator,
  PollutionTag,
  VisionAnalysis,
  WaterQuality,
} from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import { clamp } from "@/lib/utils";
import { analysisCopy } from "./copy";

/* ------------------------------------------------------------------ *
 * Grade bands
 *
 * Score semantics: 0 = pristine, 100 = ecological emergency. The bands
 * below are the single source of truth — the UI, the map markers, the PDF
 * export and the notification thresholds all read from here.
 * ------------------------------------------------------------------ */

export interface Grade {
  quality: WaterQuality;
  min: number;
  max: number;
  /** Tailwind text color utility */
  text: string;
  /** Tailwind background tint */
  bg: string;
  /** Tailwind border tint */
  border: string;
  /** Raw hex, for canvas/SVG/Leaflet where CSS vars are unavailable */
  hex: string;
  label: string;
  blurb: string;
}

export const GRADES: Grade[] = [
  {
    quality: "Excellent",
    min: 0,
    max: 20,
    text: "text-grade-excellent",
    bg: "bg-grade-excellent/12",
    border: "border-grade-excellent/30",
    hex: "#34d399",
    label: "Excellent",
    blurb: "No visible contamination. Water appears clear and healthy.",
  },
  {
    quality: "Good",
    min: 21,
    max: 40,
    text: "text-grade-good",
    bg: "bg-grade-good/12",
    border: "border-grade-good/30",
    hex: "#a3e635",
    label: "Good",
    blurb: "Minor surface debris or slight turbidity. Ecologically stable.",
  },
  {
    quality: "Moderate",
    min: 41,
    max: 60,
    text: "text-grade-moderate",
    bg: "bg-grade-moderate/12",
    border: "border-grade-moderate/30",
    hex: "#fbbf24",
    label: "Moderate",
    blurb: "Noticeable pollution indicators. Monitoring recommended.",
  },
  {
    quality: "Poor",
    min: 61,
    max: 80,
    text: "text-grade-poor",
    bg: "bg-grade-poor/12",
    border: "border-grade-poor/30",
    hex: "#fb923c",
    label: "Poor",
    blurb: "Significant contamination visible. Intervention advised.",
  },
  {
    quality: "Critical",
    min: 81,
    max: 100,
    text: "text-grade-critical",
    bg: "bg-grade-critical/12",
    border: "border-grade-critical/30",
    hex: "#f43f5e",
    label: "Critical",
    blurb: "Severe pollution. Immediate environmental response required.",
  },
];

export function gradeForScore(score: number): Grade {
  const s = clamp(Math.round(score), 0, 100);
  return GRADES.find((g) => s >= g.min && s <= g.max) ?? GRADES[2];
}

export function qualityForScore(score: number): WaterQuality {
  return gradeForScore(score).quality;
}

export function gradeForQuality(quality: WaterQuality): Grade {
  return GRADES.find((g) => g.quality === quality) ?? GRADES[2];
}

/** Hex ramp used by Leaflet markers, heatmap gradient and chart strokes. */
export function scoreHex(score: number) {
  return gradeForScore(score).hex;
}

/* ------------------------------------------------------------------ *
 * Weighted scoring engine
 *
 * The vision model returns per-indicator severities. We do not trust its
 * self-reported overall score blindly: we recompute it from the indicator
 * matrix so the number is reproducible and auditable, then blend the two.
 * ------------------------------------------------------------------ */

export interface IndicatorSpec {
  key: PollutionTag | "clarity";
  label: string;
  /** Relative contribution to the composite score. */
  weight: number;
  /** Short description shown in the report's indicator table. */
  description: string;
}

export const INDICATOR_SPECS: IndicatorSpec[] = [
  {
    key: "clarity",
    label: "Water clarity",
    weight: 1.35,
    description:
      "Transparency and turbidity of the water column — suspended sediment, murkiness.",
  },
  {
    key: "plastic",
    label: "Plastic waste",
    weight: 1.5,
    description: "Bottles, bags, packaging and microplastic accumulation.",
  },
  {
    key: "floating_garbage",
    label: "Floating garbage",
    weight: 1.3,
    description: "General solid waste drifting on the surface or trapped at banks.",
  },
  {
    key: "oil_film",
    label: "Oil / petroleum film",
    weight: 1.7,
    description: "Iridescent sheen or dark slick indicating hydrocarbon spill.",
  },
  {
    key: "foam",
    label: "Surface foam",
    weight: 1.15,
    description: "Persistent white or brown foam, often surfactant or sewage related.",
  },
  {
    key: "algae_bloom",
    label: "Algae bloom",
    weight: 1.4,
    description: "Green/blue-green mats indicating eutrophication and oxygen loss.",
  },
  {
    key: "unnatural_color",
    label: "Unnatural coloration",
    weight: 1.45,
    description: "Dye-like, rust, milky or fluorescent tints from chemical discharge.",
  },
  {
    key: "turbidity",
    label: "Sediment load",
    weight: 1.0,
    description: "Heavy brown sediment from erosion, dredging or runoff.",
  },
  {
    key: "industrial_discharge",
    label: "Industrial discharge",
    weight: 1.6,
    description: "Visible outfall pipes, effluent plumes or discharge structures.",
  },
  {
    key: "sewage",
    label: "Sewage indicators",
    weight: 1.6,
    description: "Grey water, organic sludge, or sanitary waste on the surface.",
  },
  {
    key: "dead_fish",
    label: "Dead aquatic life",
    weight: 1.8,
    description: "Fish kill or dead fauna — a direct signal of acute toxicity.",
  },
  {
    key: "construction_debris",
    label: "Construction debris",
    weight: 1.05,
    description: "Rubble, concrete, tyres and dumped building material.",
  },
  {
    key: "eutrophication",
    label: "Eutrophication",
    weight: 1.25,
    description: "Excess nutrient load: duckweed carpets, dense aquatic vegetation.",
  },
];

const SPEC_BY_KEY = new Map(INDICATOR_SPECS.map((s) => [s.key, s]));

export function indicatorSpec(key: string) {
  return SPEC_BY_KEY.get(key as PollutionTag | "clarity");
}

export interface CompositeScore {
  score: number;
  quality: WaterQuality;
  /** How much the model's own score disagreed with the weighted matrix. */
  divergence: number;
  /** Confidence after penalising indicator disagreement. */
  confidence: number;
  drivers: { label: string; severity: number; contribution: number }[];
}

/**
 * Recompute a composite 0–100 score from the indicator matrix.
 *
 * Weighted mean alone under-reports a single catastrophic signal (one oil
 * slick in an otherwise clean frame), so we blend the weighted mean with the
 * worst single indicator. `peakBias` controls how much the worst signal pulls.
 */
export function computeComposite(
  indicators: AiIndicator[],
  modelScore: number,
  modelConfidence: number,
  peakBias = 0.42,
): CompositeScore {
  const usable = indicators.filter((i) => Number.isFinite(i.severity));

  if (usable.length === 0) {
    const score = clamp(Math.round(modelScore), 0, 100);
    return {
      score,
      quality: qualityForScore(score),
      divergence: 0,
      confidence: clamp(Math.round(modelConfidence), 0, 100),
      drivers: [],
    };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  let peak = 0;

  const drivers = usable
    .map((indicator) => {
      const weight = SPEC_BY_KEY.get(indicator.key)?.weight ?? 1;
      const severity = clamp(indicator.severity, 0, 100);
      weightedSum += severity * weight;
      weightTotal += weight;
      peak = Math.max(peak, severity);
      return {
        label: indicator.label,
        severity,
        contribution: severity * weight,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);

  const weightedMean = weightTotal > 0 ? weightedSum / weightTotal : 0;
  const matrixScore = weightedMean * (1 - peakBias) + peak * peakBias;

  // Trust the matrix as the backbone, let the model nudge it. The model sees
  // context the indicator list can't encode (scale, framing, water body size).
  const blended = matrixScore * 0.68 + clamp(modelScore, 0, 100) * 0.32;
  const score = clamp(Math.round(blended), 0, 100);
  const divergence = Math.round(Math.abs(matrixScore - modelScore));

  // A model that disagrees with its own indicator matrix is less trustworthy.
  const confidencePenalty = clamp(divergence * 0.6, 0, 22);
  const confidence = clamp(
    Math.round(clamp(modelConfidence, 0, 100) - confidencePenalty),
    35,
    99,
  );

  return {
    score,
    quality: qualityForScore(score),
    divergence,
    confidence,
    drivers: drivers.slice(0, 5),
  };
}

/**
 * Normalise whatever the vision model returned into a trustworthy
 * `VisionAnalysis`. Never throws: a malformed field degrades to a safe
 * default rather than failing the whole upload.
 */
export function normaliseAnalysis(
  raw: unknown,
  locale: Locale = DEFAULT_LOCALE,
): VisionAnalysis {
  const copy = analysisCopy(locale);
  const input = (raw ?? {}) as Record<string, unknown>;

  const indicators = normaliseIndicators(input.indicators, locale);
  const modelScore = num(input.pollution_score, 50);
  const modelConfidence = num(input.confidence, 70);

  const composite = computeComposite(indicators, modelScore, modelConfidence);

  const detectedTags = indicators
    .filter((i) => i.detected && i.key !== "clarity")
    .map((i) => i.key as PollutionTag);

  const declaredTags = arr(input.pollution_tags)
    .map((t) => String(t).toLowerCase().replace(/\s+/g, "_"))
    .filter((t): t is PollutionTag => SPEC_BY_KEY.has(t as PollutionTag));

  const pollutionTags = [...new Set([...detectedTags, ...declaredTags])];

  const clarityIndicator = indicators.find((i) => i.key === "clarity");
  const clarityScore = clamp(
    Math.round(
      num(
        input.clarity_score,
        clarityIndicator ? 100 - clarityIndicator.severity : 100 - composite.score,
      ),
    ),
    0,
    100,
  );

  const isWaterBody = input.is_water_body === undefined ? true : !!input.is_water_body;

  return {
    pollution_score: composite.score,
    water_quality: composite.quality,
    clarity_score: clarityScore,
    confidence: composite.confidence,
    detected_objects: arr(input.detected_objects).map(String).slice(0, 14),
    pollution_tags: pollutionTags,
    explanation:
      str(input.explanation) ||
      fmt(copy.explain.fallback, {
        score: composite.score,
        quality: composite.quality,
        count: indicators.length,
      }),
    recommendations: arr(input.recommendations).map(String).slice(0, 8).length
      ? arr(input.recommendations).map(String).slice(0, 8)
      : defaultRecommendations(composite.score, pollutionTags, locale),
    indicators,
    is_water_body: isWaterBody,
    scene_summary: str(input.scene_summary) || copy.scene.fallback,
  };
}

function normaliseIndicators(value: unknown, locale: Locale): AiIndicator[] {
  const labels = getDictionary(locale).domain.indicators;
  const list = arr(value);
  const byKey = new Map<string, AiIndicator>();

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const rawKey = String(obj.key ?? obj.name ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const spec = SPEC_BY_KEY.get(rawKey as PollutionTag | "clarity");
    if (!spec) continue;

    const severity = clamp(Math.round(num(obj.severity, 0)), 0, 100);
    byKey.set(spec.key, {
      key: spec.key,
      label: labels[spec.key]?.label ?? spec.label,
      severity,
      detected: obj.detected === undefined ? severity >= 25 : !!obj.detected,
      note: str(obj.note) || undefined,
    });
  }

  return INDICATOR_SPECS.filter((spec) => byKey.has(spec.key)).map(
    (spec) => byKey.get(spec.key)!,
  );
}

export function defaultRecommendations(
  score: number,
  tags: PollutionTag[],
  locale: Locale = DEFAULT_LOCALE,
): string[] {
  const r = analysisCopy(locale).recommendations;
  const recs: string[] = [];

  if (tags.includes("plastic") || tags.includes("floating_garbage")) {
    recs.push(r.litter);
  }
  if (tags.includes("oil_film")) recs.push(r.oil);
  if (tags.includes("algae_bloom") || tags.includes("eutrophication")) {
    recs.push(r.algae);
  }
  if (tags.includes("foam") || tags.includes("sewage")) recs.push(r.sewage);
  if (tags.includes("dead_fish")) recs.push(r.deadFish);
  if (tags.includes("industrial_discharge")) recs.push(r.industrial);

  if (score >= 81) recs.push(r.critical);
  else if (score >= 61) recs.push(r.poor);
  else if (score >= 41) recs.push(r.moderate);
  else recs.push(r.healthy);

  if (recs.length < 3) recs.push(r.moreAngles);

  return [...new Set(recs)].slice(0, 6);
}

/* -------------------------- small coercions -------------------------- */

function num(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
