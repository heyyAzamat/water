"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster";
import "leaflet.heat";
import type { Report } from "@/types";
import { gradeForScore } from "@/lib/ai/scoring";
import { formatDate } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useI18n, useT } from "@/lib/i18n/provider";
import { intlLocale } from "@/lib/i18n/format";

/**
 * Leaflet map with severity markers, density clustering and a heat overlay.
 *
 * Written against the Leaflet API directly rather than react-leaflet: the
 * marker-cluster and heat plugins both mutate layers imperatively, and mixing
 * that with React's reconciler causes duplicate-layer bugs on every filter
 * change. One effect owns the layer lifecycle, which is far easier to reason
 * about.
 */

export type MapMode = "markers" | "heatmap" | "both";

export interface WaterMapProps {
  reports: Report[];
  mode?: MapMode;
  selectedId?: string | null;
  onSelect?: (report: Report) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** Disable interaction — used for the decorative landing-page preview. */
  interactive?: boolean;
  fitToReports?: boolean;
}

/**
 * Esri's Dark Gray Canvas — a keyless dark basemap.
 *
 * CARTO's `dark_all` used to serve keyless too, but now stamps every tile with
 * an "API KEY REQUIRED" watermark, which made the whole map unreadable. Esri
 * serves this canvas without a token and its palette matches the app's abyss
 * theme. Note the `{z}/{y}/{x}` order — ArcGIS puts row before column.
 *
 * Base and labels ship as two separate services, so the reference layer goes on
 * top of the base to restore the place names CARTO baked in.
 */
export const TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const LABEL_TILE_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
/** The canvas is only cached to z16; past that Leaflet upscales z16 tiles. */
export const TILE_MAX_NATIVE_ZOOM = 16;

export function WaterMap({
  reports,
  mode = "markers",
  selectedId,
  onSelect,
  center = [30, 20],
  zoom = 2,
  className,
  interactive = true,
  fitToReports = false,
}: WaterMapProps) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const clusterRef = React.useRef<L.MarkerClusterGroup | null>(null);
  const heatRef = React.useRef<L.HeatLayer | null>(null);
  const markersRef = React.useRef(new Map<string, L.Marker>());

  // Keep the latest callback without making the layer effect depend on it —
  // otherwise every parent render would tear down and rebuild all markers.
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  /* ------------------------------ init ------------------------------ */
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      // Added below instead, on the right — the default top-left corner is
      // occupied by the explorer's marker/heat mode toolbar, which covered the
      // zoom-in button entirely.
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 18,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 18,
      maxNativeZoom: TILE_MAX_NATIVE_ZOOM,
    }).addTo(map);

    L.tileLayer(LABEL_TILE_URL, {
      maxZoom: 18,
      maxNativeZoom: TILE_MAX_NATIVE_ZOOM,
      className: "aqua-reference-tiles",
    }).addTo(map);

    if (interactive) {
      L.control.zoom({ position: "topright" }).addTo(map);
    }

    mapRef.current = map;

    // Leaflet mis-measures its container when mounted inside a layout that is
    // still settling (drawer, tab panel, grid). One deferred invalidate fixes
    // the grey-tile-strip artefact.
    const settle = setTimeout(() => map.invalidateSize(), 220);
    // Captured here so cleanup does not read a ref that may have been swapped.
    const markers = markersRef.current;

    return () => {
      clearTimeout(settle);
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      heatRef.current = null;
      markers.clear();
    };
    // Intentionally mount-only: recentring is handled by its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------- layers ----------------------------- */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down previous layers before rebuilding.
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
      clusterRef.current = null;
    }
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    markersRef.current.clear();

    const showMarkers = mode === "markers" || mode === "both";
    const showHeat = mode === "heatmap" || mode === "both";

    if (showHeat) {
      const points = reports.map(
        (r) =>
          [r.lat, r.lng, Math.max(0.12, r.analysis.pollutionScore / 100)] as [
            number,
            number,
            number,
          ],
      );

      heatRef.current = L.heatLayer(points, {
        radius: 26,
        blur: 22,
        maxZoom: 11,
        minOpacity: 0.28,
        max: 1,
        // Matches the severity ramp so the heat colour means the same thing
        // as the marker colour.
        gradient: {
          0.0: "#34d399",
          0.28: "#a3e635",
          0.5: "#fbbf24",
          0.72: "#fb923c",
          1.0: "#f43f5e",
        },
      }).addTo(map);
    }

    if (showMarkers) {
      const cluster = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 52,
        iconCreateFunction: (clusterGroup) => {
          const children = clusterGroup.getAllChildMarkers();
          const scores = children.map(
            (m) => (m.options as { severity?: number }).severity ?? 0,
          );
          const worst = scores.length ? Math.max(...scores) : 0;
          const grade = gradeForScore(worst);
          const count = children.length;
          const size = count > 99 ? 52 : count > 9 ? 46 : 40;

          return L.divIcon({
            className: "aqua-cluster",
            iconSize: [size, size],
            html: `
              <div style="
                position:relative;width:${size}px;height:${size}px;
                display:grid;place-items:center;border-radius:50%;
                background:${grade.hex}22;
                border:1.5px solid ${grade.hex}88;
                backdrop-filter:blur(6px);
                box-shadow:0 0 0 6px ${grade.hex}12, 0 6px 20px -6px ${grade.hex}80;
                color:#fff;font-weight:600;font-size:${count > 99 ? 12 : 13}px;
                font-family:var(--font-inter),system-ui,sans-serif;
              ">${count}</div>`,
          });
        },
      });

      for (const report of reports) {
        const grade = gradeForScore(report.analysis.pollutionScore);
        const isSelected = report.id === selectedId;
        const size = isSelected ? 30 : 22;

        const marker = L.marker([report.lat, report.lng], {
          severity: report.analysis.pollutionScore,
          title: report.location?.name ?? report.title,
          alt: `${report.title} — severity ${report.analysis.pollutionScore} of 100`,
          keyboard: true,
          riseOnHover: true,
          icon: L.divIcon({
            className: "aqua-marker",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            html: `
              <div style="position:relative;width:${size}px;height:${size}px;">
                ${
                  report.analysis.pollutionScore >= 81
                    ? `<span style="position:absolute;inset:0;border-radius:50%;background:${grade.hex};opacity:.5;animation:pulse-ring 2.6s cubic-bezier(.16,1,.3,1) infinite;"></span>`
                    : ""
                }
                <span style="
                  position:absolute;inset:0;border-radius:50%;
                  background:${grade.hex};
                  border:2px solid oklch(0.145 0.014 258 / .85);
                  box-shadow:0 0 0 ${isSelected ? 5 : 3}px ${grade.hex}33, 0 4px 12px -2px oklch(0.145 0.014 258 / .8);
                  transition:all .2s;
                "></span>
              </div>`,
          }),
        } as L.MarkerOptions & { severity: number });

        if (interactive) {
          marker.bindPopup(popupHtml(report, t, dateLocale), {
            closeButton: true,
            offset: [0, -6],
            maxWidth: 300,
            className: "aqua-popup",
          });
          marker.on("click", () => onSelectRef.current?.(report));
          marker.on("keypress", (event: L.LeafletKeyboardEvent) => {
            if (event.originalEvent.key === "Enter") {
              onSelectRef.current?.(report);
            }
          });
        }

        markersRef.current.set(report.id, marker);
        cluster.addLayer(marker);
      }

      cluster.addTo(map);
      clusterRef.current = cluster;
    }

    if (fitToReports && reports.length > 1) {
      const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12, animate: false });
    }
  }, [reports, mode, selectedId, interactive, fitToReports]);

  /* --------------------- fly to external selection --------------------- */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const report = reports.find((r) => r.id === selectedId);
    if (!report) return;

    map.flyTo([report.lat, report.lng], Math.max(map.getZoom(), 11), {
      duration: 0.9,
    });

    const marker = markersRef.current.get(selectedId);
    if (marker && clusterRef.current) {
      // zoomToShowLayer un-clusters the marker before opening its popup.
      clusterRef.current.zoomToShowLayer(marker, () => marker.openPopup());
    }
  }, [selectedId, reports]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label={`Interactive map showing ${reports.length} water body assessments`}
    />
  );
}

function popupHtml(report: Report, t: Dictionary, dateLocale: string) {
  const grade = gradeForScore(report.analysis.pollutionScore);
  const tags = report.analysis.pollutionTags.slice(0, 3);

  return `
  <div style="
    overflow:hidden;border-radius:18px;
    border:1px solid oklch(1 0 0 / .12);
    background:oklch(0.205 0.017 258 / .97);
    backdrop-filter:blur(20px);
    font-family:var(--font-inter),system-ui,sans-serif;
  ">
    <div style="position:relative;height:118px;overflow:hidden;">
      <img src="${escapeAttr(report.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
      <div style="position:absolute;inset:0;background:linear-gradient(to top, oklch(0.145 0.014 258 / .92), transparent 65%);"></div>
      <div style="
        position:absolute;top:8px;left:8px;
        display:inline-flex;align-items:center;gap:5px;
        padding:3px 8px;border-radius:999px;
        background:${grade.hex}26;border:1px solid ${grade.hex}66;
        color:${grade.hex};font-size:11px;font-weight:600;
      ">
        <span style="width:5px;height:5px;border-radius:50%;background:${grade.hex};"></span>
        ${escapeHtml(t.grades[grade.quality].label)} · ${report.analysis.pollutionScore}
      </div>
    </div>

    <div style="padding:12px 14px 14px;">
      <div style="font-size:13.5px;font-weight:600;color:oklch(0.97 0.004 258);line-height:1.35;">
        ${escapeHtml(report.location?.name ?? report.title)}
      </div>
      <div style="margin-top:3px;font-size:11.5px;color:oklch(0.545 0.021 258);">
        ${escapeHtml([report.location?.region, report.location?.country].filter(Boolean).join(", ") || t.ui.unmappedLocation)}
        · ${formatDate(report.capturedAt ?? report.createdAt, false, dateLocale)}
      </div>

      ${
        tags.length
          ? `<div style="margin-top:9px;display:flex;flex-wrap:wrap;gap:4px;">
              ${tags
                .map(
                  (tag) => `<span style="
                    padding:2px 7px;border-radius:6px;font-size:10.5px;
                    background:oklch(1 0 0 / .07);color:oklch(0.775 0.016 258);
                    border:1px solid oklch(1 0 0 / .08);
                  ">${escapeHtml(t.domain.indicators[tag].label)}</span>`,
                )
                .join("")}
            </div>`
          : ""
      }

      <div style="margin-top:11px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span style="font-size:11px;color:oklch(0.545 0.021 258);">
          ${escapeHtml(report.author.name)} · ${report.analysis.confidence}% conf.
        </span>
        <a href="/reports/${escapeAttr(report.id)}" style="
          display:inline-flex;align-items:center;gap:4px;
          padding:5px 10px;border-radius:9px;text-decoration:none;
          background:linear-gradient(135deg, oklch(0.78 0.14 206), oklch(0.59 0.185 269));
          color:oklch(0.145 0.014 258);font-size:11.5px;font-weight:600;
        ">${escapeHtml(t.ui.moderation.openReport)} →</a>
      </div>
    </div>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return value.replace(/"/g, "&quot;");
}
