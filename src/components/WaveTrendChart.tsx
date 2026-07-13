import React from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { WaveForecastPoint } from "../types";
import { CalendarRange, Activity } from "lucide-react";

interface WaveTrendChartProps {
  waveForecast: WaveForecastPoint[];
}

export const WaveTrendChart: React.FC<WaveTrendChartProps> = ({ waveForecast }) => {
  // Format data for presentation, joining day and time for unique labels
  const formattedData = waveForecast.map((point) => ({
    ...point,
    label: `${point.day} ${point.time}`,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-400 font-sans mb-1 font-semibold">{data.day} @ {data.time}</p>
          <div className="space-y-1">
            <p className="text-cyan-400 font-bold">
              Wave Height: {data.waveHeight.toFixed(1)} ft
            </p>
            <p className="text-amber-400 font-bold">
              Swell Period: {data.swellPeriod} sec
            </p>
            <p className="text-slate-300">
              Wind Speed: {data.windSpeed} kts
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col p-5 rounded-2xl glass-panel h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white font-display">Swell & Wave Height Trend</h3>
          <p className="text-xs text-slate-400">3-Day multi-variable offshore prediction</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/50">
          <CalendarRange className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-slate-200">72h Outlook</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="relative w-full h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 15, right: -5, left: -25, bottom: 5 }}
          >
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => {
                // Shorten labels like "Today 08:00" to "Today 8a" or just "Today" on first hit
                const parts = val.split(" ");
                if (parts[1] === "08:00" || parts[1] === "06:00") {
                  return parts[0]; // just show the day name
                }
                return parts[1]; // show the hour
              }}
              dy={8}
            />
            {/* Left Y-Axis: Wave Height */}
            <YAxis 
              yAxisId="left"
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value}ft`}
            />
            {/* Right Y-Axis: Swell Period */}
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#eab308" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value}s`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={24}
              iconSize={10}
              iconType="circle"
              wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }}
            />
            
            {/* Wave Height Bar */}
            <Bar 
              yAxisId="left"
              name="Wave Height (ft)"
              dataKey="waveHeight" 
              fill="#06b6d4" 
              radius={[4, 4, 0, 0]}
              maxBarSize={16}
            />
            
            {/* Swell Period Line */}
            <Line 
              yAxisId="right"
              name="Swell Period (s)"
              type="monotone" 
              dataKey="swellPeriod" 
              stroke="#eab308" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#eab308', strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <Activity className="w-4 h-4 text-amber-500" />
        <span>
          <strong className="text-slate-300">Ocean Intelligence:</strong> Swell periods above 12 seconds represent long-interval groundswells which hold high wave energy, making surf cleaner and safer on reefs.
        </span>
      </div>
    </div>
  );
};
