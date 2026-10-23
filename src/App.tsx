/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Battery,
  DollarSign,
  Zap,
  MapPin,
  Download,
  Share2,
  Code2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Search,
  RotateCcw,
  Building,
  Info,
  Copy,
  Layers,
  Scale,
  Bookmark,
  Columns,
  SquareCheckBig,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Mountain
} from 'lucide-react';
import { SatelliteMap } from './components/SatelliteMap';
import { MetricCard } from './components/MetricCard';
import { SensitivityControls } from './components/SensitivityControls';
import { ComparisonView } from './components/ComparisonView';
import { FeasibilityBriefModal } from './components/FeasibilityBriefModal';
import { simulateGeminiAnalysis, LOCATION_PRESETS } from './utils/aiAssessment';
import { calculateTechnoEconomics, DEFAULT_SENSITIVITY } from './utils/technoEconomic';
import { getGeoLocationInfo } from './utils/stateBoundaries';
import { fetchElevationProfile } from './utils/elevationService';
import {
  AISpatialResult,
  LocationPreset,
  SavedAssessment,
  SensitivityParams,
  TechnoEconomicMetrics,
  ElevationProfileData,
  TransectDirection
} from './types';

// Default standard baselines
const INITIAL_BASELINES: SavedAssessment[] = [
  {
    id: 'baseline-standard-100kw',
    name: 'Standard 100 kWp Benchmark Reference',
    country: 'Nigeria',
    state: 'Plateau State',
    savedAt: '2026-01-15T10:00:00.000Z',
    isBaseline: true,
    params: DEFAULT_SENSITIVITY,
    aiResult: {
      usable_rooftop_m2: 1200,
      building_density: 'Medium',
      visible_infrastructure: false,
      roof_material: 'Mostly Metal',
      estimated_households: 280,
      grid_distance_km: 26.5,
      avg_solar_ghi_kwh_m2: 5.4,
      slope_percentage: 3.2,
      analyzed_at: '2026-01-15T10:00:00.000Z',
      bounds: { north: 9.085, south: 9.079, east: 8.678, west: 8.672 },
      center: { lat: 9.082, lng: 8.6753 },
    },
    metrics: {
      usableRooftopM2: 1200,
      pvCapacityKwp: 240,
      dailyGenerationKwh: 1080,
      annualGenerationKwh: 394200,
      batteryStorageKwh: 1620,
      pvCapex: 216000,
      batteryCapex: 405000,
      bosAndBalanceCapex: 74520,
      estimatedCapex: 621000,
      lcoePerKwh: 0.129,
      dieselSavingsPerYearUsd: 154132,
      co2MitigatedTonsYear: 268.1,
      householdsElectrified: 617,
      feasibilityScore: 'High Viability',
      summarySentence: 'Standard benchmark mini-grid demonstrating low levelized cost and high rural access viability.',
    },
  },
  {
    id: 'baseline-lagos-fringe',
    name: 'Lagos Surulere Peri-Urban Baseline',
    country: 'Nigeria',
    state: 'Lagos State',
    savedAt: '2026-02-10T14:30:00.000Z',
    isBaseline: true,
    params: DEFAULT_SENSITIVITY,
    aiResult: {
      usable_rooftop_m2: 2400,
      building_density: 'Dense',
      visible_infrastructure: true,
      roof_material: 'Mostly Metal',
      estimated_households: 520,
      grid_distance_km: 4.2,
      avg_solar_ghi_kwh_m2: 4.9,
      slope_percentage: 1.5,
      analyzed_at: '2026-02-10T14:30:00.000Z',
      bounds: { north: 6.502, south: 6.494, east: 3.362, west: 3.354 },
      center: { lat: 6.4980, lng: 3.3580 },
    },
    metrics: {
      usableRooftopM2: 2400,
      pvCapacityKwp: 480,
      dailyGenerationKwh: 2160,
      annualGenerationKwh: 788400,
      batteryStorageKwh: 3240,
      pvCapex: 432000,
      batteryCapex: 810000,
      bosAndBalanceCapex: 149040,
      estimatedCapex: 1242000,
      lcoePerKwh: 0.129,
      dieselSavingsPerYearUsd: 308264,
      co2MitigatedTonsYear: 536.1,
      householdsElectrified: 1234,
      feasibilityScore: 'High Viability',
      summarySentence: 'Surulere peri-urban high-density solar microgrid providing reliable commercial backup.',
    },
  },
];

export default function App() {
  // Current active map center & zoom (Default to Surulere, Lagos from image_64eff064.png)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 6.4980,
    lng: 3.3580,
  });
  const [mapZoom, setMapZoom] = useState<number>(16);

  // Selected preset
  const [selectedPreset, setSelectedPreset] = useState<LocationPreset>(LOCATION_PRESETS[0]);

  // View Mode: 'assessment' (Single Site) vs 'comparison' (Side-by-Side)
  const [rightPanelTab, setRightPanelTab] = useState<'assessment' | 'comparison'>('assessment');

  // Collapsible text panel state: when collapsed, only the map shows (starts collapsed on initial load)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(true);

  // AI & Techno-Economic States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AISpatialResult | null>(null);
  const [metrics, setMetrics] = useState<TechnoEconomicMetrics | null>(null);
  const [analyzedCenter, setAnalyzedCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Geographic identity
  const [geoInfo, setGeoInfo] = useState<{ country: string; state: string }>({
    country: 'Nigeria',
    state: 'Lagos State',
  });

  // Sensitivity Sliders
  const [sensitivityParams, setSensitivityParams] = useState<SensitivityParams>(DEFAULT_SENSITIVITY);

  // Saved Assessments Library
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>(() => {
    try {
      const stored = localStorage.getItem('gis_saved_assessments');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BASELINES;
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
    return INITIAL_BASELINES;
  });

  // UI Modals & Drawers
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);
  const [showJsonRaw, setShowJsonRaw] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Elevation Profile State (starts collapsed on initial load)
  const [elevationData, setElevationData] = useState<ElevationProfileData | null>(null);
  const [isLoadingElevation, setIsLoadingElevation] = useState<boolean>(false);
  const [elevationDirection, setElevationDirection] = useState<TransectDirection>('west-east');
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(false);

  // Persist saved assessments
  useEffect(() => {
    try {
      localStorage.setItem('gis_saved_assessments', JSON.stringify(savedAssessments));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [savedAssessments]);

  // Fetch elevation profile for given location
  const loadElevationData = async (
    center: { lat: number; lng: number },
    bounds?: { north: number; south: number; east: number; west: number },
    direction?: TransectDirection
  ) => {
    setIsLoadingElevation(true);
    try {
      const activeBounds = bounds || {
        north: center.lat + 0.005,
        south: center.lat - 0.005,
        east: center.lng + 0.006,
        west: center.lng - 0.006,
      };
      const data = await fetchElevationProfile(activeBounds, center, direction || elevationDirection);
      setElevationData(data);
    } catch (err) {
      console.error('Error fetching elevation profile:', err);
    } finally {
      setIsLoadingElevation(false);
    }
  };

  // Initial Assessment on Load for Surulere Lagos
  useEffect(() => {
    let isMounted = true;
    const runInitialAssessment = async () => {
      setIsAnalyzing(true);
      try {
        const initialAi = await simulateGeminiAnalysis(undefined, { lat: 6.4980, lng: 3.3580 });
        if (!isMounted) return;
        const initialMetrics = calculateTechnoEconomics(initialAi, DEFAULT_SENSITIVITY);
        setAiResult(initialAi);
        setMetrics(initialMetrics);
        setAnalyzedCenter({ lat: 6.4980, lng: 3.3580 });
        setGeoInfo(getGeoLocationInfo(6.4980, 3.3580));
        loadElevationData({ lat: 6.4980, lng: 3.3580 }, initialAi.bounds);
      } catch (err) {
        console.error('Initial assessment error:', err);
      } finally {
        if (isMounted) setIsAnalyzing(false);
      }
    };

    runInitialAssessment();
    return () => {
      isMounted = false;
    };
  }, []);

  // Recalculate metrics whenever sensitivity parameters change
  useEffect(() => {
    if (!aiResult) return;
    const updatedMetrics = calculateTechnoEconomics(aiResult, sensitivityParams);
    setMetrics(updatedMetrics);
  }, [sensitivityParams]);

  // Handle Assessment Execution from Map Reticle
  const handleRunAssessment = async (
    bounds: { north: number; south: number; east: number; west: number },
    center: { lat: number; lng: number }
  ) => {
    setIsAnalyzing(true);
    try {
      const result = await simulateGeminiAnalysis(bounds, center);
      const computedMetrics = calculateTechnoEconomics(result, sensitivityParams);
      setAiResult(result);
      setMetrics(computedMetrics);
      setAnalyzedCenter({ lat: center.lat, lng: center.lng });
      setGeoInfo(getGeoLocationInfo(center.lat, center.lng));
      loadElevationData(center, bounds);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset: LocationPreset) => {
    setSelectedPreset(preset);
    setMapCenter({ lat: preset.lat, lng: preset.lng });
    setMapZoom(preset.zoom);
    setGeoInfo(getGeoLocationInfo(preset.lat, preset.lng));
    loadElevationData({ lat: preset.lat, lng: preset.lng });
  };

  // Save current assessment
  const handleSaveCurrentAssessment = (customName: string) => {
    if (!aiResult || !metrics) return;
    const newSave: SavedAssessment = {
      id: `save-${Date.now()}`,
      name: customName,
      country: geoInfo.country,
      state: geoInfo.state,
      savedAt: new Date().toISOString(),
      aiResult,
      metrics,
      params: sensitivityParams,
      isBaseline: false,
    };
    setSavedAssessments((prev) => [newSave, ...prev]);
  };

  // Delete saved assessment
  const handleDeleteSaved = (id: string) => {
    setSavedAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  // Load a saved assessment as current
  const handleLoadSavedToMap = (saved: SavedAssessment) => {
    setAiResult(saved.aiResult);
    setMetrics(saved.metrics);
    setSensitivityParams(saved.params);
    setMapCenter({ lat: saved.aiResult.center.lat, lng: saved.aiResult.center.lng });
    setAnalyzedCenter({ lat: saved.aiResult.center.lat, lng: saved.aiResult.center.lng });
    setGeoInfo({ country: saved.country, state: saved.state });
    setRightPanelTab('assessment');
    setIsRightPanelCollapsed(false); // expand if user chooses to load
  };

  const handleCopySummary = () => {
    if (!metrics) return;
    navigator.clipboard.writeText(metrics.summarySentence);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-slate-900 antialiased font-sans">
      {/* 1. Clean White Google-style Top Header Bar */}
      <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-30 shadow-xs">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-xs">
            <Sun className="w-4 h-4 text-white font-bold" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Open-Source GIS Spatial Planner</span>
              <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                / Rural Renewable Energy Access
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Country & State dividing indicators */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span className="text-slate-500">Location:</span>
          <span className="text-slate-900 font-semibold">{geoInfo.country}</span>
          <span className="text-slate-300">·</span>
          <span className="text-sky-600 font-semibold">{geoInfo.state}</span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] font-mono text-slate-500">
            {analyzedCenter ? `${analyzedCenter.lat.toFixed(4)}°, ${analyzedCenter.lng.toFixed(4)}°` : ''}
          </span>
        </div>

        {/* Action Zone: Collapse Toggle & Export Brief */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Collapsible Panel Toggle Button in Header */}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              isRightPanelCollapsed
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={isRightPanelCollapsed ? 'Show analysis panel' : 'Collapse analysis panel to show full map'}
          >
            {isRightPanelCollapsed ? (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Show Analysis</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Collapse Panel</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsBriefModalOpen(true)}
            disabled={!metrics}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-xs active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-950" />
            <span>Export Brief</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Split-Screen Viewport */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-white">
        {/* Left Panel: Full-Height Interactive Map (Expands to 100% when right panel is collapsed) */}
        <section
          className={`${
            isRightPanelCollapsed ? 'w-full' : 'w-full md:w-[60%]'
          } h-full relative transition-all duration-300 bg-slate-100`}
        >
          <SatelliteMap
            currentCenter={mapCenter}
            currentZoom={mapZoom}
            isAnalyzing={isAnalyzing}
            onRunAssessment={handleRunAssessment}
            onCenterChange={(center, zoom) => {
              setMapCenter(center);
              setMapZoom(zoom);
              setGeoInfo(getGeoLocationInfo(center.lat, center.lng));
            }}
            analyzedCenter={analyzedCenter}
            presets={LOCATION_PRESETS}
            selectedPresetId={selectedPreset.id}
            onSelectPreset={handleSelectPreset}
            onOpenSavedDrawer={() => {
              setRightPanelTab('comparison');
              setIsRightPanelCollapsed(false);
            }}
            savedCount={savedAssessments.length}
            onToggleCompareMode={() => {
              setRightPanelTab(rightPanelTab === 'assessment' ? 'comparison' : 'assessment');
              if (isRightPanelCollapsed) setIsRightPanelCollapsed(false);
            }}
            isPanelCollapsed={isRightPanelCollapsed}
            onToggleCollapsePanel={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            currentMetrics={metrics}
            elevationData={elevationData}
            isLoadingElevation={isLoadingElevation}
            onChangeElevationDirection={(dir) => {
              setElevationDirection(dir);
              loadElevationData(analyzedCenter || mapCenter, aiResult?.bounds, dir);
            }}
            onRefreshElevation={() => {
              loadElevationData(analyzedCenter || mapCenter, aiResult?.bounds, elevationDirection);
            }}
            showElevationProfile={showElevationProfile}
            onToggleElevationProfile={() => setShowElevationProfile(!showElevationProfile)}
          />
        </section>

        {/* Right Panel: Collapsible Control Panel, AI Reconnaissance, & Metrics */}
        {!isRightPanelCollapsed && (
          <section className="w-full md:w-[40%] h-full overflow-y-auto bg-white border-l border-slate-200 p-4 md:p-6 space-y-5 transition-all duration-300 shadow-sm">
            {/* View Mode Segmented Tabs (Single Site vs Side-by-Side Comparison) */}
            <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                onClick={() => setRightPanelTab('assessment')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  rightPanelTab === 'assessment'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Current Feasibility Metrics</span>
              </button>
              <button
                onClick={() => setRightPanelTab('comparison')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  rightPanelTab === 'comparison'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-sky-500" />
                <span>Side-by-Side Comparison ({savedAssessments.length})</span>
              </button>
            </div>

            {/* TAB 1: Feasibility Metrics (Single Assessment View) */}
            {rightPanelTab === 'assessment' && (
              <>
                {/* Active Site Header & Quick Stats */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {analyzedCenter
                          ? `${analyzedCenter.lat.toFixed(4)}°N, ${analyzedCenter.lng.toFixed(4)}°E`
                          : 'Target Area'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sky-600 font-semibold">{geoInfo.state}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600">{geoInfo.country}</span>
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                      {selectedPreset.name}
                    </h2>
                  </div>

                  {metrics && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                        Viability Status
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                          metrics.feasibilityScore === 'High Viability'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : metrics.feasibilityScore === 'Moderate Viability'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {metrics.feasibilityScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive Sensitivity Parameters Drawer */}
                <SensitivityControls
                  params={sensitivityParams}
                  onChange={(newParams) => setSensitivityParams(newParams)}
                />

                {/* AI Assessment Reconnaissance (Gemini Vision Simulation Output) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                        AI Computer Vision Reconnaissance
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowJsonRaw(!showJsonRaw)}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-amber-600 transition-colors"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{showJsonRaw ? 'Hide JSON' : 'Inspect JSON'}</span>
                    </button>
                  </div>

                  {/* Structured Raw JSON Viewer (Toggleable) */}
                  {showJsonRaw && aiResult && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-[11px] font-mono overflow-x-auto text-amber-300 leading-tight">
                      <pre>{JSON.stringify(aiResult, null, 2)}</pre>
                    </div>
                  )}

                  {/* AI Result Reconnaissance Cards */}
                  {aiResult ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
                        <span className="text-[11px] text-slate-500 block mb-1">Usable Rooftop Area</span>
                        <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                          {aiResult.usable_rooftop_m2.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">m²</span>
                        <p className="text-[10px] text-slate-400 mt-1">Satellite detected geometry</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
                        <span className="text-[11px] text-slate-500 block mb-1">Building Density</span>
                        <span className="text-lg font-bold text-amber-600">
                          {aiResult.building_density}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">~{aiResult.estimated_households} cluster homes</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
                        <span className="text-[11px] text-slate-500 block mb-1">Roof Envelope</span>
                        <span className="text-base font-bold text-slate-800">
                          {aiResult.roof_material}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Mounting structural integrity</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
                        <span className="text-[11px] text-slate-500 block mb-1">Grid Infrastructure</span>
                        <span className="text-base font-bold text-slate-800">
                          {aiResult.visible_infrastructure ? 'Detected (Poles)' : 'Isolated Off-Grid'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{aiResult.grid_distance_km} km to main feeder</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs bg-slate-50">
                      Capturing satellite reconnaissance...
                    </div>
                  )}

                  {/* Topography & Elevation Feasibility Summary Card */}
                  {elevationData && (
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                          <Mountain className="w-3.5 h-3.5 text-amber-600" />
                          <span>Site Elevation & Relief</span>
                        </span>
                        <button
                          onClick={() => setShowElevationProfile(!showElevationProfile)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <span>{showElevationProfile ? 'Hide Profile' : 'Show Profile On Map'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Avg Slope</span>
                          <span className="text-sm font-bold font-mono text-slate-900">{elevationData.avgSlopePercent}%</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Relief Δh</span>
                          <span className="text-sm font-bold font-mono text-amber-700">{elevationData.elevationChange}m</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Civil Rating</span>
                          <span className="text-xs font-bold font-mono text-emerald-700 truncate block">
                            {elevationData.feasibilityCategory.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {elevationData.civilWorksAssessment}
                      </p>
                    </div>
                  )}
                </div>

                {/* Techno-Economic Mini-Grid Sizing Metrics */}
                {metrics && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                          Techno-Economic Sizing & Financials
                        </h3>
                      </div>

                      <button
                        onClick={() => handleSaveCurrentAssessment(selectedPreset.name)}
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors"
                        title="Save this assessment into comparison library"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>Save for Comparison</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        label="PV Array Capacity"
                        value={metrics.pvCapacityKwp}
                        unit="kWp"
                        subtext="At 20% system efficiency"
                        icon={<Sun className="w-4 h-4" />}
                        variant="amber"
                        tooltip="Calculated as usable rooftop area (m²) × 0.20"
                      />

                      <MetricCard
                        label="Daily Solar Generation"
                        value={metrics.dailyGenerationKwh}
                        unit="kWh/day"
                        subtext={`At ${sensitivityParams.peakSunHours} peak sun hours`}
                        icon={<TrendingUp className="w-4 h-4" />}
                        variant="amber"
                        tooltip="Calculated as PV Capacity (kWp) × Peak Sun Hours"
                      />

                      <MetricCard
                        label="Battery Storage (BESS)"
                        value={metrics.batteryStorageKwh}
                        unit="kWh"
                        subtext={`${sensitivityParams.autonomyDays} days autonomy reserve`}
                        icon={<Battery className="w-4 h-4" />}
                        variant="blue"
                        tooltip="Calculated as Daily Generation (kWh) × Autonomy Days"
                      />

                      <MetricCard
                        label="Total Estimated CAPEX"
                        value={`$${metrics.estimatedCapex.toLocaleString()}`}
                        subtext="Turnkey system investment"
                        icon={<DollarSign className="w-4 h-4" />}
                        variant="emerald"
                        tooltip="Calculated as (PV Capacity × $900) + (Battery Storage × $250)"
                      />
                    </div>

                    {/* LCOE & Viability Spotlight Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200/80 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-semibold block">
                          Levelized Cost of Electricity (LCOE)
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                            ${metrics.lcoePerKwh.toFixed(3)}
                          </span>
                          <span className="text-xs font-medium text-slate-500">/ kWh</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Displaces diesel gensets at <span className="text-slate-800 font-mono font-medium">$0.52/kWh</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Annual Diesel Offset</span>
                        <span className="text-sm font-bold font-mono text-amber-600 tabular-nums">
                          ${metrics.dieselSavingsPerYearUsd.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {metrics.co2MitigatedTonsYear} t CO₂/yr
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic 3-Sentence Site Feasibility Summary */}
                {metrics && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-500" />
                        Site Feasibility Assessment Summary
                      </span>
                      <button
                        onClick={handleCopySummary}
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        {copiedSummary ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-sm leading-relaxed text-slate-700 font-normal shadow-xs">
                      {metrics.summarySentence}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: Side-by-Side Comparison View */}
            {rightPanelTab === 'comparison' && (
              <ComparisonView
                currentAiResult={aiResult}
                currentMetrics={metrics}
                currentParams={sensitivityParams}
                currentLocationName={selectedPreset.name}
                currentState={geoInfo.state}
                currentCountry={geoInfo.country}
                savedAssessments={savedAssessments}
                onSaveCurrent={handleSaveCurrentAssessment}
                onDeleteSaved={handleDeleteSaved}
                onSelectAsCurrent={handleLoadSavedToMap}
              />
            )}

            {/* Bottom Footer Note */}
            <div className="pt-2 pb-4 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
              <span>Powered by Google Maps & GIS Techno-Economic Engine</span>
              <span>Global Mini-Grid Standards</span>
            </div>
          </section>
        )}
      </main>

      {/* Pre-Feasibility Brief Modal */}
      <FeasibilityBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        aiResult={aiResult}
        metrics={metrics}
        params={sensitivityParams}
        siteName={`${selectedPreset.name} (${geoInfo.state}, ${geoInfo.country})`}
      />
    </div>
  );
}
