import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_SENSITIVITY } from '../utils/technoEconomic';
import { SensitivityParams } from '../types';

interface SensitivityControlsProps {
  params: SensitivityParams;
  onChange: (newParams: SensitivityParams) => void;
}

export const SensitivityControls: React.FC<SensitivityControlsProps> = ({ params, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onChange(DEFAULT_SENSITIVITY);
  };

  const isModified =
    params.peakSunHours !== DEFAULT_SENSITIVITY.peakSunHours ||
    params.autonomyDays !== DEFAULT_SENSITIVITY.autonomyDays ||
    params.pvCostPerKw !== DEFAULT_SENSITIVITY.pvCostPerKw ||
    params.batteryCostPerKwh !== DEFAULT_SENSITIVITY.batteryCostPerKwh;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-800">
            Techno-Economic Sensitivity Parameters
          </span>
          {isModified && (
            <span className="text-[10px] text-amber-600 font-mono font-medium">
              (Customized)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-[11px] font-mono text-slate-500">
            {params.peakSunHours}h · {params.autonomyDays}d · ${params.pvCostPerKw}/kW
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/60">
          {/* Peak Sun Hours Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">Peak Sun Hours (PSH)</span>
              <span className="font-mono text-amber-600 tabular-nums font-semibold">
                {params.peakSunHours} hrs/day
              </span>
            </div>
            <input
              type="range"
              min="3.0"
              max="6.5"
              step="0.1"
              value={params.peakSunHours}
              onChange={(e) => onChange({ ...params, peakSunHours: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>3.0h (Monsoon/Cloudy)</span>
              <span>4.5h (Default)</span>
              <span>6.5h (Arid Sahara)</span>
            </div>
          </div>

          {/* Battery Autonomy Days Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">BESS Storage Autonomy</span>
              <span className="font-mono text-amber-600 tabular-nums font-semibold">
                {params.autonomyDays} days
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={params.autonomyDays}
              onChange={(e) => onChange({ ...params, autonomyDays: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0d (Basic)</span>
              <span>1.5d (Standard)</span>
              <span>3.0d (High Reliability)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* PV Cost per kWp Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">PV Module CAPEX</span>
                <span className="font-mono text-slate-800 tabular-nums font-semibold">${params.pvCostPerKw}/kWp</span>
              </div>
              <input
                type="range"
                min="600"
                max="1400"
                step="25"
                value={params.pvCostPerKw}
                onChange={(e) => onChange({ ...params, pvCostPerKw: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Battery Cost per kWh Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">BESS Li-ion CAPEX</span>
                <span className="font-mono text-slate-800 tabular-nums font-semibold">${params.batteryCostPerKwh}/kWh</span>
              </div>
              <input
                type="range"
                min="160"
                max="450"
                step="10"
                value={params.batteryCostPerKwh}
                onChange={(e) => onChange({ ...params, batteryCostPerKwh: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Reset Action */}
          {isModified && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Standard Defaults</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
