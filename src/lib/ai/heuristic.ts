import type { AiIndicator, PollutionTag, VisionAnalysis } from "@/types";
import type { ImageFeatures } from "./image-features";
import type { Locale } from "@/lib/i18n/config";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import { clamp } from "@/lib/utils";
import { analysisCopy, type AnalysisCopy } from "./copy";
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
 *
 * Prose is written in `locale` so a reporter never gets an English assessment
 * inside a Russian or Kazakh interface.
 */
export function heuristicAnalysis(
  features: ImageFeatures | null,
  context?: { userNotes?: string | null; observations?: string[] },
  locale: Locale = DEFAULT_LOCALE,
): VisionAnalysis {
  const f = features ?? NEUTRAL_FEATURES;
  const c = analysisCopy(locale);
  const indicators: AiIndicator[] = [];
  const objects = new Set<string>();

  /* ---------------------------- clarity ---------------------------- */
  // Murk reads as low contrast plus a heavy brown/green cast.
  const turbiditySignal =
    f.brownness * 210 + (1 - f.contrast) * 34 + f.greenExcess * 90;
  const claritySeverity = clamp(Math.round(turbiditySignal), 4, 96);
  indicators.push({
    key: "clarity",
    label: label("clarity", locale),
    severity: claritySeverity,
    detected: true,
    note: fmt(
      claritySeverity > 55 ? c.notes.clarityLow : c.notes.clarityOk,
      { contrast: (f.contrast * 100).toFixed(0) },
    ),
  });

  /* --------------------------- sediment --------------------------- */
  const sediment = clamp(Math.round(f.brownness * 260 + f.contrast * 10), 0, 95);
  if (sediment >= 18) {
    indicators.push({
      key: "turbidity",
      label: label("turbidity", locale),
      severity: sediment,
      detected: sediment >= 28,
      note: fmt(c.notes.sediment, { pct: (f.brownness * 100).toFixed(0) }),
    });
    if (sediment >= 40) objects.add(c.objects.sediment);
  }

  /* ---------------------------- algae ----------------------------- */
  const algae = clamp(Math.round(f.greenExcess * 340 + f.saturation * 18), 0, 97);
  if (algae >= 18) {
    indicators.push({
      key: "algae_bloom",
      label: label("algae_bloom", locale),
      severity: algae,
      detected: algae >= 30,
      note: fmt(c.notes.algae, { pct: (f.greenExcess * 100).toFixed(0) }),
    });
    if (algae >= 35) objects.add(c.objects.algalMats);
    if (algae >= 55) {
      indicators.push({
        key: "eutrophication",
        label: label("eutrophication", locale),
        severity: clamp(algae - 12, 0, 92),
        detected: true,
        note: c.notes.eutrophication,
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
      label: label("foam", locale),
      severity: foam,
      detected: foam >= 26,
      note: fmt(c.notes.foam, { pct: (f.whiteRatio * 100).toFixed(0) }),
    });
    if (foam >= 30) objects.add(c.objects.foam);
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
      label: label("oil_film", locale),
      severity: oil,
      detected: oil >= 28,
      note: fmt(c.notes.oil, { pct: (f.hueEntropy * 100).toFixed(0) }),
    });
    if (oil >= 30) objects.add(c.objects.oilSheen);
  }

  /* -------------------- unnatural coloration ---------------------- */
  const unnatural = clamp(Math.round(f.unnaturalHueRatio * 420), 0, 96);
  if (unnatural >= 14) {
    indicators.push({
      key: "unnatural_color",
      label: label("unnatural_color", locale),
      severity: unnatural,
      detected: unnatural >= 24,
      note: fmt(c.notes.unnaturalColour, { pct: (f.unnaturalHueRatio * 100).toFixed(1) }),
    });
    if (unnatural >= 30) objects.add(c.objects.plume);
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
      label: label("floating_garbage", locale),
      severity: litter,
      detected: litter >= 30,
      note: fmt(c.notes.litter, { pct: (f.edgeDensity * 100).toFixed(0) }),
    });
    if (litter >= 34) {
      indicators.push({
        key: "plastic",
        label: label("plastic", locale),
        severity: clamp(litter - 8, 0, 90),
        detected: litter >= 42,
        note: c.notes.plastic,
      });
      objects.add(c.objects.debris);
      objects.add(c.objects.plastic);
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
      existing.note = `${existing.note ?? ""} ${c.notes.corroborated}`.trim();
    } else {
      indicators.push({
        key: mapped.key,
        label: label(mapped.key, locale),
        severity: mapped.severity,
        detected: true,
        note: c.notes.observationOnly,
      });
    }
  }

  const modelScore = estimateOverall(indicators);
  const confidence = estimateConfidence(f, features !== null, indicators.length);

  const composite = computeComposite(indicators, modelScore, confidence);
  const tags = indicators
    .filter((i) => i.detected && i.key !== "clarity")
    .map((i) => i.key as PollutionTag);

  if (objects.size === 0) objects.add(c.objects.openWater);

  return normaliseAnalysis({
    is_water_body: true,
    scene_summary: sceneSummary(f, composite.score, c),
    pollution_score: composite.score,
    water_quality: composite.quality,
    clarity_score: 100 - claritySeverity,
    confidence,
    detected_objects: [...objects],
    pollution_tags: tags,
    indicators,
    explanation: explain(f, indicators, composite.score, c, context?.userNotes),
    recommendations: defaultRecommendations(composite.score, tags, locale),
  }, locale);
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

function sceneSummary(f: ImageFeatures, score: number, c: AnalysisCopy) {
  const light =
    f.brightness > 0.62
      ? c.scene.light.bright
      : f.brightness < 0.28
        ? c.scene.light.dim
        : c.scene.light.even;
  const tone =
    f.greenExcess > 0.08
      ? c.scene.tone.green
      : f.brownness > 0.1
        ? c.scene.tone.brown
        : c.scene.tone.neutral;
  return fmt(c.scene.summary, { light, tone, score });
}

function explain(
  f: ImageFeatures,
  indicators: AiIndicator[],
  score: number,
  c: AnalysisCopy,
  userNotes?: string | null,
) {
  const drivers = indicators
    .filter((i) => i.key !== "clarity" && i.detected)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  const parts: string[] = [];

  if (drivers.length) {
    parts.push(
      fmt(c.explain.drivers, {
        list: drivers
          .map((d) =>
            fmt(c.explain.driverItem, {
              label: d.label.toLowerCase(),
              severity: d.severity,
            }),
          )
          .join(", "),
      }),
    );
  } else {
    parts.push(c.explain.noDrivers);
  }

  const clarity = indicators.find((i) => i.key === "clarity");
  if (clarity) {
    parts.push(
      fmt(clarity.severity > 55 ? c.explain.clarityPoor : c.explain.clarityOk, {
        pct: (f.contrast * 100).toFixed(0),
      }),
    );
  }

  parts.push(fmt(c.explain.composite, { score }));

  if (userNotes) parts.push(c.explain.fieldNote);

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

function label(key: PollutionTag | "clarity", locale: Locale) {
  return (
    getDictionary(locale).domain.indicators[key]?.label ??
    INDICATOR_SPECS.find((s) => s.key === key)?.label ??
    key
  );
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
