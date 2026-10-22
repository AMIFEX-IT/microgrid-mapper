import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BarChart3,
  Sun,
  Battery,
  DollarSign,
  Scale
} from 'lucide-react';
import { AISpatialResult, SavedAssessment, SensitivityParams, TechnoEconomicMetrics } from '../types';

interface ComparisonViewProps {
  currentAiResult: AISpatialResult | null;
  currentMetrics: TechnoEconomicMetrics | null;
  currentParams: SensitivityParams;
  currentLocationName: string;
  currentState: string;
  currentCountry: string;
  savedAssessments: SavedAssessment[];
  onSaveCurrent: (name: string) => void;
  onDeleteSaved: (id: string) => void;
  onSelectAsCurrent: (assessment: SavedAssessment) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  currentAiResult,
  currentMetrics,
  currentParams,
  currentLocationName,
  currentState,
  currentCountry,
  savedAssessments,
  onSaveCurrent,
  onDeleteSaved,
  onSelectAsCurrent,
}) => {
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(
    savedAssessments[0]?.id || ''
  );
  const [newSaveName, setNewSaveName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const selectedBaseline = savedAssessments.find((a) => a.id === selectedBaselineId) || savedAssessments[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSaveName.trim() || `${currentLocationName} (${new Date().toLocaleDateString()})`;
    onSaveCurrent(name);
    setNewSaveName('');
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  if (!currentMetrics || !currentAiResult) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400">
        <Scale className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-300">No Assessment Data Yet</p>
        <p className="text-xs text-slate-500 mt-1">Run an assessment on the map first to compare sites.</p>
      </div>
    );
  }

  // Delta helpers
  const renderDelta = (
    currentVal: number,
    baseVal: number,
    unit: string,
    isCurrency: boolean = false,
    invertColor: boolean = false
  ) => {
    const diff = currentVal - baseVal;
    if (baseVal === 0) return <span className="text-slate-400 font-mono text-[11px]">-</span>;

    const percent = Math.round((diff / baseVal) * 100);
    const isPositive = diff > 0;
    const isZero = diff === 0;

    if (isZero) {
      return <span className="text-slate-400 font-mono text-[11px] tabular-nums">0%</span>;
    }

    // For costs/LCOE, lower is better (inverted)
    const isGood = invertColor ? !isPositive : isPositive;
    const colorClass = isGood ? 'text-emerald-400' : 'text-rose-400';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    const formattedDiff = isCurrency
      ? `${isPositive ? '+' : '-'}$${Math.abs(Math.round(diff)).toLocaleString()}`
      : `${isPositive ? '+' : ''}${Math.round(diff * 10) / 10} ${unit}`;

    return (
      <div className={`flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{formattedDiff}</span>
        <span className="opacity-80">({isPositive ? '+' : ''}{percent}%)</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Comparison Target Selector Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Select Baseline Reference to Compare:</span>
          </label>

          <button
            onClick={() => setIsSaving(!isSaving)}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
          >
            <Bookmark className="w-3 h-3" />
            <span>Save Current Site</span>
          </button>
        </div>

        {/* Save Site Form Input */}
        {isSaving && (
          <form onSubmit={handleSave} className="flex gap-2 pt-1 border-t border-slate-100">
            <input
              type="text"
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              placeholder={`e.g. ${currentLocationName} Baseline`}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              Save
            </button>
          </form>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Current site saved to comparison library!</span>
          </div>
        )}

        {/* Dropdown for Baseline Target */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBaselineId}
            onChange={(e) => setSelectedBaselineId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
          >
            {savedAssessments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.isBaseline ? '★ ' : '📁 '}
                {item.name} ({item.state}, {item.country}) · LCOE: ${item.metrics.lcoePerKwh.toFixed(3)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      {selectedBaseline && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
          {/* Header row: Current vs Baseline */}
          <div className="grid grid-cols-2 p-3 bg-slate-50/80 gap-3">
            <div className="pr-2 border-r border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 block font-semibold">
                Current Assessment
              </span>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate mt-0.5">
                {currentLocationName}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {currentState}, {currentCountry}
              </p>
            </div>

            <div className="pl-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 block font-semibold">
                  Baseline Reference
                </span>
                {!selectedBaseline.isBaseline && (
                  <button
                    onClick={() => onDeleteSaved(selectedBaseline.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors"
                    title="Delete saved assessment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate mt-0.5">
                {selectedBaseline.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {selectedBaseline.state}, {selectedBaseline.country}
              </p>
            </div>
          </div>

          {/* Metric Comparison Rows */}
          <div className="p-3 space-y-3 text-xs">
            {/* 1. LCOE (Primary Viability) */}
            <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Levelized Cost (LCOE)</span>
                <span>Delta Difference</span>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="font-mono text-base font-bold text-emerald-600 tabular-nums">
                  ${currentMetrics.lcoePerKwh.toFixed(3)}
                  <span className="text-[10px] font-normal text-slate-500 ml-1">/kWh</span>
                </div>
                <div className="font-mono text-base font-bold text-slate-700 tabular-nums">
                  ${selectedBaseline.metrics.lcoePerKwh.toFixed(3)}
                  <span className="text-[10px] font-normal text-slate-500 ml-1">/kWh</span>
                </div>
              </div>
              <div className="pt-0.5 border-t border-slate-200/60 flex justify-end">
                {renderDelta(
                  currentMetrics.lcoePerKwh,
                  selectedBaseline.metrics.lcoePerKwh,
                  '$/kWh',
                  true,
                  true // lower cost is better
                )}
              </div>
            </div>

            {/* 2. Total CAPEX */}
            <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Total Project CAPEX</span>
                <span>Delta</span>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="font-mono text-sm font-bold text-amber-600 tabular-nums">
                  ${currentMetrics.estimatedCapex.toLocaleString()}
                </div>
                <div className="font-mono text-sm font-bold text-slate-700 tabular-nums">
                  ${selectedBaseline.metrics.estimatedCapex.toLocaleString()}
                </div>
              </div>
              <div className="pt-0.5 border-t border-slate-200/60 flex justify-end">
                {renderDelta(
                  currentMetrics.estimatedCapex,
                  selectedBaseline.metrics.estimatedCapex,
                  '$',
                  true,
                  true // lower capex is better
                )}
              </div>
            </div>

            {/* 3. PV Array Capacity */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PV Capacity (Current)</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {currentMetrics.pvCapacityKwp.toLocaleString()} kWp
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PV Capacity (Baseline)</span>
                <span className="font-mono font-bold text-slate-700 tabular-nums">
                  {selectedBaseline.metrics.pvCapacityKwp.toLocaleString()} kWp
                </span>
              </div>
            </div>
            <div className="flex justify-end pr-1 text-[11px]">
              {renderDelta(
                currentMetrics.pvCapacityKwp,
                selectedBaseline.metrics.pvCapacityKwp,
                'kWp',
                false,
                false
              )}
            </div>

            {/* 4. Battery Storage Autonomy */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">BESS Storage (Current)</span>
                <span className="font-mono font-bold text-sky-600 tabular-nums">
                  {currentMetrics.batteryStorageKwh.toLocaleString()} kWh
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">BESS Storage (Baseline)</span>
                <span className="font-mono font-bold text-slate-700 tabular-nums">
                  {selectedBaseline.metrics.batteryStorageKwh.toLocaleString()} kWh
                </span>
              </div>
            </div>
            <div className="flex justify-end pr-1 text-[11px]">
              {renderDelta(
                currentMetrics.batteryStorageKwh,
                selectedBaseline.metrics.batteryStorageKwh,
                'kWh',
                false,
                false
              )}
            </div>

            {/* 5. Households Electrified */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Households (Current)</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  ~{currentMetrics.householdsElectrified.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Households (Baseline)</span>
                <span className="font-mono font-bold text-slate-700 tabular-nums">
                  ~{selectedBaseline.metrics.householdsElectrified.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-end pr-1 text-[11px]">
              {renderDelta(
                currentMetrics.householdsElectrified,
                selectedBaseline.metrics.householdsElectrified,
                'homes',
                false,
                false
              )}
            </div>
          </div>

          {/* Quick Apply Action */}
          <div className="p-3 bg-slate-50/90 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Compare another site or switch map focus
            </span>
            <button
              onClick={() => onSelectAsCurrent(selectedBaseline)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
              <span>Load Baseline to Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
