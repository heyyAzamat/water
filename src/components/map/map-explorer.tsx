"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Flame,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Report, WaterBodyType, WaterQuality } from "@/types";
import { GRADES, gradeForScore } from "@/lib/ai/scoring";
import { cn, formatCoords, formatDate, timeAgo } from "@/lib/utils";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NativeSelect } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { EmptyState, QualityBadge, ScoreChip } from "@/components/shared/primitives";
import type { MapMode } from "./water-map";

// Leaflet touches `window` at import time, so it can never be server-rendered.
const WaterMap = dynamic(() => import("./water-map").then((m) => m.WaterMap), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-ink-900/40">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-aqua-400" />
        <p className="text-[12.5px] text-ink-500">Loading map tiles…</p>
      </div>
    </div>
  ),
});

const WATER_TYPES: Array<WaterBodyType | "all"> = [
  "all",
  "river",
  "lake",
  "reservoir",
  "pond",
  "canal",
  "wetland",
  "sea",
];

interface Filters {
  query: string;
  quality: WaterQuality | "all";
  waterType: WaterBodyType | "all";
  region: string;
  minScore: number;
  /** Window length in days, purely for the select's own value. 0 = all time. */
  days: number;
  /**
   * Absolute cutoff, resolved when the user picks a window rather than on every
   * render — a relative `Date.now()` would drift between renders and make the
   * filtered set unstable.
   */
  cutoff: number | null;
}

const INITIAL_FILTERS: Filters = {
  query: "",
  quality: "all",
  waterType: "all",
  region: "all",
  minScore: 0,
  days: 0,
  cutoff: null,
};

export function MapExplorer({ reports }: { reports: Report[] }) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const [filters, setFilters] = React.useState<Filters>(INITIAL_FILTERS);
  const [mode, setMode] = React.useState<MapMode>("markers");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  const regions = React.useMemo(() => {
    const set = new Set<string>();
    for (const report of reports) {
      if (report.location?.region) set.add(report.location.region);
    }
    return [...set].sort();
  }, [reports]);

  const filtered = React.useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    const cutoff = filters.cutoff;

    return reports.filter((report) => {
      if (filters.quality !== "all" && report.analysis.waterQuality !== filters.quality)
        return false;
      if (filters.waterType !== "all" && report.location?.type !== filters.waterType)
        return false;
      if (filters.region !== "all" && report.location?.region !== filters.region)
        return false;
      if (report.analysis.pollutionScore < filters.minScore) return false;
      if (cutoff && new Date(report.capturedAt ?? report.createdAt).getTime() < cutoff)
        return false;

      if (needle) {
        const haystack = [
          report.title,
          report.location?.name,
          report.location?.region,
          report.location?.country,
          report.location?.type,
          ...report.analysis.detectedObjects,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [reports, filters]);

  const selected = filtered.find((r) => r.id === selectedId) ?? null;
  const activeFilterCount =
    (filters.quality !== "all" ? 1 : 0) +
    (filters.waterType !== "all" ? 1 : 0) +
    (filters.region !== "all" ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.days > 0 ? 1 : 0);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] min-h-140 flex-col overflow-hidden lg:flex-row">
      {/* ------------------------------ Sidebar ------------------------------ */}
      <aside
        className={cn(
          "z-[1002] flex w-full shrink-0 flex-col border-white/8 bg-abyss-1000/92 backdrop-blur-2xl lg:z-20 lg:w-96 lg:border-r lg:bg-abyss-1000/70",
          "absolute inset-0 transition-transform duration-300 lg:relative lg:translate-x-0",
          panelOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label={t.ui.mapExplorer.panelLabel}
      >
        <div className="border-b border-white/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-50">
              {t.ui.mapExplorer.title}
            </h1>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setPanelOpen(false)}
              aria-label={t.ui.mapExplorer.closeFilters}
            >
              <X />
            </Button>
          </div>

          <div className="relative mt-3.5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <Input
              type="search"
              value={filters.query}
              onChange={(e) => set("query", e.target.value)}
              placeholder={t.ui.mapExplorer.searchPlaceholder}
              className="pl-9"
              aria-label={t.ui.mapExplorer.searchLabel}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <NativeSelect
              value={filters.quality}
              onChange={(e) => set("quality", e.target.value as Filters["quality"])}
              aria-label={t.ui.mapExplorer.filterQuality}
              className="h-9 text-[13px]"
            >
              <option value="all">{t.ui.moderation.allGrades}</option>
              {GRADES.map((grade) => (
                <option key={grade.quality} value={grade.quality}>
                  {t.grades[grade.quality].label} ({grade.min}–{grade.max})
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={filters.waterType}
              onChange={(e) => set("waterType", e.target.value as Filters["waterType"])}
              aria-label={t.ui.mapExplorer.filterType}
              className="h-9 text-[13px]"
            >
              {WATER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "all"
                    ? t.ui.mapExplorer.allTypes
                    : t.domain.waterBody[type]}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={filters.region}
              onChange={(e) => set("region", e.target.value)}
              aria-label={t.ui.mapExplorer.filterRegion}
              className="h-9 text-[13px]"
            >
              <option value="all">{t.ui.moderation.allRegions}</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </NativeSelect>

            <NativeSelect
              value={String(filters.days)}
              onChange={(e) => {
                const days = Number(e.target.value);
                setFilters((prev) => ({
                  ...prev,
                  days,
                  cutoff: days > 0 ? Date.now() - days * 86_400_000 : null,
                }));
              }}
              aria-label={t.ui.mapExplorer.filterDate}
              className="h-9 text-[13px]"
            >
              <option value="0">{t.ui.moderation.anyDate}</option>
              <option value="30">{t.ui.moderation.last30}</option>
              <option value="90">{t.ui.moderation.last90}</option>
              <option value="365">{t.ui.moderation.lastYear}</option>
            </NativeSelect>
          </div>

          <div className="mt-4">
            <label
              htmlFor="min-severity"
              className="flex items-center justify-between text-[12px] text-ink-400"
            >
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5" aria-hidden />
                {t.ui.mapExplorer.minSeverity}
              </span>
              <span className="font-semibold tabular-nums text-ink-200">
                {filters.minScore}
              </span>
            </label>
            <input
              id="min-severity"
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minScore}
              onChange={(e) => set("minScore", Number(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-grade-excellent via-grade-moderate to-grade-critical [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-abyss-1000 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[12.5px] text-ink-500">
              {fmt(t.ui.mapExplorer.shownOf, {
                shown: filtered.length,
                total: reports.length,
              })}
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(INITIAL_FILTERS)}
              >
                <X />
                {fmt(t.ui.mapExplorer.clearCount, { count: activeFilterCount })}
              </Button>
            )}
          </div>
        </div>

        {/* Result list */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Filter />}
              title={t.ui.mapExplorer.emptyTitle}
              description={t.ui.mapExplorer.emptyBody}
              className="mt-6"
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.slice(0, 120).map((report) => (
                <li key={report.id}>
                  <button
                    onClick={() => {
                      setSelectedId(report.id);
                      setPanelOpen(false);
                    }}
                    aria-current={report.id === selectedId}
                    className={cn(
                      "group flex w-full gap-3 rounded-xl border p-2.5 text-left transition-all duration-200",
                      report.id === selectedId
                        ? "border-aqua-400/35 bg-aqua-400/8"
                        : "border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.05]",
                    )}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-1"
                        style={{
                          background: gradeForScore(report.analysis.pollutionScore).hex,
                        }}
                        aria-hidden
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-ink-100">
                          {report.location?.name ?? report.title}
                        </span>
                        <ScoreChip score={report.analysis.pollutionScore} />
                      </span>
                      <span className="mt-1 block truncate text-[11.5px] text-ink-500">
                        {[report.location?.region, report.location?.country]
                          .filter(Boolean)
                          .join(", ") || t.ui.unmapped}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-600">
                        <span>{timeAgo(report.capturedAt ?? report.createdAt, dateLocale)}</span>
                        {report.analysis.pollutionTags.length > 0 && (
                          <span className="truncate">
                            ·{" "}
                            {fmt(t.ui.mapExplorer.indicators, {
                              count: report.analysis.pollutionTags.length,
                            })}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length > 120 && (
                <li className="px-2 py-3 text-center text-[12px] text-ink-600">
                  {fmt(t.ui.mapExplorer.truncated, { count: 120 })}
                </li>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* -------------------------------- Map -------------------------------- */}
      <div className="relative min-h-0 flex-1">
        <WaterMap
          reports={filtered}
          mode={mode}
          selectedId={selectedId}
          onSelect={(report) => setSelectedId(report.id)}
          className="size-full"
        />

        {/* Layer switch */}
        <div className="pointer-events-auto absolute left-3 top-3 z-[1001] flex flex-wrap gap-2 lg:left-4 lg:top-4">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setPanelOpen(true)}
          >
            <Filter />
            {t.ui.mapExplorer.filters}
            {activeFilterCount > 0 && (
              <Badge variant="brand" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <div
            className="flex overflow-hidden rounded-xl border border-white/10 bg-ink-950/75 p-1 backdrop-blur-2xl"
            role="radiogroup"
            aria-label={t.ui.mapExplorer.layerLabel}
          >
            {(
              [
                {
                  value: "markers",
                  label: t.ui.mapExplorer.layerPins,
                  icon: MapPin,
                },
                {
                  value: "heatmap",
                  label: t.ui.mapExplorer.layerHeat,
                  icon: Flame,
                },
                {
                  value: "both",
                  label: t.ui.mapExplorer.layerBoth,
                  icon: Layers,
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                role="radio"
                aria-checked={mode === option.value}
                onClick={() => setMode(option.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  mode === option.value
                    ? "bg-white/12 text-white"
                    : "text-ink-400 hover:bg-white/6 hover:text-ink-100",
                )}
              >
                <option.icon className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="pointer-events-none absolute bottom-6 left-3 z-10 rounded-xl border border-white/10 bg-ink-950/75 p-3 backdrop-blur-2xl lg:left-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">
            Severity
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1.5 w-28 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg,#34d399,#a3e635,#fbbf24,#fb923c,#f43f5e)",
              }}
              aria-hidden
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-ink-600">
            <span>0 clean</span>
            <span>100 critical</span>
          </div>
        </div>

        {/* Selected report card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 bottom-3 z-10 lg:inset-x-auto lg:right-4 lg:bottom-6 lg:w-88"
            >
              <div className="overflow-hidden rounded-2xl border border-white/12 bg-ink-900/92 backdrop-blur-2xl">
                <div className="relative h-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.imageUrl}
                    alt={`Water surface at ${selected.location?.name ?? selected.title}`}
                    className="size-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-ink-950/92 to-transparent"
                    aria-hidden
                  />
                  <button
                    onClick={() => setSelectedId(null)}
                    className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-ink-950/70 text-ink-300 backdrop-blur transition-colors hover:text-white"
                    aria-label={t.ui.mapExplorer.closePreview}
                  >
                    <X className="size-3.5" />
                  </button>
                  <div className="absolute bottom-3 left-3 right-3">
                    <QualityBadge
                      quality={selected.analysis.waterQuality}
                      score={selected.analysis.pollutionScore}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="p-4">
                  <h2 className="text-[14.5px] font-semibold leading-snug text-ink-50">
                    {selected.location?.name ?? selected.title}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] text-ink-500">
                    {formatCoords(selected.lat, selected.lng)}
                  </p>
                  <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-relaxed text-ink-400">
                    {selected.analysis.explanation}
                  </p>

                  {selected.analysis.pollutionTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selected.analysis.pollutionTags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" size="sm">
                          {t.domain.indicators[tag].label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <span className="text-[11.5px] text-ink-500">
                      {formatDate(selected.capturedAt ?? selected.createdAt, false, dateLocale)}{" "}
                      ·{" "}
                      {selected.author.name}
                    </span>
                    <Button asChild size="sm">
                      <Link href={`/reports/${selected.id}`}>Open report</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Landing-page preview: non-interactive map with a live report overlay. */
export function MapPreview({ reports }: { reports: Report[] }) {
  const critical = React.useMemo(
    () =>
      [...reports]
        .sort((a, b) => b.analysis.pollutionScore - a.analysis.pollutionScore)
        .slice(0, 5),
    [reports],
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-ink-900/60 backdrop-blur-2xl">
      <div className="relative h-100 sm:h-125">
        <WaterMap
          reports={reports}
          mode="both"
          interactive={false}
          center={[26, 30]}
          zoom={2}
          className="size-full"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/30"
          aria-hidden
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="rounded-2xl border border-white/10 bg-ink-950/80 p-4 backdrop-blur-2xl">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              Highest severity right now
            </p>
            <ul className="mt-2.5 flex flex-col gap-2">
              {critical.map((report) => (
                <li key={report.id} className="flex items-center gap-2.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background: gradeForScore(report.analysis.pollutionScore).hex,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-200">
                    {report.location?.name ?? report.title}
                  </span>
                  <ScoreChip score={report.analysis.pollutionScore} />
                </li>
              ))}
            </ul>
          </div>

          <Button asChild size="lg">
            <Link href="/map">
              <MapPin aria-hidden />
              Open the full map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return <Skeleton className="h-100 w-full rounded-3xl sm:h-125" />;
}
