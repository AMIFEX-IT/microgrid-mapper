import React, { useState } from 'react';
import { X, Printer, Download, Copy, Check, FileText, Sun, Battery, DollarSign, Globe, Award } from 'lucide-react';
import { AISpatialResult, SensitivityParams, TechnoEconomicMetrics } from '../types';

interface FeasibilityBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiResult: AISpatialResult | null;
  metrics: TechnoEconomicMetrics | null;
  params: SensitivityParams;
  siteName: string;
}

export const FeasibilityBriefModal: React.FC<FeasibilityBriefModalProps> = ({
  isOpen,
  onClose,
  aiResult,
  metrics,
  params,
  siteName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !aiResult || !metrics) return null;

  const documentId = `GEO-MG-${Math.abs(Math.round(aiResult.center.lat * 1000))}-${Math.abs(Math.round(aiResult.center.lng * 1000))}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      standard_protocol: 'GIS Rural Mini-Grid Sizing & Techno-Economic Protocol',
      document_id: documentId,
      evaluation_date: aiResult.analyzed_at,
      location: {
        site_name: siteName,
        center: aiResult.center,
        bounding_box: aiResult.bounds,
      },
      spatial_reconnaissance: {
        usable_rooftop_m2: aiResult.usable_rooftop_m2,
        building_density: aiResult.building_density,
        roof_material: aiResult.roof_material,
        visible_infrastructure: aiResult.visible_infrastructure,
        grid_distance_km: aiResult.grid_distance_km,
        avg_solar_ghi_kwh_m2: aiResult.avg_solar_ghi_kwh_m2,
      },
      system_specifications: {
        pv_capacity_kwp: metrics.pvCapacityKwp,
        daily_generation_kwh: metrics.dailyGenerationKwh,
        annual_generation_kwh: metrics.annualGenerationKwh,
        battery_storage_kwh: metrics.batteryStorageKwh,
        storage_autonomy_days: params.autonomyDays,
        peak_sun_hours: params.peakSunHours,
      },
      techno_economic_assessment: {
        pv_capex_usd: metrics.pvCapex,
        battery_capex_usd: metrics.batteryCapex,
        total_capex_usd: metrics.estimatedCapex,
        lcoe_per_kwh_usd: metrics.lcoePerKwh,
        diesel_savings_per_year_usd: metrics.dieselSavingsPerYearUsd,
        feasibility_status: metrics.feasibilityScore,
      },
      socio_environmental_impact: {
        households_electrified: metrics.householdsElectrified,
        co2_mitigated_tons_year: metrics.co2MitigatedTonsYear,
      },
      executive_summary: metrics.summarySentence,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentId}-brief.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = `# MINI-GRID PRE-FEASIBILITY ASSESSMENT BRIEF
**Document ID:** ${documentId}
**Date:** ${currentDate}
**Location:** ${siteName} (${aiResult.center.lat.toFixed(4)}°, ${aiResult.center.lng.toFixed(4)}°)

## 1. Executive Summary
${metrics.summarySentence}

## 2. Geospatial Reconnaissance
- Usable Solar Rooftop Footprint: ${aiResult.usable_rooftop_m2.toLocaleString()} m²
- Settlement Density: ${aiResult.building_density}
- Predominant Roof Material: ${aiResult.roof_material}
- Visible Grid Infrastructure: ${aiResult.visible_infrastructure ? 'Present (local distribution poles)' : 'None (isolated off-grid)'}
- Distance to Main Grid: ${aiResult.grid_distance_km} km
- Solar GHI Insolation: ${aiResult.avg_solar_ghi_kwh_m2} kWh/m²/day

## 3. Mini-Grid Technical Sizing
- Solar PV Capacity: ${metrics.pvCapacityKwp.toLocaleString()} kWp (at 20% system efficiency)
- Daily Solar Generation: ${metrics.dailyGenerationKwh.toLocaleString()} kWh/day (at ${params.peakSunHours} PSH)
- Annual Solar Yield: ${metrics.annualGenerationKwh.toLocaleString()} kWh/year
- Battery Storage (BESS): ${metrics.batteryStorageKwh.toLocaleString()} kWh (LiFePO4, ${params.autonomyDays} days autonomy)

## 4. Financial & Economic Analysis
- Solar PV CAPEX: $${metrics.pvCapex.toLocaleString()} ($${params.pvCostPerKw}/kWp)
- Battery Storage CAPEX: $${metrics.batteryCapex.toLocaleString()} ($${params.batteryCostPerKwh}/kWh)
- Total Initial CAPEX: $${metrics.estimatedCapex.toLocaleString()}
- Levelized Cost of Electricity (LCOE): $${metrics.lcoePerKwh.toFixed(3)} / kWh
- Projected Annual Diesel Savings: $${metrics.dieselSavingsPerYearUsd.toLocaleString()} / year
- Viability Classification: ${metrics.feasibilityScore}

## 5. Development Impact
- Rural Households Electrified: ~${metrics.householdsElectrified} homes
- Estimated Annual CO2 Emissions Abated: ${metrics.co2MitigatedTonsYear} metric tons / year
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentId}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(metrics.summarySentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide">
                Pre-Feasibility Assessment Brief
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {documentId} · {currentDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-sm cursor-pointer"
              title="Print document or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300 cursor-pointer"
              title="Download structured JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-sm cursor-pointer"
              title="Download Markdown report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Body */}
        <div id="feasibility-brief-printable" className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {/* Institutional Header Banner */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-600 tracking-wider uppercase font-mono">
                  Rural Renewable Mini-Grid Planning Division
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  Solar-Plus-Storage Mini-Grid Pre-Feasibility Brief
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Target Settlement: <strong className="text-slate-800">{siteName}</strong> · Coordinates: <span className="font-mono">{aiResult.center.lat.toFixed(4)}°N, {aiResult.center.lng.toFixed(4)}°E</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 font-semibold">
                  Status: <span className="text-emerald-600 font-bold">{metrics.feasibilityScore}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Methodology: GIS-PV-BESS v2.4</p>
              </div>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                1. Executive Summary & Site Assessment
              </h3>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800 font-normal shadow-sm">
              {metrics.summarySentence}
            </p>
          </div>

          {/* 2. Reconnaissance & Technical Sizing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spatial GIS Metrics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Geospatial AI Reconnaissance</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Usable Rooftop Area</span>
                  <span className="font-mono font-semibold text-slate-900">{aiResult.usable_rooftop_m2.toLocaleString()} m²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Building Density</span>
                  <span className="font-semibold text-slate-900">{aiResult.building_density}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Dominant Roof Material</span>
                  <span className="font-semibold text-slate-900">{aiResult.roof_material}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Visible Grid Infrastructure</span>
                  <span className="font-semibold text-slate-900">{aiResult.visible_infrastructure ? 'Detected' : 'None (Off-Grid)'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Distance to High-Voltage Grid</span>
                  <span className="font-mono font-semibold text-slate-900">{aiResult.grid_distance_km} km</span>
                </div>
              </div>
            </div>

            {/* Technical Sizing Specifications */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>System Sizing & Generation</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Photovoltaic Array Capacity</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.pvCapacityKwp.toLocaleString()} kWp</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Daily Solar Generation</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.dailyGenerationKwh.toLocaleString()} kWh/day</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Annual Solar Generation</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.annualGenerationKwh.toLocaleString()} kWh/yr</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Battery Energy Storage (BESS)</span>
                  <span className="font-mono font-semibold text-slate-900">{metrics.batteryStorageKwh.toLocaleString()} kWh</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Storage Autonomy Reserve</span>
                  <span className="font-mono font-semibold text-slate-900">{params.autonomyDays} Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Techno-Economic Financial Ledger */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Techno-Economic Financial Breakdown (20-Year Horizon)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">USD Standard Benchmark</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 block mb-1">Solar PV CAPEX</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">${metrics.pvCapex.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">${params.pvCostPerKw}/kWp</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 block mb-1">BESS Battery CAPEX</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">${metrics.batteryCapex.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">${params.batteryCostPerKwh}/kWh</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 block mb-1">Total Estimated CAPEX</span>
                <span className="text-base font-bold font-mono text-amber-600 tabular-nums">${metrics.estimatedCapex.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Turnkey Installed</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-500 block mb-1">Levelized Cost (LCOE)</span>
                <span className="text-base font-bold font-mono text-emerald-600 tabular-nums">${metrics.lcoePerKwh.toFixed(3)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">per kWh</span>
              </div>
            </div>
          </div>

          {/* 4. Development & Climate Impact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Households Electrified</span>
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">~{metrics.householdsElectrified.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Rural Tier 2/3 Access</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Battery className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Annual Diesel Savings</span>
                <span className="text-lg font-bold font-mono text-emerald-600 tabular-nums">${metrics.dieselSavingsPerYearUsd.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">vs. $0.52/kWh genset</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-100 text-sky-700">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">CO₂ Abated</span>
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">{metrics.co2MitigatedTonsYear} t/yr</span>
                <span className="text-[10px] text-slate-400">Direct emission offset</span>
              </div>
            </div>
          </div>

          {/* Disclaimer & Citation Footer */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p>
              * This pre-feasibility brief is synthesized from automated geospatial computer vision and techno-economic modeling conforming to industry microgrid development guidelines. Detailed geotechnical surveying and ground irradiance measurements are required prior to final investment decision (FID).
            </p>
            <p>
              Generated via Open-Source GIS Spatial Planner for Rural Renewable Energy Access.
            </p>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500 font-mono font-medium">
            Format: Standard Pre-Feasibility Protocol (PDF / JSON / Markdown)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
