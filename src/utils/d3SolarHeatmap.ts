import * as d3 from 'd3';
import L from 'leaflet';

export interface SolarPoint {
  lat: number;
  lng: number;
  ghi: number; // Global Horizontal Irradiance in kWh/m²/day
}

/**
 * Calculates synthetic yet regionally accurate Solar GHI (kWh/m²/day) based on geographic coordinates.
 * High in Sahel & Northern Africa / East Africa (5.8 - 6.6), moderate in tropical coastal zones (4.2 - 5.0).
 */
export function estimateSolarGHI(lat: number, lng: number): number {
  // Base insolation by latitude (higher near desert/sahel 12°-20°N)
  let base = 5.2;

  // Sahel & Northern dry belt boost
  if (lat > 8 && lat < 22 && lng > -18 && lng < 45) {
    base += (lat - 8) * 0.12;
  }
  // Coastal tropical cloud cover depression
  if (lat >= 3 && lat <= 7 && lng >= 2 && lng <= 10) {
    base -= 0.5; // Coastal Gulf of Guinea
  }
  // East African Rift Valley high solar
  if (lat >= -5 && lat <= 5 && lng >= 34 && lng <= 39) {
    base += 0.8;
  }

  // Smooth sinusoidal variations
  const variation = Math.sin(lat * 3.5) * 0.2 + Math.cos(lng * 2.8) * 0.15;
  const result = Math.max(3.6, Math.min(6.8, base + variation));
  return Math.round(result * 10) / 10;
}

export class D3SolarHeatmapLayer {
  private map: L.Map;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private colorScale: d3.ScaleSequential<string, number>;
  private isVisible: boolean = false;
  private onMoveHandler: () => void;

  constructor(map: L.Map) {
    this.map = map;
    // Sequential color scale from Yellow to Orange to Deep Red (YlOrRd)
    this.colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([3.8, 6.4]);

    this.onMoveHandler = () => this.update();
  }

  public enable() {
    if (this.isVisible) return;
    this.isVisible = true;

    // Create SVG overlay inside Leaflet overlayPane
    const overlayPane = this.map.getPanes().overlayPane;
    const svgElement = d3.select(overlayPane).append('svg')
      .attr('class', 'd3-solar-heatmap-overlay')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('z-index', '400');

    this.svg = svgElement;

    // Add filter defs for Gaussian blur to create smooth heatmap blend
    const defs = this.svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'solar-heat-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', 28)
      .attr('result', 'blur');

    this.g = this.svg.append('g').attr('filter', 'url(#solar-heat-blur)');

    this.map.on('move', this.onMoveHandler);
    this.map.on('zoom', this.onMoveHandler);

    this.update();
  }

  public disable() {
    if (!this.isVisible) return;
    this.isVisible = false;

    this.map.off('move', this.onMoveHandler);
    this.map.off('zoom', this.onMoveHandler);

    if (this.svg) {
      this.svg.remove();
      this.svg = null;
      this.g = null;
    }
  }

  public update() {
    if (!this.isVisible || !this.svg || !this.g) return;

    const bounds = this.map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    const topLeft = this.map.latLngToLayerPoint([north, west]);
    const bottomRight = this.map.latLngToLayerPoint([south, east]);

    // Position the SVG over the current map viewport
    const width = Math.abs(bottomRight.x - topLeft.x) + 400;
    const height = Math.abs(bottomRight.y - topLeft.y) + 400;
    const left = topLeft.x - 200;
    const top = topLeft.y - 200;

    this.svg
      .attr('width', width)
      .attr('height', height)
      .style('left', `${left}px`)
      .style('top', `${top}px`);

    this.g.attr('transform', `translate(${-left}, ${-top})`);

    // Generate solar irradiance grid points across visible bounds
    const zoom = this.map.getZoom();
    const step = zoom >= 15 ? 0.015 : zoom >= 13 ? 0.04 : zoom >= 10 ? 0.12 : 0.4;
    const points: SolarPoint[] = [];

    // Buffer visible bounds slightly
    const latSpan = north - south;
    const lngSpan = east - west;
    const paddedSouth = south - latSpan * 0.2;
    const paddedNorth = north + latSpan * 0.2;
    const paddedWest = west - lngSpan * 0.2;
    const paddedEast = east + lngSpan * 0.2;

    for (let lat = paddedSouth; lat <= paddedNorth; lat += step) {
      for (let lng = paddedWest; lng <= paddedEast; lng += step) {
        points.push({
          lat,
          lng,
          ghi: estimateSolarGHI(lat, lng),
        });
      }
    }

    // Dynamic radius based on map zoom level
    const radius = Math.max(35, Math.min(140, Math.pow(2, zoom - 8) * 14));

    // Bind D3 data to circles
    const circles = this.g.selectAll<SVGCircleElement, SolarPoint>('circle')
      .data(points, (d: SolarPoint) => `${d.lat.toFixed(3)}_${d.lng.toFixed(3)}`);

    // Enter
    circles.enter()
      .append('circle')
      .attr('r', radius)
      .attr('fill', (d) => this.colorScale(d.ghi))
      .attr('opacity', 0.45)
      .merge(circles)
      .attr('cx', (d) => this.map.latLngToLayerPoint([d.lat, d.lng]).x)
      .attr('cy', (d) => this.map.latLngToLayerPoint([d.lat, d.lng]).y)
      .attr('r', radius)
      .attr('fill', (d) => this.colorScale(d.ghi));

    // Exit
    circles.exit().remove();
  }

  public destroy() {
    this.disable();
  }
}
