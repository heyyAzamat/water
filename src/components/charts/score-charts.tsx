"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PollutionTag, TrendAnalysis, WaterQuality } from "@/types";
import { GRADES, gradeForScore } from "@/lib/ai/scoring";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

/**
 * Chart set for score history and distribution.
 *
 * Colour is never decorative here: every fill comes from the severity ramp, so
 * a band's colour on a chart means exactly what it means on the map.
 */

const AXIS = {
  stroke: "oklch(0.42 0.02 258)",
  fontSize: 11,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: Record<string, unknown> }>;
  label?: string | number;
  valueLabel?: string;
}) {
  const t = useT();

  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value ?? 0);
  const grade = gradeForScore(value);
  const extra = payload[0]?.payload as Record<string, unknown> | undefined;

  return (
    <div className="rounded-xl border border-white/12 bg-abyss-900/95 px-3 py-2 shadow-xl backdrop-blur-xl">
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span
          className="text-[15px] font-semibold tabular-nums"
          style={{ color: grade.hex }}
        >
          {value}
        </span>
        <span className="text-[11px] text-ink-500">
          /100 · {valueLabel ?? t.ui.charts.severity}
        </span>
      </p>
      {typeof extra?.confidence === "number" && (
        <p className="mt-1 text-[11px] text-ink-500">
          {fmt(t.pages.dashboard.confidence, { value: extra.confidence })}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Trend line — a location's score history with projection
 * ------------------------------------------------------------------ */

export function TrendChart({
  trend,
  height = 260,
}: {
  trend: TrendAnalysis;
  height?: number;
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);

  const data = React.useMemo(() => {
    const points = trend.points.map((point) => ({
      label: formatDate(point.date, false, dateLocale),
      score: point.score,
      confidence: point.confidence,
      projected: null as number | null,
    }));

    // The projection is drawn as a separate dashed series that starts at the
    // last real observation, so it reads as a forecast, not as data.
    if (trend.projectedScore !== null && points.length > 0) {
      points[points.length - 1] = {
        ...points[points.length - 1],
        projected: points[points.length - 1].score,
      };
      points.push({
        label: t.ui.charts.projection,
        score: null as unknown as number,
        confidence: 0,
        projected: trend.projectedScore,
      });
    }

    return points;
  }, [trend, dateLocale, t]);

  if (trend.points.length < 2) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-white/10 text-center"
        style={{ height }}
      >
        <p className="max-w-xs px-4 text-[13px] leading-relaxed text-ink-500">
          {t.ui.charts.needSecondPoint}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.755 0.135 192)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="oklch(0.755 0.135 192)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize }}
          axisLine={{ stroke: "oklch(1 0 0 / 0.08)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
          tick={{ fill: AXIS.stroke, fontSize: AXIS.fontSize }}
          axisLine={false}
          tickLine={false}
          width={44}
        />

        {/* Band boundaries — orientation without a legend */}
        {GRADES.slice(0, -1).map((grade) => (
          <ReferenceLine
            key={grade.quality}
            y={grade.max}
            stroke={grade.hex}
            strokeOpacity={0.18}
            strokeDasharray="4 6"
          />
        ))}

        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(1 0 0 / 0.14)" }} />

        <Area
          type="monotone"
          dataKey="score"
          stroke="oklch(0.82 0.11 193)"
          strokeWidth={2.25}
          fill="url(#trend-fill)"
          dot={{ r: 3, fill: "oklch(0.145 0.014 258)", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />

        <Area
          type="monotone"
          dataKey="projected"
          stroke="oklch(0.71 0.16 272)"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="none"
          dot={{ r: 3.5, fill: "oklch(0.145 0.014 258)", strokeWidth: 2 }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Personal score history
 * ------------------------------------------------------------------ */

export function ScoreHistoryChart({
  points,
  height = 200,
}: {
  points: Array<{ date: string; score: number; label?: string }>;
  height?: number;
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);

  const data = points.map((p) => ({
    label: p.label ?? formatDate(p.date, false, dateLocale),
    score: p.score,
  }));

  if (data.length === 0) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-white/10"
        style={{ height }}
      >
        <p className="text-[13px] text-ink-500">
          {t.ui.moderation.noAssessments}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS.stroke, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tick={{ fill: AXIS.stroke, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "oklch(1 0 0 / 0.14)" }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="oklch(0.755 0.135 192)"
          strokeWidth={2}
          dot={{ r: 2.5, strokeWidth: 0, fill: "oklch(0.82 0.11 193)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Grade distribution
 * ------------------------------------------------------------------ */

export function QualityDistributionChart({
  breakdown,
  height = 200,
}: {
  breakdown: Record<WaterQuality, number>;
  height?: number;
}) {
  const t = useT();

  const data = GRADES.map((grade) => ({
    label: t.grades[grade.quality].label,
    count: breakdown[grade.quality] ?? 0,
    hex: grade.hex,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: AXIS.stroke, fontSize: 10.5 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: AXIS.stroke, fontSize: 10.5 }}
          axisLine={false}
          tickLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-xl border border-white/12 bg-abyss-900/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                <p className="text-[11px] text-ink-500">{label}</p>
                <p className="text-[15px] font-semibold text-ink-50">
                  {fmt(t.ui.filters.totalReports, {
                    count: Number(payload[0].value ?? 0),
                  })}
                </p>
              </div>
            ) : null
          }
          cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={54}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.hex} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Indicator matrix — horizontal severity bars
 * ------------------------------------------------------------------ */

export function IndicatorBars({
  indicators,
}: {
  indicators: Array<{
    key: PollutionTag | "clarity";
    severity: number;
    note?: string;
    detected: boolean;
  }>;
}) {
  const t = useT();

  if (indicators.length === 0) {
    return (
      <p className="text-[13px] text-ink-500">{t.ui.charts.noIndicators}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {[...indicators]
        .sort((a, b) => b.severity - a.severity)
        .map((indicator) => {
          const grade = gradeForScore(indicator.severity);
          return (
            <li key={indicator.key}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] text-ink-200">
                  {t.domain.indicators[indicator.key].label}
                  {!indicator.detected && (
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-ink-600">
                      {t.ui.charts.belowThreshold}
                    </span>
                  )}
                </span>
                <span
                  className="text-[12.5px] font-semibold tabular-nums"
                  style={{ color: grade.hex }}
                >
                  {indicator.severity}
                </span>
              </div>

              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${indicator.severity}%`,
                    background: grade.hex,
                    opacity: indicator.detected ? 1 : 0.45,
                  }}
                />
              </div>

              {indicator.note && (
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-500">
                  {indicator.note}
                </p>
              )}
            </li>
          );
        })}
    </ul>
  );
}
