import React from "react";
import { MarineForecast } from "../types";
import { 
  Waves, 
  Wind, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudFog, 
  Umbrella, 
  Activity, 
  Fish, 
  Clock,
  Eye,
  CheckCircle2
} from "lucide-react";
import { SwellCompass } from "./SwellCompass";

interface MarineDashboardProps {
  forecast: MarineForecast;
}

export const MarineDashboard: React.FC<MarineDashboardProps> = ({ forecast }) => {
  const { current, marineLifePrediction, environmentalAlerts } = forecast;

  // Dynamically select weather icon
  const getWeatherIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "sun":
        return <Sun className="w-8 h-8 text-amber-400" />;
      case "cloud":
        return <Cloud className="w-8 h-8 text-slate-400" />;
      case "cloudrain":
      case "rain":
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case "cloudlightning":
      case "lightning":
        return <CloudLightning className="w-8 h-8 text-purple-400" />;
      case "cloudfog":
      case "fog":
        return <CloudFog className="w-8 h-8 text-slate-500" />;
      case "umbrella":
        return <Umbrella className="w-8 h-8 text-cyan-400" />;
      default:
        return <Sun className="w-8 h-8 text-amber-400" />;
    }
  };

  // Determine safety style
  const getSafetyConfig = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "safe":
        return {
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          bgColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          textColor: "text-emerald-400",
          border: "border-emerald-500/30"
        };
      case "caution":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          bgColor: "bg-amber-500/10 border-amber-500/20 text-amber-300",
          textColor: "text-amber-400",
          border: "border-amber-500/30"
        };
      case "dangerous":
        return {
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
          bgColor: "bg-rose-500/10 border-rose-500/20 text-rose-300",
          textColor: "text-rose-400",
          border: "border-rose-500/30"
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5 text-slate-400" />,
          bgColor: "bg-slate-500/10 border-slate-500/20 text-slate-300",
          textColor: "text-slate-400",
          border: "border-slate-500/30"
        };
    }
  };

  const safety = getSafetyConfig(current.safetyRating);

  // Analyze wind-to-swell relationship (offshore / onshore)
  const getWindAlignment = () => {
    const diff = Math.abs(current.swellDirDegrees - current.windDirDegrees);
    // Ideal offshore occurs when wind is blowing opposite to swell (around 180 degrees diff)
    if (diff > 140 && diff < 220) {
      return { label: "Offshore (Ideal)", color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" };
    } else if (diff < 40 || diff > 320) {
      return { label: "Onshore (Choppy)", color: "text-rose-400 bg-rose-500/5 border-rose-500/20" };
    } else {
      return { label: "Cross-shore", color: "text-slate-400 bg-slate-500/5 border-slate-500/20" };
    }
  };

  const windAlign = getWindAlignment();

  return (
    <div className="space-y-5">
      {/* Safety Alert Panel (if any critical danger, or just the main status) */}
      <div className={`p-4 rounded-xl border ${safety.border} ${safety.bgColor} flex items-start gap-3 shadow-lg`}>
        <div className="mt-0.5">{safety.icon}</div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider font-display">
            Marine Safety Advisory: {current.safetyRating}
          </h3>
          <p className="text-xs mt-1 leading-relaxed opacity-90">
            {current.safetyReason}
          </p>
        </div>
      </div>

      {/* Environmental active alert tickets */}
      {environmentalAlerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {environmentalAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              id={`alert-ticket-${idx}`}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                alert.level.toLowerCase() === "danger" 
                  ? "bg-rose-500/5 border-rose-500/20" 
                  : alert.level.toLowerCase() === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-blue-500/5 border-blue-500/20"
              }`}
            >
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                alert.level.toLowerCase() === "danger" 
                  ? "text-rose-400" 
                  : alert.level.toLowerCase() === "warning"
                    ? "text-amber-400"
                    : "text-cyan-400"
              }`} />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">{alert.title}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Core metrics grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Swell & Wave Power */}
        <div className="rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Surf & Swell</span>
              <h4 className="text-2xl font-bold font-display text-white mt-1">
                {current.waveHeight.toFixed(1)} - {current.waveHeightMax.toFixed(0)} ft
              </h4>
            </div>
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Waves className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Swell Period:</span>
              <strong className="text-slate-200">{current.swellPeriod}s</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Swell Direction:</span>
              <strong className="text-cyan-400">{current.swellDirection} ({current.swellDirDegrees}°)</strong>
            </div>
            <div className="flex justify-between text-slate-400 items-center">
              <span>Interval Class:</span>
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                current.swellPeriod >= 12 
                  ? "bg-emerald-500/15 text-emerald-400" 
                  : "bg-slate-800 text-slate-400"
              }`}>
                {current.swellPeriod >= 12 ? "Groundswell" : "Windswell"}
              </span>
            </div>
          </div>
        </div>

        {/* Wind & Speed */}
        <div className="rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Wind Conditions</span>
              <h4 className="text-2xl font-bold font-display text-white mt-1">
                {current.windSpeed.toFixed(0)} kts
              </h4>
            </div>
            <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Gust Speed:</span>
              <strong className="text-slate-200">{current.windGust} kts</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Wind Angle:</span>
              <strong className="text-orange-400">{current.windDirection} ({current.windDirDegrees}°)</strong>
            </div>
            <div className="flex justify-between text-slate-400 items-center">
              <span>Alignment:</span>
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border border-transparent ${windAlign.color}`}>
                {windAlign.label}
              </span>
            </div>
          </div>
        </div>

        {/* Sea Temperature & Air */}
        <div className="rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Sea Temperature</span>
              <h4 className="text-2xl font-bold font-display text-white mt-1">
                {current.tempWater}°F
              </h4>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Air Temperature:</span>
              <strong className="text-slate-200">{current.tempAir}°F</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Water Quality:</span>
              <strong className={`font-bold ${
                current.waterQuality.toLowerCase() === "good" ? "text-emerald-400" : "text-amber-400"
              }`}>{current.waterQuality}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>UV Radiation Index:</span>
              <strong className="text-slate-200">{current.uvIndex} (V. High)</strong>
            </div>
          </div>
        </div>

        {/* Weather & Tide height */}
        <div className="rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Sea State</span>
              <h4 className="text-sm font-semibold text-slate-200 truncate mt-1.5 font-display max-w-[130px]">
                {current.weatherDesc}
              </h4>
            </div>
            <div className="p-1.5 bg-slate-800 rounded-xl border border-slate-700/50">
              {getWeatherIcon(current.weatherIcon)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Current Tide stage:</span>
              <strong className="text-cyan-400">{current.tideState}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Relative Tide height:</span>
              <strong className="text-slate-200">{current.tideHeight.toFixed(1)} ft</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rip Current Danger:</span>
              <span className={`px-1 text-[10px] font-bold rounded ${
                current.ripCurrentRisk.toLowerCase() === "high" 
                  ? "bg-rose-500/20 text-rose-400" 
                  : current.ripCurrentRisk.toLowerCase() === "moderate"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
              }`}>{current.ripCurrentRisk} Risk</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid of vector visualization compass and marine biology card */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Vector Alignment Compass */}
        <div className="lg:col-span-1">
          <SwellCompass 
            swellDegrees={current.swellDirDegrees} 
            swellDirection={current.swellDirection} 
            windDegrees={current.windDirDegrees} 
            windDirection={current.windDirection} 
          />
        </div>

        {/* Marine Biology Card */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white font-display">Marine Ecosystem Forecast</h3>
              </div>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full font-mono border ${
                marineLifePrediction.activityLevel.toLowerCase() === "high" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {marineLifePrediction.activityLevel} Activity
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Coastal species migrations, water visibility coefficients, and high feeding tides indicators:
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Notable Species Active Today</div>
                <div className="flex flex-wrap gap-2">
                  {marineLifePrediction.notableSpecies.map((species, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 hover:border-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {species}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-900/40 border border-slate-850 p-3 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Best Viewing & Exploration Window</div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{marineLifePrediction.bestViewingTimes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic mt-4 border-t border-slate-800/80 pt-3">
            Ocean biological predictions are calculated on tide changes, sunlight filters, and regional migratory cycles. Do not touch or disturb active species.
          </div>
        </div>
      </div>
    </div>
  );
};
