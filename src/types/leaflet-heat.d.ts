/**
 * Ambient types for `leaflet.heat`, which ships no declarations.
 *
 * This must be a module augmentation (note the bare `import "leaflet"`) rather
 * than a plain `declare module` block — the latter would shadow @types/leaflet
 * entirely instead of adding to it.
 */
import "leaflet";

declare module "leaflet" {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: Array<[number, number, number?]>): this;
    addLatLng(latlng: [number, number, number?]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }

  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions,
  ): HeatLayer;
}

declare module "leaflet.heat";
