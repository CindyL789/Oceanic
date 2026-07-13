import React from "react";
import { Compass, Waves, Wind } from "lucide-react";

interface SwellCompassProps {
  swellDegrees: number;
  swellDirection: string;
  windDegrees: number;
  windDirection: string;
}

export const SwellCompass: React.FC<SwellCompassProps> = ({
  swellDegrees,
  swellDirection,
  windDegrees,
  windDirection,
}) => {
  // Convert degrees to SVG coordinate angles (0 deg in math is East, in compass North is 0/360)
  // SVG rotation handles this natively with transform="rotate(deg, cx, cy)"
  
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl glass-panel-light h-full">
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-5 h-5 text-cyan-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-display">Vector Alignment</span>
      </div>
      
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Outer Ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Compass background circle */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,3" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="#1e293b" strokeWidth="1" />
          
          {/* North, East, South, West ticks */}
          <line x1="100" y1="8" x2="100" y2="18" stroke="#ef4444" strokeWidth="2" /> {/* North (Red Tick) */}
          <line x1="192" y1="100" x2="182" y2="100" stroke="#64748b" strokeWidth="1.5" /> {/* East */}
          <line x1="100" y1="192" x2="100" y2="182" stroke="#64748b" strokeWidth="1.5" /> {/* South */}
          <line x1="8" y1="100" x2="18" y2="100" stroke="#64748b" strokeWidth="1.5" /> {/* West */}
          
          {/* Swell Arrow Group (Teal) */}
          <g transform={`rotate(${swellDegrees}, 100, 100)`}>
            {/* Swell Line (entering towards center) */}
            <line x1="100" y1="20" x2="100" y2="95" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" />
            {/* Arrowhead pointing to center */}
            <polygon points="100,100 94,84 106,84" fill="#06b6d4" />
            <circle cx="100" cy="20" r="5" fill="#06b6d4" />
          </g>

          {/* Wind Arrow Group (Orange) */}
          <g transform={`rotate(${windDegrees}, 100, 100)`}>
            {/* Wind Line (blowing across or from edge) */}
            <line x1="100" y1="35" x2="100" y2="92" stroke="#f97316" strokeWidth="2" strokeDasharray="4,2" />
            {/* Arrowhead pointing to center */}
            <polygon points="100,95 96,82 104,82" fill="#f97316" />
            <circle cx="100" cy="35" r="4" fill="#f97316" />
          </g>

          {/* Center Hub */}
          <circle cx="100" cy="100" r="8" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <circle cx="100" cy="100" r="3" fill="#06b6d4" />
        </svg>

        {/* Labels overlay */}
        <div className="absolute top-1 text-[10px] font-bold text-red-400 select-none">N</div>
        <div className="absolute right-1 text-[10px] font-bold text-slate-400 select-none">E</div>
        <div className="absolute bottom-1 text-[10px] font-bold text-slate-400 select-none">S</div>
        <div className="absolute left-1 text-[10px] font-bold text-slate-400 select-none">W</div>
      </div>

      {/* Legend */}
      <div className="flex justify-between w-full mt-3 text-[11px] font-mono border-t border-slate-800 pt-2 gap-4">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Waves className="w-3 h-3" />
          <div>
            <span className="text-slate-400">Swell:</span> {swellDirection} ({swellDegrees}°)
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-orange-400">
          <Wind className="w-3 h-3" />
          <div>
            <span className="text-slate-400">Wind:</span> {windDirection} ({windDegrees}°)
          </div>
        </div>
      </div>
    </div>
  );
};
