"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { WaterBodyType, WaterLocation } from "@/types";
import { GRADES } from "@/lib/ai/scoring";
import { cn, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NativeSelect } from "@/components/ui/field";

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

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "worst", label: "Worst first" },
  { value: "best", label: "Cleanest first" },
  { value: "popular", label: "Most viewed" },
] as const;

/**
 * URL-driven filter bar.
 *
 * State lives entirely in the query string, so a filtered view is shareable,
 * survives a refresh, and lets the server component do the filtering.
 */
export function ReportFilters({
  locations,
  regions,
  total,
}: {
  locations: WaterLocation[];
  regions: string[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [expanded, setExpanded] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Autocomplete is derived, not stored: the location list is already in
  // memory, so an effect + state would just be a slower copy of it.
  const suggestions = React.useMemo<WaterLocation[]>(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];

    return locations
      .filter(
        (location) =>
          location.name.toLowerCase().includes(needle) ||
          location.region?.toLowerCase().includes(needle) ||
          location.country?.toLowerCase().includes(needle),
      )
      .slice(0, 6);
  }, [query, locations]);

  const push = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page"); // any filter change resets pagination
      router.push(next.toString() ? `/reports?${next}` : "/reports");
    },
    [params, router],
  );

  // Debounced search — 320 ms is long enough to skip intermediate keystrokes
  // and short enough that it still feels live.
  React.useEffect(() => {
    const current = params.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => {
      push((next) => {
        if (query.trim()) next.set("q", query.trim());
        else next.delete("q");
      });
    }, 320);

    return () => clearTimeout(timer);
  }, [query, params, push]);

  const active = {
    quality: params.get("quality") ?? "all",
    type: params.get("type") ?? "all",
    region: params.get("region") ?? "all",
    sort: params.get("sort") ?? "recent",
    minScore: params.get("minScore") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    locationId: params.get("locationId") ?? "",
  };

  const activeCount = [
    active.quality !== "all",
    active.type !== "all",
    active.region !== "all",
    Boolean(active.minScore),
    Boolean(active.from),
    Boolean(active.to),
    Boolean(active.locationId),
  ].filter(Boolean).length;

  const pinnedLocation = locations.find((l) => l.id === active.locationId);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
            placeholder="Search reports, rivers, lakes, regions…"
            aria-label="Search reports"
            className="pl-9"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-autocomplete="list"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-white/12 bg-ink-850/96 p-1.5 shadow-2xl backdrop-blur-2xl"
            >
              {suggestions.map((location) => (
                <li key={location.id}>
                  <button
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery("");
                      setShowSuggestions(false);
                      push((next) => {
                        next.delete("q");
                        next.set("locationId", location.id);
                      });
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/8"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-ink-100">
                        {location.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-500">
                        {[location.region, location.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                    <Badge variant="outline" size="sm">
                      {titleCase(location.type)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <NativeSelect
          value={active.sort}
          onChange={(e) =>
            push((next) => {
              if (e.target.value === "recent") next.delete("sort");
              else next.set("sort", e.target.value);
            })
          }
          aria-label="Sort reports"
          className="sm:w-44"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </NativeSelect>

        <Button
          variant={expanded ? "secondary" : "outline"}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <SlidersHorizontal />
          Filters
          {activeCount > 0 && (
            <Badge variant="brand" size="sm">
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 border-t border-white/8 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Water quality"
            value={active.quality}
            onChange={(value) =>
              push((next) => {
                if (value === "all") next.delete("quality");
                else next.set("quality", value);
              })
            }
            options={[
              { value: "all", label: "All grades" },
              ...GRADES.map((g) => ({
                value: g.quality,
                label: `${g.quality} (${g.min}–${g.max})`,
              })),
            ]}
          />

          <FilterSelect
            label="Water body type"
            value={active.type}
            onChange={(value) =>
              push((next) => {
                if (value === "all") next.delete("type");
                else next.set("type", value);
              })
            }
            options={WATER_TYPES.map((type) => ({
              value: type,
              label: type === "all" ? "All types" : titleCase(type),
            }))}
          />

          <FilterSelect
            label="Region"
            value={active.region}
            onChange={(value) =>
              push((next) => {
                if (value === "all") next.delete("region");
                else next.set("region", value);
              })
            }
            options={[
              { value: "all", label: "All regions" },
              ...regions.map((region) => ({ value: region, label: region })),
            ]}
          />

          <FilterSelect
            label="Minimum severity"
            value={active.minScore || "0"}
            onChange={(value) =>
              push((next) => {
                if (value === "0") next.delete("minScore");
                else next.set("minScore", value);
              })
            }
            options={[
              { value: "0", label: "Any severity" },
              { value: "21", label: "21+ (Good and worse)" },
              { value: "41", label: "41+ (Moderate and worse)" },
              { value: "61", label: "61+ (Poor and worse)" },
              { value: "81", label: "81+ (Critical only)" },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="from"
              className="text-[11.5px] font-medium text-ink-500"
            >
              Captured from
            </label>
            <Input
              id="from"
              type="date"
              value={active.from}
              onChange={(e) =>
                push((next) => {
                  if (e.target.value) next.set("from", e.target.value);
                  else next.delete("from");
                })
              }
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="to" className="text-[11.5px] font-medium text-ink-500">
              Captured until
            </label>
            <Input
              id="to"
              type="date"
              value={active.to}
              onChange={(e) =>
                push((next) => {
                  if (e.target.value) next.set("to", e.target.value);
                  else next.delete("to");
                })
              }
              className="h-10"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3.5">
        <p className="text-[12.5px] text-ink-500">
          <span className="font-semibold text-ink-200">{total}</span> report
          {total === 1 ? "" : "s"}
        </p>

        {pinnedLocation && (
          <Badge variant="brand" size="sm">
            {pinnedLocation.name}
            <button
              onClick={() => push((next) => next.delete("locationId"))}
              aria-label={`Remove ${pinnedLocation.name} filter`}
              className="ml-0.5 rounded hover:text-white"
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setQuery("");
              router.push("/reports");
            }}
          >
            <X />
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11.5px] font-medium text-ink-500">
        {label}
      </label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const params = useSearchParams();
  const router = useRouter();

  if (totalPages <= 1) return null;

  const go = (target: number) => {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    router.push(next.toString() ? `/reports?${next}` : "/reports");
  };

  // Keep the control compact on wide result sets: first, last, and a window
  // around the current page.
  const window = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const pages = [...window]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>

      {pages.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="px-1 text-ink-600" aria-hidden>
              …
            </span>
          )}
          <button
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "size-8 rounded-lg text-[13px] font-medium transition-colors",
              p === page
                ? "bg-white/12 text-white"
                : "text-ink-400 hover:bg-white/6 hover:text-ink-100",
            )}
          >
            {p}
          </button>
        </React.Fragment>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
}
