import type { Report, TrendAnalysis, TrendPoint } from "@/types";
import { clamp } from "@/lib/utils";
import { qualityForScore } from "./scoring";

const DAY = 86_400_000;

/**
 * AI Trend Analysis.
 *
 * Given every report for one location, decide whether the water body is
 * improving, stable or getting worse — and project 30 days forward.
 *
 * Two things matter for honesty here:
 *  1. Confidence-weighted least squares. A blurry 41%-confidence photo should
 *     not swing the verdict as hard as a crisp 92% one.
 *  2. An explicit noise floor. Photographs of water vary with light, season and
 *     framing; anything under `NOISE_FLOOR` points of movement is "stable", not
 *     a trend. Calling seasonal variation a crisis destroys user trust.
 */
const NOISE_FLOOR = 6;
const MIN_SAMPLES = 2;

export function analyseTrend(reports: Report[]): TrendAnalysis {
  const points = toPoints(reports);

  if (points.length < MIN_SAMPLES) {
    const only = points[0];
    return {
      direction: "unknown",
      delta: 0,
      slopePerDay: 0,
      reliability: 0,
      sampleSize: points.length,
      spanDays: 0,
      firstScore: only?.score ?? 0,
      latestScore: only?.score ?? 0,
      average: only?.score ?? 0,
      projectedScore: null,
      summary: points.length
        ? "Only one observation exists for this location. Upload another photograph to unlock trend detection."
        : "No observations recorded yet.",
      points,
    };
  }

  const first = points[0];
  const latest = points[points.length - 1];
  const spanDays = Math.max(
    1,
    (new Date(latest.date).getTime() - new Date(first.date).getTime()) / DAY,
  );

  const fit = weightedLinearFit(points);
  const average =
    points.reduce((sum, p) => sum + p.score, 0) / points.length;

  // Compare window means rather than raw endpoints so one outlier photo can't
  // flip the verdict.
  const half = Math.max(1, Math.floor(points.length / 2));
  const earlyMean = mean(points.slice(0, half).map((p) => p.score));
  const lateMean = mean(points.slice(-half).map((p) => p.score));
  const delta = Math.round(lateMean - earlyMean);

  const modelledMovement = fit.slope * spanDays;
  const direction = classify(delta, modelledMovement, fit.r2);

  const projectedScore =
    fit.r2 >= 0.25 && points.length >= 3
      ? clamp(Math.round(latest.score + fit.slope * 30), 0, 100)
      : null;

  return {
    direction,
    delta,
    slopePerDay: Math.round(fit.slope * 1000) / 1000,
    reliability: Math.round(fit.r2 * 100) / 100,
    sampleSize: points.length,
    spanDays: Math.round(spanDays),
    firstScore: first.score,
    latestScore: latest.score,
    average: Math.round(average),
    projectedScore,
    summary: summarise({
      direction,
      delta,
      spanDays,
      sampleSize: points.length,
      latestScore: latest.score,
      projectedScore,
      reliability: fit.r2,
    }),
    points,
  };
}

function classify(
  delta: number,
  modelledMovement: number,
  r2: number,
): TrendAnalysis["direction"] {
  // Require the window comparison and the regression to agree in sign, and
  // require the movement to clear the noise floor.
  const agree =
    Math.sign(delta) === Math.sign(modelledMovement) || modelledMovement === 0;
  const magnitude = Math.max(Math.abs(delta), Math.abs(modelledMovement));

  if (!agree || magnitude < NOISE_FLOOR || r2 < 0.12) return "stable";
  return delta > 0 ? "worsening" : "improving";
}

/** Confidence-weighted least squares over (days-since-first, score). */
function weightedLinearFit(points: TrendPoint[]) {
  const t0 = new Date(points[0].date).getTime();
  const rows = points.map((p) => ({
    x: (new Date(p.date).getTime() - t0) / DAY,
    y: p.score,
    // Confidence 40 → weight 0.4; confidence 95 → weight 0.95. Floor at 0.3 so
    // a low-confidence photo still counts for something.
    w: Math.max(0.3, p.confidence / 100),
  }));

  const wSum = rows.reduce((s, r) => s + r.w, 0);
  const xMean = rows.reduce((s, r) => s + r.w * r.x, 0) / wSum;
  const yMean = rows.reduce((s, r) => s + r.w * r.y, 0) / wSum;

  let num = 0;
  let den = 0;
  for (const r of rows) {
    num += r.w * (r.x - xMean) * (r.y - yMean);
    den += r.w * (r.x - xMean) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (const r of rows) {
    const predicted = intercept + slope * r.x;
    ssRes += r.w * (r.y - predicted) ** 2;
    ssTot += r.w * (r.y - yMean) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, 0, 1);
  return { slope, intercept, r2 };
}

function summarise(input: {
  direction: TrendAnalysis["direction"];
  delta: number;
  spanDays: number;
  sampleSize: number;
  latestScore: number;
  projectedScore: number | null;
  reliability: number;
}) {
  const {
    direction,
    delta,
    spanDays,
    sampleSize,
    latestScore,
    projectedScore,
    reliability,
  } = input;

  const window = `${sampleSize} observations over ${Math.round(spanDays)} days`;
  const parts: string[] = [];

  if (direction === "worsening") {
    parts.push(
      `Pollution severity has risen by ${Math.abs(delta)} points across ${window}, now at ${latestScore}/100 (${qualityForScore(latestScore)}).`,
    );
  } else if (direction === "improving") {
    parts.push(
      `Pollution severity has fallen by ${Math.abs(delta)} points across ${window}, now at ${latestScore}/100 (${qualityForScore(latestScore)}).`,
    );
  } else {
    parts.push(
      `Severity is holding steady across ${window} — movement stays inside the ±${NOISE_FLOOR}-point noise band expected from lighting and seasonal variation.`,
    );
  }

  if (projectedScore !== null) {
    const projectedQuality = qualityForScore(projectedScore);
    parts.push(
      `Extrapolating the fitted slope 30 days forward projects ${projectedScore}/100 (${projectedQuality}).`,
    );
  }

  if (reliability < 0.3 && direction !== "stable") {
    parts.push(
      "Fit reliability is low, so treat the direction as provisional until more observations arrive.",
    );
  }

  return parts.join(" ");
}

function toPoints(reports: Report[]): TrendPoint[] {
  return reports
    .map((report) => ({
      date: report.capturedAt ?? report.createdAt,
      score: report.analysis.pollutionScore,
      reportId: report.id,
      quality: report.analysis.waterQuality,
      confidence: report.analysis.confidence,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

export const TREND_META: Record<
  TrendAnalysis["direction"],
  { label: string; text: string; bg: string; arrow: "up" | "down" | "flat" }
> = {
  improving: {
    label: "Improving",
    text: "text-grade-excellent",
    bg: "bg-grade-excellent/12",
    arrow: "down",
  },
  stable: {
    label: "Stable",
    text: "text-ink-300",
    bg: "bg-white/6",
    arrow: "flat",
  },
  worsening: {
    label: "Worsening",
    text: "text-grade-critical",
    bg: "bg-grade-critical/12",
    arrow: "up",
  },
  unknown: {
    label: "Insufficient data",
    text: "text-ink-400",
    bg: "bg-white/5",
    arrow: "flat",
  },
};
