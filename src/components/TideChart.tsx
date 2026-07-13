import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { TideEvent } from "../types";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

interface TideChartProps {
  tideForecast: TideEvent[];
  tideHeight: number;
  tideState: string;
}

export const TideChart: React.FC<TideChartProps> = ({
  tideForecast,
  tideHeight,
  tideState,
}) => {
  // Find high and low tide points for display
  const highTides = tideForecast.filter((t) => t.label.toLowerCase().includes("high"));
  const lowTides = tideForecast.filter((t) => t.label.toLowerCase().includes("low"));

  // Format tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TideEvent = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 font-sans mb-1 font-semibold">{data.time} Forecast</p>
          <p className="text-cyan-400 text-sm font-bold">
            Height: {data.height.toFixed(1)} ft
          </p>
          {data.label && (
            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              data.label.toLowerCase().includes("high") 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}>
              {data.label}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col p-5 rounded-2xl glass-panel h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white font-display">Tidal Curve (24-Hour Cycle)</h3>
          <p className="text-xs text-slate-400">Relative to MLLW reference datum</p>
        </div>
        
        {/* Current status chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/50">
            {tideState.toLowerCase().includes("ris") || tideState.toLowerCase().includes("high") ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="text-xs font-semibold text-slate-200">
              {tideState} ({tideHeight.toFixed(1)} ft)
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="relative w-full h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={tideForecast}
            margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
          >
            <defs>
              <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={8}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(value) => `${value}ft`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Horizontal MLLW line */}
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" label={{ value: 'MLLW', fill: '#64748b', fontSize: 8, position: 'right' }} />
            
            {/* Active height line */}
            <ReferenceLine y={tideHeight} stroke="#14b8a6" strokeWidth={1} strokeDasharray="2 2" />

            <Area
              type="monotone"
              dataKey="height"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#tideGradient)"
              activeDot={{ r: 6, stroke: '#0891b2', strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tide extremes list */}
      <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-800/80 pt-3 text-xs font-mono">
        <div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">High Tides</div>
          <div className="flex flex-col gap-1.5">
            {highTides.length > 0 ? (
              highTides.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                  <span className="text-emerald-400 font-semibold">{t.time}</span>
                  <span className="text-slate-200">{t.height.toFixed(1)} ft</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">None logged in cycle</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Low Tides</div>
          <div className="flex flex-col gap-1.5">
            {lowTides.length > 0 ? (
              lowTides.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                  <span className="text-blue-400 font-semibold">{t.time}</span>
                  <span className="text-slate-200">{t.height.toFixed(1)} ft</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">None logged in cycle</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-1.5 mt-3 text-[10px] text-slate-400 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <span>Tide Heights fluctuate relative to Mean Lower Low Water (MLLW). Exercise extreme caution during heavy surges or negative low tides.</span>
      </div>
    </div>
  );
};
