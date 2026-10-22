import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  Layers,
  Loader2,
  Navigation,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Menu,
  Search,
  ArrowUpRight,
  Compass,
  Bookmark,
  History,
  Eye,
  EyeOff,
  MapPin,
  Flame,
  Sun,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  ChevronLeft,
  Zap,
  Info,
  Mountain
} from 'lucide-react';
import { LocationPreset, TechnoEconomicMetrics, ElevationProfileData, ElevationPoint, TransectDirection } from '../types';
import { STATE_BOUNDARIES, getGeoLocationInfo } from '../utils/stateBoundaries';
import { D3SolarHeatmapLayer } from '../utils/d3SolarHeatmap';
import { ElevationProfileViewer } from './ElevationProfileViewer';

export type MapLayerMode = 'satellite' | 'streets' | 'solar_heatmap';

interface SatelliteMapProps {
  currentCenter: { lat: number; lng: number };
  currentZoom: number;
  isAnalyzing: boolean;
  onRunAssessment: (bounds: { north: number; south: number; east: number; west: number }, center: { lat: number; lng: number }) => void;
  onCenterChange: (center: { lat: number; lng: number }, zoom: number) => void;
  analyzedCenter: { lat: number; lng: number } | null;
  presets: LocationPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: LocationPreset) => void;
  onOpenSavedDrawer?: () => void;
  savedCount?: number;
  onToggleCompareMode?: () => void;
  isPanelCollapsed?: boolean;
  onToggleCollapsePanel?: () => void;
  currentMetrics?: TechnoEconomicMetrics | null;
  elevationData?: ElevationProfileData | null;
  isLoadingElevation?: boolean;
  onChangeElevationDirection?: (dir: TransectDirection) => void;
  onRefreshElevation?: () => void;
  showElevationProfile?: boolean;
  onToggleElevationProfile?: () => void;
}

export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  currentCenter,
  currentZoom,
  isAnalyzing,
  onRunAssessment,
  onCenterChange,
  analyzedCenter,
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenSavedDrawer,
  savedCount = 0,
  onToggleCompareMode,
  isPanelCollapsed = false,
  onToggleCollapsePanel,
  currentMetrics,
  elevationData,
  isLoadingElevation = false,
  onChangeElevationDirection,
  onRefreshElevation,
  showElevationProfile = true,
  onToggleElevationProfile,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const stateLayersRef = useRef<L.LayerGroup | null>(null);
  const d3HeatmapRef = useRef<D3SolarHeatmapLayer | null>(null);
  const transectLineRef = useRef<L.Polyline | null>(null);
  const transectMarkersRef = useRef<L.LayerGroup | null>(null);
  const hoverPointMarkerRef = useRef<L.Marker | null>(null);

  const [hoveredElevationPoint, setHoveredElevationPoint] = useState<ElevationPoint | null>(null);
  const [activeLayerMode, setActiveLayerMode] = useState<MapLayerMode>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showStateLines, setShowStateLines] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>('');
  const [locationTag, setLocationTag] = useState<{ country: string; state: string }>({
    country: 'Nigeria',
    state: 'Lagos State',
  });

  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: currentCenter.lat,
    lng: currentCenter.lng,
    zoom: currentZoom,
  });

  // Base tile provider URLs
  const TILE_URLS = {
    satellite: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attr: 'Map data &copy;2026 Google, Maxar Technologies',
    },
    streets: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attr: 'Map data &copy;2026 Google',
    },
    solar_heatmap: {
      // High-contrast clean street/terrain backdrop under the D3 solar gradient
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attr: 'Solar Potential D3 Model · Google Maps',
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCenter.lat, currentCenter.lng],
      zoom: currentZoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Base Google Hybrid Tile Layer
    const initialTileLayer = L.tileLayer(TILE_URLS.satellite.url, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    initialTileLayer.addTo(map);
    activeTileLayerRef.current = initialTileLayer;

    // Layer group for State boundaries & dividing lines
    const stateGroup = L.layerGroup().addTo(map);
    stateLayersRef.current = stateGroup;

    // Initialize D3 Solar Heatmap Layer
    const d3Heatmap = new D3SolarHeatmapLayer(map);
    d3HeatmapRef.current = d3Heatmap;

    // Track map center and bounds
    const handleMove = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setLiveCoords({
        lat: Number(center.lat.toFixed(5)),
        lng: Number(center.lng.toFixed(5)),
        zoom,
      });
      setLocationTag(getGeoLocationInfo(center.lat, center.lng));
      onCenterChange({ lat: center.lat, lng: center.lng }, zoom);
    };

    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);

    mapInstanceRef.current = map;

    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
      d3Heatmap.destroy();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer and D3 Heatmap when layer mode changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 1. Switch base tile layer
    if (activeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(activeTileLayerRef.current);
    }

    const tileConfig = TILE_URLS[activeLayerMode];
    const newLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    newLayer.addTo(mapInstanceRef.current);
    activeTileLayerRef.current = newLayer;

    // 2. Toggle D3 Solar Heatmap Layer
    if (activeLayerMode === 'solar_heatmap') {
      d3HeatmapRef.current?.enable();
    } else {
      d3HeatmapRef.current?.disable();
    }
  }, [activeLayerMode]);

  // Update State Boundaries and Dividing Lines
  useEffect(() => {
    if (!mapInstanceRef.current || !stateLayersRef.current) return;

    stateLayersRef.current.clearLayers();

    if (!showStateLines) return;

    STATE_BOUNDARIES.forEach((sb) => {
      // Draw polygon boundary dividing line
      const polygon = L.polygon(sb.coordinates, {
        color: sb.color,
        weight: 2.5,
        opacity: 0.9,
        fillColor: sb.color,
        fillOpacity: 0.08,
        dashArray: '5, 5',
      });

      polygon.bindTooltip(
        `<div class="px-2.5 py-1.5 bg-white text-slate-900 rounded-lg shadow-xl text-xs font-semibold border border-slate-200">
          <span class="text-amber-600 font-bold">${sb.country}</span> · ${sb.name}
          <div class="text-[11px] text-slate-500 font-normal mt-0.5">Capital: ${sb.capital} · Solar: ${sb.solarPotential}</div>
        </div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      stateLayersRef.current?.addLayer(polygon);

      // Add center state badge marker
      const labelIcon = L.divIcon({
        className: 'state-label-icon',
        html: `
          <div class="px-2.5 py-1 rounded-full bg-white/95 border border-slate-300 shadow-md text-[11px] font-bold text-slate-800 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" style="background-color: ${sb.color}"></span>
            <span>${sb.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const labelMarker = L.marker(sb.center, { icon: labelIcon, interactive: false });
      stateLayersRef.current?.addLayer(labelMarker);
    });
  }, [showStateLines]);

  // Sync center when preset changes externally
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getCenter();
    const distance = Math.sqrt(
      Math.pow(current.lat - currentCenter.lat, 2) + Math.pow(current.lng - currentCenter.lng, 2)
    );
    if (distance > 0.0001) {
      mapInstanceRef.current.flyTo([currentCenter.lat, currentCenter.lng], currentZoom, {
        duration: 1.2,
      });
      setLocationTag(getGeoLocationInfo(currentCenter.lat, currentCenter.lng));
    }
  }, [currentCenter.lat, currentCenter.lng, currentZoom]);

  // Invalidate map size whenever panel collapses or expands to prevent tile tearing
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isPanelCollapsed]);

  // Render Elevation Profile Transect line on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (transectLineRef.current) {
      transectLineRef.current.remove();
      transectLineRef.current = null;
    }
    if (transectMarkersRef.current) {
      transectMarkersRef.current.clearLayers();
      transectMarkersRef.current.remove();
      transectMarkersRef.current = null;
    }

    if (!showElevationProfile || !elevationData || !elevationData.points || elevationData.points.length === 0) {
      return;
    }

    // Polyline coordinates
    const latlngs: [number, number][] = elevationData.points.map((p) => [p.lat, p.lng]);
    const polyline = L.polyline(latlngs, {
      color: '#f59e0b',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '6, 6',
    }).addTo(map);
    transectLineRef.current = polyline;

    // Start (A) & End (B) pinpoints
    const markerGroup = L.layerGroup().addTo(map);
    transectMarkersRef.current = markerGroup;

    const startP = elevationData.points[0];
    const endP = elevationData.points[elevationData.points.length - 1];

    const startIcon = L.divIcon({
      className: 'transect-a-pin',
      html: `<div style="background:#0f172a; color:#f8fafc; font-size:10px; font-weight:bold; font-family:monospace; padding:2px 7px; border-radius:9999px; border:2px solid #f59e0b; box-shadow:0 2px 8px rgba(0,0,0,0.3); white-space:nowrap;">
        A (${startP.elevation}m)
      </div>`,
      iconSize: [60, 20],
      iconAnchor: [30, 10],
    });

    const endIcon = L.divIcon({
      className: 'transect-b-pin',
      html: `<div style="background:#0f172a; color:#f8fafc; font-size:10px; font-weight:bold; font-family:monospace; padding:2px 7px; border-radius:9999px; border:2px solid #f59e0b; box-shadow:0 2px 8px rgba(0,0,0,0.3); white-space:nowrap;">
        B (${endP.elevation}m)
      </div>`,
      iconSize: [60, 20],
      iconAnchor: [30, 10],
    });

    L.marker([startP.lat, startP.lng], { icon: startIcon, interactive: false }).addTo(markerGroup);
    L.marker([endP.lat, endP.lng], { icon: endIcon, interactive: false }).addTo(markerGroup);
  }, [elevationData, showElevationProfile]);

  // Synchronize hover point on elevation chart to Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hoverPointMarkerRef.current) {
      hoverPointMarkerRef.current.remove();
      hoverPointMarkerRef.current = null;
    }

    if (!hoveredElevationPoint) return;

    const hoverIcon = L.divIcon({
      className: 'transect-hover-beacon',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
          <div style="background:#0284c7; color:#ffffff; font-size:10px; font-weight:bold; font-family:monospace; padding:2px 6px; border-radius:4px; box-shadow:0 4px 10px rgba(0,0,0,0.35); border:1.5px solid #ffffff; white-space:nowrap;">
            ${hoveredElevationPoint.elevation.toFixed(1)}m · ${hoveredElevationPoint.distanceMeters}m
          </div>
          <div style="width:12px; height:12px; border-radius:50%; background:#0284c7; border:2.5px solid #ffffff; box-shadow:0 0 12px #0284c7; margin-top:2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const marker = L.marker([hoveredElevationPoint.lat, hoveredElevationPoint.lng], {
      icon: hoverIcon,
      zIndexOffset: 1200,
    }).addTo(map);

    hoverPointMarkerRef.current = marker;
  }, [hoveredElevationPoint]);

  // Update target marker & bounding box overlay when assessment is performed
  useEffect(() => {
    if (!mapInstanceRef.current || !analyzedCenter) return;

    // Google Maps pin style
    const customIcon = L.divIcon({
      className: 'google-maps-pin',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2">
          <div class="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
          <div class="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 bg-red-600 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 28],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([analyzedCenter.lat, analyzedCenter.lng]);
    } else {
      markerRef.current = L.marker([analyzedCenter.lat, analyzedCenter.lng], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );
    }

    // Add analyzed spatial bounding box polygon
    const delta = 0.0035;
    const bounds: L.LatLngBoundsExpression = [
      [analyzedCenter.lat - delta, analyzedCenter.lng - delta],
      [analyzedCenter.lat + delta, analyzedCenter.lng + delta],
    ];

    if (rectangleRef.current) {
      rectangleRef.current.setBounds(bounds);
    } else {
      rectangleRef.current = L.rectangle(bounds, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.12,
        dashArray: '4, 4',
      }).addTo(mapInstanceRef.current);
    }
  }, [analyzedCenter]);

  // Handle Assessment Execution
  const handleTriggerAssessment = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    const bounds = mapInstanceRef.current.getBounds();

    onRunAssessment(
      {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
      {
        lat: center.lat,
        lng: center.lng,
      }
    );
  };

  // Locate Current Position (or default to Surulere, Lagos)
  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
        },
        () => {
          mapInstanceRef.current?.flyTo([6.4980, 3.3580], 16);
        }
      );
    } else {
      mapInstanceRef.current?.flyTo([6.4980, 3.3580], 16);
    }
  };

  // Search handler inside the map bar
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || !mapInstanceRef.current) return;

    const match = searchInput.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      mapInstanceRef.current.flyTo([lat, lng], 16);
      return;
    }

    const found = presets.find(
      (p) =>
        p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        p.country.toLowerCase().includes(searchInput.toLowerCase()) ||
        p.region.toLowerCase().includes(searchInput.toLowerCase()) ||
        (p.state && p.state.toLowerCase().includes(searchInput.toLowerCase()))
    );

    if (found) {
      onSelectPreset(found);
      mapInstanceRef.current.flyTo([found.lat, found.lng], found.zoom);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-100 font-sans">
      {/* 1. Leaflet Map DOM Root */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Left Google Maps Vertical Rail (Without 'Get app') */}
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-white/95 backdrop-blur-md border-r border-slate-200 z-20 flex flex-col items-center justify-between py-4 shadow-md pointer-events-auto">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Hamburger Menu */}
          <button
            onClick={() => onOpenSavedDrawer && onOpenSavedDrawer()}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            title="Menu & Assessments"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Saved Assessments */}
          <button
            onClick={() => onOpenSavedDrawer && onOpenSavedDrawer()}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-amber-600 transition-colors group"
            title="Saved Assessments"
          >
            <div className="relative">
              <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Saved</span>
          </button>

          {/* Recents */}
          <button
            onClick={() => onSelectPreset(presets[0])}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-amber-600 transition-colors group"
            title="Recent Rural Targets"
          >
            <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium">Recents</span>
          </button>

          {/* Side-by-side Compare */}
          {onToggleCompareMode && (
            <button
              onClick={onToggleCompareMode}
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-sky-600 transition-colors group"
              title="Compare Assessments"
            >
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform text-sky-600" />
              <span className="text-[10px] font-medium">Compare</span>
            </button>
          )}
        </div>

        {/* Rail Action: Terrain & Elevation Toggle */}
        <div className="flex flex-col items-center gap-2 w-full">
          {onToggleElevationProfile && (
            <button
              onClick={onToggleElevationProfile}
              className={`group relative w-11 h-11 rounded-xl overflow-hidden border-2 shadow-md transition-all cursor-pointer flex flex-col items-center justify-center ${
                showElevationProfile
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-white'
              }`}
              title="Site Elevation Profile & Topography"
            >
              <Mountain className={`w-5 h-5 ${showElevationProfile ? 'text-slate-950' : 'text-slate-700 group-hover:text-amber-600'}`} />
              <span className="text-[8px] font-bold uppercase mt-0.5">Terrain</span>
            </button>
          )}

          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="group relative w-11 h-11 rounded-xl overflow-hidden border-2 border-slate-300 shadow-md hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer flex flex-col items-center justify-center bg-slate-50 text-slate-700 hover:bg-white"
            title="Layer Control: Satellite / Streets / Solar Heatmap"
          >
            <Layers className="w-5 h-5 text-slate-700 group-hover:text-amber-600" />
            <span className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">Layers</span>
          </button>
        </div>
      </div>

      {/* 3. Floating Google Maps Search & Filter Bar */}
      <div className="absolute top-3 left-20 right-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Floating Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center h-11 bg-white rounded-full shadow-lg border border-slate-200 px-3 w-80 max-w-full"
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Google Maps..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-7 h-7 rounded-full bg-sky-600 hover:bg-sky-500 flex items-center justify-center text-white shrink-0 ml-1 shadow-sm transition-transform active:scale-95"
            title="Search Location"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Layer Control Toggle Pills (Satellite vs Street Map vs D3 Solar Heatmap) */}
        <div className="flex items-center p-1 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-slate-200">
          <button
            onClick={() => setActiveLayerMode('satellite')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeLayerMode === 'satellite'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🛰️ Satellite</span>
          </button>

          <button
            onClick={() => setActiveLayerMode('streets')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeLayerMode === 'streets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🗺️ Streets</span>
          </button>

          <button
            onClick={() => setActiveLayerMode('solar_heatmap')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeLayerMode === 'solar_heatmap'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm font-bold'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
            title="D3 Solar Irradiance Heatmap Overlay"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Solar Heatmap (D3)</span>
          </button>
        </div>

        {/* State Lines Toggle Pill */}
        <button
          onClick={() => setShowStateLines(!showStateLines)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap transition-all border ${
            showStateLines
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
          title="Toggle Country and State Dividing Lines"
        >
          {showStateLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>State Dividing Lines</span>
        </button>

        {/* Elevation Profile Quick Toggle Pill */}
        {onToggleElevationProfile && (
          <button
            onClick={onToggleElevationProfile}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap transition-all border ${
              showElevationProfile
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle Elevation Profile & Topographic Slope Analysis"
          >
            <Mountain className="w-3.5 h-3.5 text-amber-600" />
            <span>Elevation Profile</span>
          </button>
        )}

        {/* Presets Pills */}
        <div className="hidden xl:flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {presets.slice(0, 3).map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3 h-3 text-red-500" />
                <span>{preset.state || preset.country}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Layer Control Modal / Drawer (when Layers button on rail is clicked) */}
      {showLayerMenu && (
        <div className="absolute bottom-20 left-20 z-30 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 pointer-events-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Map Layer Control</span>
            </span>
            <button
              onClick={() => setShowLayerMenu(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveLayerMode('satellite');
                setShowLayerMenu(false);
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                activeLayerMode === 'satellite'
                  ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white text-sm">
                🛰️
              </div>
              <div>
                <span className="text-xs block font-bold">Satellite Imagery</span>
                <span className="text-[10px] text-slate-500">Google Hybrid with streets & labels</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveLayerMode('streets');
                setShowLayerMenu(false);
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                activeLayerMode === 'streets'
                  ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white text-sm">
                🗺️
              </div>
              <div>
                <span className="text-xs block font-bold">Street Roadmap</span>
                <span className="text-[10px] text-slate-500">Highways, transit, and city grids</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveLayerMode('solar_heatmap');
                setShowLayerMenu(false);
              }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                activeLayerMode === 'solar_heatmap'
                  ? 'border-amber-500 bg-amber-50/50 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white text-sm">
                🔥
              </div>
              <div>
                <span className="text-xs block font-bold">Solar Irradiance Heatmap</span>
                <span className="text-[10px] text-slate-500">D3 GHI gradient & potential contours</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 5. D3 Solar Heatmap Legend (when solar_heatmap is active) */}
      {activeLayerMode === 'solar_heatmap' && (
        <div className="absolute top-16 left-20 z-20 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-lg w-72">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Solar Potential (D3 Heatmap)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">GHI kWh/m²/day</span>
          </div>
          {/* Gradient Bar */}
          <div className="h-3 w-full rounded-md bg-gradient-to-r from-yellow-300 via-orange-400 to-red-600 shadow-inner" />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1 font-semibold">
            <span>&lt; 4.0 (Moderate)</span>
            <span>5.2 (High)</span>
            <span>&gt; 6.4 (Sahel Max)</span>
          </div>
        </div>
      )}

      {/* 6. Active Country & State Badge Banner */}
      <div className="absolute top-16 right-16 z-10 pointer-events-none hidden md:block">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-800 shadow-md">
          <span className="text-amber-600 font-bold">{locationTag.country}</span>
          <span className="text-slate-300">›</span>
          <span className="text-slate-800">{locationTag.state}</span>
          {showStateLines && (
            <span className="text-[10px] text-cyan-600 font-mono font-medium">
              · Dividing lines active
            </span>
          )}
        </div>
      </div>

      {/* 7. Target Reticle in Center of Viewport */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="relative w-56 h-56 border-2 border-amber-500/60 rounded-xl flex items-center justify-center">
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

          {/* Center crosshair */}
          <div className="w-6 h-0.5 bg-amber-500 absolute" />
          <div className="h-6 w-0.5 bg-amber-500 absolute" />
          <div className="w-2.5 h-2.5 rounded-full border border-amber-500 absolute" />

          {/* Radar animation when analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-transparent animate-pulse rounded-xl overflow-hidden">
              <div className="w-full h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-bounce" />
            </div>
          )}

          {/* Area Label */}
          <div className="absolute -bottom-6 text-[10px] uppercase font-mono tracking-wider text-slate-800 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-md whitespace-nowrap font-bold">
            Mini-Grid Capture Zone (~500m)
          </div>
        </div>
      </div>

      {/* 8. Floating "Run Assessment Here" Primary Button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={handleTriggerAssessment}
          disabled={isAnalyzing}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm tracking-wide shadow-2xl transition-all transform active:scale-95 ${
            isAnalyzing
              ? 'bg-slate-900 text-amber-300 border border-amber-500/50 cursor-wait'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/30 border border-amber-300 hover:shadow-amber-500/50'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing Google Satellite Imagery...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4 text-slate-950" />
              <span>Run Assessment Here</span>
            </>
          )}
        </button>
      </div>

      {/* 9. Floating Side Panel Collapse/Expand Edge Tab (Toggle) */}
      {onToggleCollapsePanel && (
        <div className="absolute top-1/2 -translate-y-1/2 right-0 z-30 pointer-events-auto">
          <button
            onClick={onToggleCollapsePanel}
            className="flex items-center justify-center w-7 h-16 bg-white hover:bg-slate-50 border-t border-b border-l border-slate-300 rounded-l-xl shadow-xl text-slate-700 hover:text-amber-600 transition-all cursor-pointer"
            title={isPanelCollapsed ? 'Open Feasibility Analysis Panel' : 'Collapse Panel (Full Screen Map)'}
          >
            {isPanelCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* 10. Docked Elevation Profile Viewer on Map */}
      {showElevationProfile && (
        <div className="absolute bottom-12 left-20 right-20 max-w-2xl mx-auto z-25 pointer-events-auto">
          <ElevationProfileViewer
            data={elevationData || null}
            isLoading={isLoadingElevation}
            onDirectionChange={(dir) => onChangeElevationDirection && onChangeElevationDirection(dir)}
            onRefresh={() => onRefreshElevation && onRefreshElevation()}
            onHoverPoint={(pt) => setHoveredElevationPoint(pt)}
            onClose={onToggleElevationProfile}
          />
        </div>
      )}

      {/* 11. Floating Mini Feasibility Card on Map when panel is collapsed */}
      {isPanelCollapsed && currentMetrics && (
        <div className="absolute bottom-10 right-4 z-20 pointer-events-auto max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono text-amber-600 uppercase font-bold tracking-wider">
                Assessed Mini-Grid
              </span>
              <h4 className="text-xs font-bold text-slate-900">{locationTag.state}, {locationTag.country}</h4>
            </div>
            <button
              onClick={onToggleCollapsePanel}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>Full Details</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block">PV Capacity</span>
              <span className="text-xs font-bold font-mono text-slate-900">{currentMetrics.pvCapacityKwp} kWp</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block">CAPEX</span>
              <span className="text-xs font-bold font-mono text-amber-600">${currentMetrics.estimatedCapex.toLocaleString()}</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-500 block">LCOE</span>
              <span className="text-xs font-bold font-mono text-emerald-600">${currentMetrics.lcoePerKwh.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 11. Bottom-Right Controls */}
      <div className="absolute right-4 bottom-8 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Locate Me button */}
        <button
          onClick={handleLocateMe}
          className="w-10 h-10 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
          title="Your location (Surulere Lagos)"
        >
          <Compass className="w-5 h-5 text-sky-600" />
        </button>

        {/* Zoom Controls Stack */}
        <div className="flex flex-col rounded-lg bg-white border border-slate-300 shadow-md overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Pegman Street View representation */}
        <div
          className="w-10 h-10 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-amber-500 cursor-pointer hover:bg-slate-100"
          title="Street View Perspective"
        >
          <span className="text-base select-none">🧍</span>
        </div>
      </div>

      {/* 12. Google Maps Attribution and Scale Bar */}
      <div className="absolute right-4 bottom-1 z-20 pointer-events-none flex items-center gap-3 text-[10px] text-slate-700 drop-shadow-sm font-medium">
        <span className="font-sans font-bold">Google Maps</span>
        <span>·</span>
        <span>Imagery ©2026 Airbus, Maxar Technologies</span>
        <span>·</span>
        <div className="flex items-center gap-1 font-mono">
          <div className="w-12 h-1 border-b-2 border-l-2 border-r-2 border-slate-700"></div>
          <span>200 m</span>
        </div>
      </div>

      {/* 13. Live Coordinate HUD (Bottom Left next to rail) */}
      <div className="absolute left-20 bottom-3 z-20 pointer-events-none">
        <div className="flex items-center gap-2.5 px-3 py-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 shadow-sm">
          <span className="text-slate-400">LAT:</span>
          <span className="text-slate-900 font-semibold tabular-nums">{liveCoords.lat.toFixed(4)}°</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">LNG:</span>
          <span className="text-slate-900 font-semibold tabular-nums">{liveCoords.lng.toFixed(4)}°</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">ZOOM:</span>
          <span className="text-slate-900 font-semibold tabular-nums">{liveCoords.zoom}x</span>
        </div>
      </div>
    </div>
  );
};
