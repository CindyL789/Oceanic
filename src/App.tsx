import React, { useState, useEffect } from "react";
import { 
  Waves, 
  Search, 
  MapPin, 
  Compass, 
  AlertCircle, 
  Loader2, 
  Anchor, 
  Navigation,
  Globe,
  Sparkles,
  RefreshCw,
  Eye,
  Activity
} from "lucide-react";
import { MarineForecast } from "./types";
import { MarineDashboard } from "./components/MarineDashboard";
import { TideChart } from "./components/TideChart";
import { WaveTrendChart } from "./components/WaveTrendChart";
import { PlannerLogbook } from "./components/PlannerLogbook";
import { OceanicChat } from "./components/OceanicChat";
import { OceanPulseSimulator } from "./components/OceanPulseSimulator";
import { motion, AnimatePresence } from "motion/react";

const FAVORITE_SPOTS = [
  { name: "Mavericks Beach, California", label: "Mavericks", icon: "🦈" },
  { name: "Malibu Lagoon State Beach, California", label: "Malibu", icon: "🏄" },
  { name: "Steamer Lane, Santa Cruz, California", label: "Santa Cruz", icon: "🌲" },
  { name: "Huntington Beach, California", label: "Huntington", icon: "🎡" },
  { name: "Rincon Point, Santa Barbara, California", label: "Rincon", icon: "🐚" },
  { name: "North Shore, Oahu, Hawaii", label: "Pipeline", icon: "🌴" },
  { name: "Bondi Beach, Sydney, Australia", label: "Bondi", icon: "🦘" }
];

const LOADING_MESSAGES = [
  "Deploying regional bathymetric swell models...",
  "Retrieving tidal reference cycles from NOAA...",
  "Correlating offshore wind alignment vectors...",
  "Simulating coastal rip current coefficients...",
  "Mapping marine biology & migratory patterns...",
  "Synthesizing aquatic recreation safety indices..."
];

export default function App() {
  const [viewMode, setViewMode] = useState<"telemetry" | "submersible">("submersible");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("Mavericks Beach, California");
  const [forecast, setForecast] = useState<MarineForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  // Rotate loading messages when fetching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load initial forecast
  useEffect(() => {
    handleLoadForecast(activeLocation);
  }, [activeLocation]);

  const handleLoadForecast = async (locationName: string) => {
    setLoading(true);
    setError(null);
    setLoadingMessageIdx(0);

    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: locationName }),
      });

      if (!res.ok) {
        throw new Error("The marine simulator encountered a deep swell. Please try another location.");
      }

      const data = await res.json();
      setForecast(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to retrieve marine forecasting charts.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveLocation(searchQuery);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 ocean-gradient font-sans selection:bg-cyan-500/30 selection:text-white flex flex-col">
      
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl text-slate-950 shadow-lg shadow-cyan-500/10">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                <span>OceanPulse</span>
                <span className="text-[10px] uppercase font-mono font-extrabold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">v2.5</span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Coastal Intelligence & AI Analytics</p>
            </div>
          </div>

          {/* Quick-select Spot Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {FAVORITE_SPOTS.map((spot, idx) => (
              <button
                key={idx}
                id={`btn-spot-${spot.label.toLowerCase()}`}
                onClick={() => {
                  setSearchQuery("");
                  setActiveLocation(spot.name);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeLocation === spot.name
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-md"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <span>{spot.icon}</span>
                <span>{spot.label}</span>
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        
        {/* Modern Segmented Navigation Bar */}
        <div className="flex bg-slate-950/80 p-1 border border-slate-800 rounded-2xl max-w-md">
          <button
            onClick={() => setViewMode("submersible")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              viewMode === "submersible"
                ? "bg-cyan-500/10 text-cyan-300 shadow-sm border border-cyan-500/25"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Eye className="w-3.5 h-3.5 animate-pulse" />
            <span>3D Observation Sub</span>
          </button>
          <button
            onClick={() => setViewMode("telemetry")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              viewMode === "telemetry"
                ? "bg-cyan-500/10 text-cyan-300 shadow-sm border border-cyan-500/25"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry Dashboard</span>
          </button>
        </div>

        {viewMode === "submersible" ? (
          <OceanPulseSimulator />
        ) : (
          <>
            {/* Search and Alert Banner */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm">
              
              {/* Active coordinates info */}
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400 flex-shrink-0">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Active Coastline</div>
                  <h2 className="text-sm font-bold text-white truncate font-display">
                    {forecast ? forecast.locationName : activeLocation}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    {forecast ? `COORD: ${forecast.coordinates}` : "Querying satellite grid..."}
                  </p>
                </div>
              </div>

              {/* Location Search Input */}
              <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-96 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any custom beach, harbor, or bay..."
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700/60 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-24 text-xs text-white focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  id="btn-search-submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold rounded-lg transition-colors"
                >
                  Consult API
                </button>
              </form>

            </div>

            {/* Dynamic Display Area */}
            <div className="flex-1 relative min-h-[400px]">
              <AnimatePresence mode="wait">
                
                {/* 1. Loading State */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-3xl backdrop-blur-sm z-40"
                  >
                    <div className="relative mb-6">
                      {/* Rotating nautical ring */}
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-500/20 animate-spin-slow" />
                      <div className="absolute inset-2 rounded-full border-2 border-cyan-400 animate-pulse flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                      </div>
                    </div>
                    
                    <h3 className="text-base font-bold font-display text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>Synthesizing Marine Weather Core</span>
                    </h3>
                    
                    <p className="text-xs text-slate-400 font-mono mt-2 animate-pulse max-w-sm">
                      {LOADING_MESSAGES[loadingMessageIdx]}
                    </p>
                  </motion.div>
                )}

                {/* 2. Error State */}
                {error && !loading && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border border-rose-500/10 bg-rose-500/5 rounded-3xl"
                  >
                    <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
                    <h3 className="text-base font-bold font-display text-rose-400">Deep Ocean Surge Encountered</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                      {error}
                    </p>
                    <div className="flex gap-3.5 mt-5">
                      <button
                        onClick={() => handleLoadForecast(activeLocation)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/20 transition-all font-mono"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Last Signal</span>
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setActiveLocation("Mavericks Beach, California");
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                      >
                        Default Spot
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3. Main Dashboard Layout (Success) */}
                {forecast && !loading && !error && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                  >
                    {/* Column 1: Core weather metrics, ocean planners, tide grids (Left 2/3rds) */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Bento Grid Current Conditions */}
                      <MarineDashboard forecast={forecast} />

                      {/* Tide & Swell Graphs Grid */}
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <TideChart 
                          tideForecast={forecast.tideForecast} 
                          tideHeight={forecast.current.tideHeight} 
                          tideState={forecast.current.tideState} 
                        />
                        <WaveTrendChart waveForecast={forecast.waveForecast} />
                      </div>

                      {/* Coastal Activity Planner & Personal Logbook */}
                      <PlannerLogbook forecast={forecast} />

                    </div>

                    {/* Column 2: Oceanic AI chat panel (Right 1/3rd) */}
                    <div className="lg:col-span-1 lg:sticky lg:top-20">
                      <OceanicChat forecast={forecast} />
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </>
        )}

      </main>

      {/* Footer credits */}
      <footer className="border-t border-slate-900/80 bg-slate-950/40 py-5 text-center text-[11px] font-mono text-slate-500 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            &copy; 2026 OceanPulse Intelligence Node. All rights simulated.
          </div>
          <div className="flex justify-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Global Marine Grid</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Grounded Core</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
