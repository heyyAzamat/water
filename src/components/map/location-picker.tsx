"use client";

import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { WaterLocation } from "@/types";
import { useT } from "@/lib/i18n/provider";
import { LABEL_TILE_URL, TILE_MAX_NATIVE_ZOOM, TILE_URL } from "./water-map";

/**
 * Shorter than the explorer's credit line: the picker map is 256 px tall on a
 * phone, where the full attribution wraps to two lines and sits on top of the
 * map. Still names both tile sources, which is what Esri and OSM require.
 */
const COMPACT_ATTRIBUTION =
  '&copy; <a href="https://www.esri.com">Esri</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export interface LocationPickerProps {
  /** Currently marked point, or null when nothing has been placed yet. */
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  /** Known water bodies, drawn as reference pins the reporter can snap to. */
  locations?: WaterLocation[];
  /** Called when one of those reference pins is clicked. */
  onPickExisting?: (id: string) => void;
  /** Id of the currently selected known water body, highlighted on the map. */
  selectedId?: string | null;
  disabled?: boolean;
  className?: string;
}

/** Coordinates are only meaningful to ~1 m at six decimals. */
const PRECISION = 6;
const round = (n: number) => Number(n.toFixed(PRECISION));

/** Roughly Kazakhstan, so the first view is somewhere plausible for the user. */
const FALLBACK_CENTER: [number, number] = [48.0, 67.0];
const FALLBACK_ZOOM = 4;
const PLACED_ZOOM = 13;

function pinIcon(active: boolean) {
  const size = active ? 30 : 16;
  return L.divIcon({
    className: "aqua-pick-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: active
      ? `<div style="position:relative;width:${size}px;height:${size}px;">
           <span style="position:absolute;inset:0;border-radius:50%;background:#22d3ee;opacity:.35;animation:pulse-ring 2.6s cubic-bezier(.16,1,.3,1) infinite;"></span>
           <span style="position:absolute;inset:6px;border-radius:50%;background:#22d3ee;border:2px solid oklch(0.145 0.014 258 / .85);box-shadow:0 4px 14px -4px #22d3eecc;"></span>
         </div>`
      : `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:#5eead433;border:1.5px solid #5eead4aa;"></span>`,
  });
}

/**
 * Click-to-place location picker.
 *
 * The upload form previously accepted coordinates only as two decimal inputs,
 * which nobody has to hand while standing at a river. Here the reporter drops a
 * pin, drags it to correct it, or clicks one of the known water bodies to reuse
 * its exact position. The numeric inputs stay in the form and are kept in sync
 * both ways, so a pasted coordinate still works.
 */
export function LocationPicker({
  value,
  onChange,
  locations = [],
  onPickExisting,
  selectedId,
  disabled = false,
  className,
}: LocationPickerProps) {
  const t = useT();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const pinRef = React.useRef<L.Marker | null>(null);
  const refLayerRef = React.useRef<L.LayerGroup | null>(null);

  // Keep callbacks off the effect dependency lists — the map is built once and
  // rebuilding it on every parent render would drop the user's pan and zoom.
  const onChangeRef = React.useRef(onChange);
  const onPickExistingRef = React.useRef(onPickExisting);
  const disabledRef = React.useRef(disabled);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onPickExistingRef.current = onPickExisting;
    disabledRef.current = disabled;
  }, [onChange, onPickExisting, disabled]);

  /* ------------------------------ init ------------------------------ */
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: value ? [value.lat, value.lng] : FALLBACK_CENTER,
      zoom: value ? PLACED_ZOOM : FALLBACK_ZOOM,
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 18,
    });

    // Drops the "Leaflet" prefix, which is optional and costs a whole line here.
    map.attributionControl.setPrefix(false);

    L.tileLayer(TILE_URL, {
      attribution: COMPACT_ATTRIBUTION,
      maxZoom: 18,
      maxNativeZoom: TILE_MAX_NATIVE_ZOOM,
    }).addTo(map);

    L.tileLayer(LABEL_TILE_URL, {
      maxZoom: 18,
      maxNativeZoom: TILE_MAX_NATIVE_ZOOM,
      className: "aqua-reference-tiles",
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (disabledRef.current) return;
      onChangeRef.current(round(e.latlng.lat), round(e.latlng.lng));
    });

    refLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Leaflet mis-measures a container that is still settling inside the form
    // grid; one deferred invalidate avoids the grey-tile-strip artefact.
    const settle = setTimeout(() => map.invalidateSize(), 220);

    return () => {
      clearTimeout(settle);
      map.remove();
      mapRef.current = null;
      pinRef.current = null;
      refLayerRef.current = null;
    };
    // Mount-only: `value` is followed by its own effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------- reference pins ------------------------- */
  React.useEffect(() => {
    const layer = refLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const location of locations) {
      if (location.id === selectedId) continue;
      L.marker([location.lat, location.lng], {
        icon: pinIcon(false),
        keyboard: false,
        interactive: !disabled,
      })
        .bindTooltip(location.name, { direction: "top", offset: [0, -8] })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          if (disabledRef.current) return;
          onPickExistingRef.current?.(location.id);
        })
        .addTo(layer);
    }
  }, [locations, selectedId, disabled]);

  /* ----------------------------- the pin ----------------------------- */
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      if (pinRef.current) {
        map.removeLayer(pinRef.current);
        pinRef.current = null;
      }
      return;
    }

    const position: L.LatLngExpression = [value.lat, value.lng];

    if (!pinRef.current) {
      pinRef.current = L.marker(position, {
        icon: pinIcon(true),
        draggable: !disabled,
        autoPan: true,
      })
        .on("dragend", (e) => {
          const { lat, lng } = (e.target as L.Marker).getLatLng();
          onChangeRef.current(round(lat), round(lng));
        })
        .addTo(map);
    } else {
      pinRef.current.setLatLng(position);
      // `dragging` is only present once Leaflet has initialised the handler.
      if (disabled) pinRef.current.dragging?.disable();
      else pinRef.current.dragging?.enable();
    }

    // Follow the pin only when it lands outside the current view — otherwise a
    // small drag correction would yank the map away from what the user framed.
    if (!map.getBounds().contains(position)) {
      map.setView(position, Math.max(map.getZoom(), PLACED_ZOOM));
    }
  }, [value, disabled]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        role="application"
        aria-label={t.ui.upload.pickerLabel}
        className="h-64 w-full overflow-hidden rounded-xl border border-white/10 sm:h-72"
      />
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
        {value ? t.ui.upload.pickerHintPlaced : t.ui.upload.pickerHintEmpty}
      </p>
    </div>
  );
}
