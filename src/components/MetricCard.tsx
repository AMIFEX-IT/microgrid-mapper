import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'blue' | 'slate';
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  variant = 'slate',
  tooltip,
}) => {
  const getAccentColor = () => {
    switch (variant) {
      case 'amber':
        return 'text-amber-600 bg-amber-50/50 border-amber-200/80 hover:border-amber-400';
      case 'emerald':
        return 'text-emerald-600 bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-400';
      case 'blue':
        return 'text-sky-600 bg-sky-50/50 border-sky-200/80 hover:border-sky-400';
      default:
        return 'text-slate-700 bg-slate-50/70 border-slate-200 hover:border-slate-300';
    }
  };

  return (
    <div
      className={`group relative p-3.5 rounded-xl border transition-all shadow-sm ${getAccentColor()}`}
      title={tooltip}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-slate-600 tracking-tight leading-tight">
          {label}
        </span>
        {icon && <span className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 font-sans">{unit}</span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-slate-500 line-clamp-1 font-normal">
          {subtext}
        </p>
      )}
    </div>
  );
};
