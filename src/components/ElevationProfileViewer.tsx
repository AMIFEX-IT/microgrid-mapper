import React, { useState, useRef } from 'react';
import {
  Mountain,
  TrendingUp,
  Activity,
  ArrowRight,
  Compass,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { ElevationPoint, ElevationProfileData, TransectDirection } from '../types';

interface ElevationProfileViewerProps {
  data: ElevationProfileData | null;
  isLoading: boolean;
  onDirectionChange: (dir: TransectDirection) => void;
  onRefresh: () => void;
  onHoverPoint?: (point: ElevationPoint | null) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const ElevationProfileViewer: React.FC<ElevationProfileViewerProps> = ({
  data,
  isLoading,
  onDirectionChange,
  onRefresh,
  onHoverPoint,
  onClose,
  compact = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!data && !isLoading) return null;

  // SVG Chart Dimensions
  const svgWidth = 640;
  const svgHeight = compact ? 120 : 160;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  let points = data?.points || [];
  const minElev = data?.minElevation ?? 0;
  const maxElev = data?.maxElevation ?? 10;
  const elevRange = Math.max(1, maxElev - minElev);
  // Add 10% breathing room to Y-axis
  const yMin = Math.max(0, Math.floor(minElev - Math.max(1, elevRange * 0.15)));
  const yMax = Math.ceil(maxElev + Math.max(1, elevRange * 0.15));
  const yRange = Math.max(1, yMax - yMin);

  const totalDist = data?.totalDistanceMeters || 1;

  // Convert points to SVG coordinates
  const svgCoords = points.map((p, i) => {
    const x = padding.left + (p.distanceMeters / totalDist) * innerWidth;
    const y = padding.top + innerHeight - ((p.elevation - yMin) / yRange) * innerHeight;
    return { x, y, point: p, index: i };
  });

  // Construct SVG Area & Line Paths
  let linePathD = '';
  let areaPathD = '';

  if (svgCoords.length > 0) {
    linePathD = `M ${svgCoords[0].x} ${svgCoords[0].y}`;
    for (let i = 1; i < svgCoords.length; i++) {
      // Smooth cubic curve
      const prev = svgCoords[i - 1];
      const curr = svgCoords[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 2;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) / 2;
      const cpy2 = curr.y;
      linePathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }

    const lastX = svgCoords[svgCoords.length - 1].x;
    const firstX = svgCoords[0].x;
    const bottomY = padding.top + innerHeight;
    areaPathD = `${linePathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  // Handle Mouse movement across SVG chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || svgCoords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    // Find closest point by X coordinate
    let closestIndex = 0;
    let minDiff = Infinity;
    svgCoords.forEach((coord, idx) => {
      const diff = Math.abs(coord.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
    if (onHoverPoint) {
      onHoverPoint(points[closestIndex]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    if (onHoverPoint) {
      onHoverPoint(null);
    }
  };

  const hoveredCoord = hoveredIndex !== null && svgCoords[hoveredIndex] ? svgCoords[hoveredIndex] : null;

  // Y-axis tick intervals
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const val = yMin + (yRange / (yTickCount - 1)) * i;
    const yPos = padding.top + innerHeight - ((val - yMin) / yRange) * innerHeight;
    return { val: Math.round(val * 10) / 10, y: yPos };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden transition-all duration-200">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center">
            <Mountain className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Site Elevation Profile & Topography</span>
              {data && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    data.feasibilityCategory === 'Ideal (Low Civil Cost)'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : data.feasibilityCategory === 'Moderate Incline'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {data.feasibilityCategory}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Transect Controls & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Direction Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-medium">
            <button
              onClick={() => onDirectionChange('west-east')}
              className={`px-2 py-0.5 rounded transition-colors ${
                data?.direction === 'west-east'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="West to East cross-section transect"
            >
              W → E
            </button>
            <button
              onClick={() => onDirectionChange('north-south')}
              className={`px-2 py-0.5 rounded transition-colors ${
                data?.direction === 'north-south'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="North to South cross-section transect"
            >
              N → S
            </button>
            <button
              onClick={() => onDirectionChange('sw-ne')}
              className={`px-2 py-0.5 rounded transition-colors ${
                data?.direction === 'sw-ne'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="South-West to North-East diagonal transect"
            >
              SW → NE
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh elevation profile for current map bounds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand profile' : 'Collapse profile'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors ml-1 cursor-pointer"
              title="Close elevation viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content (Collapsible) */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          {isLoading && !data ? (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              <span>Sampling digital elevation terrain from Open-Meteo & SRTM...</span>
            </div>
          ) : data ? (
            <>
              {/* Interactive SVG Line Chart */}
              <div className="relative w-full bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 select-none">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto cursor-crosshair overflow-visible"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                    <linearGradient id="elevation-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines & Y-axis Ticks */}
                  {yTicks.map((tick, i) => (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={tick.y}
                        x2={padding.left + innerWidth}
                        y2={tick.y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 6}
                        y={tick.y + 3.5}
                        textAnchor="end"
                        fontSize="9"
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {tick.val}m
                      </text>
                    </g>
                  ))}

                  {/* Area fill under curve */}
                  {areaPathD && <path d={areaPathD} fill="url(#elevation-gradient)" />}

                  {/* Elevation line stroke */}
                  {linePathD && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Distance Axis (Bottom) */}
                  <line
                    x1={padding.left}
                    y1={padding.top + innerHeight}
                    x2={padding.left + innerWidth}
                    y2={padding.top + innerHeight}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left}
                    y={padding.top + innerHeight + 16}
                    textAnchor="start"
                    fontSize="9"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    0 m (Start)
                  </text>
                  <text
                    x={padding.left + innerWidth / 2}
                    y={padding.top + innerHeight + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {Math.round(totalDist / 2)} m
                  </text>
                  <text
                    x={padding.left + innerWidth}
                    y={padding.top + innerHeight + 16}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {totalDist >= 1000 ? `${(totalDist / 1000).toFixed(2)} km` : `${totalDist} m`} (End)
                  </text>

                  {/* Hover Guideline & Indicator */}
                  {hoveredCoord && (
                    <g>
                      <line
                        x1={hoveredCoord.x}
                        y1={padding.top}
                        x2={hoveredCoord.x}
                        y2={padding.top + innerHeight}
                        stroke="#0284c7"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={hoveredCoord.x}
                        cy={hoveredCoord.y}
                        r="5.5"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Interactive Hover Tooltip */}
                {hoveredCoord && (
                  <div
                    className="absolute pointer-events-none z-20 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg shadow-md text-[11px] font-mono transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${(hoveredCoord.x / svgWidth) * 100}%`,
                      top: `${Math.max(12, (hoveredCoord.y / svgHeight) * 100 - 8)}%`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{hoveredCoord.point.elevation.toFixed(1)} m</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-200">{hoveredCoord.point.distanceMeters} m from start</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Topographic Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Min / Max Elevation</span>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                    {data.minElevation}m <span className="text-slate-400 font-normal">to</span> {data.maxElevation}m
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Δh: {data.elevationChange}m relief
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Average Slope</span>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                    {data.avgSlopePercent}%
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Max: {data.maxSlopePercent}%
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Transect Distance</span>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                    {data.totalDistanceMeters >= 1000
                      ? `${(data.totalDistanceMeters / 1000).toFixed(2)} km`
                      : `${data.totalDistanceMeters} m`}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    24 discrete points
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Civil Work Feasibility</span>
                  <div
                    className={`text-xs font-bold truncate mt-0.5 ${
                      data.feasibilityCategory === 'Ideal (Low Civil Cost)'
                        ? 'text-emerald-700'
                        : data.feasibilityCategory === 'Moderate Incline'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {data.feasibilityCategory.split(' ')[0]}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Site Grading Index
                  </span>
                </div>
              </div>

              {/* 4. Actionable Civil Infrastructure Assessment Insight */}
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] leading-relaxed text-amber-950 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-amber-900">Infrastructure Feasibility Note: </strong>
                  <span>{data.civilWorksAssessment}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
