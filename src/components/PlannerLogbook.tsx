import React, { useState, useEffect } from "react";
import { ActivityRecommendation, LogbookEntry, MarineForecast } from "../types";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Star, 
  Calendar, 
  MapPin, 
  BookOpen, 
  Compass, 
  Trash2, 
  Plus, 
  Waves, 
  Eye, 
  Anchor, 
  Sparkles,
  Thermometer,
  Grid
} from "lucide-react";

interface PlannerLogbookProps {
  forecast: MarineForecast;
}

export const PlannerLogbook: React.FC<PlannerLogbookProps> = ({ forecast }) => {
  const [activeTab, setActiveTab] = useState<"planner" | "logbook">("planner");
  
  // Logbook entries state
  const [logs, setLogs] = useState<LogbookEntry[]>([]);
  
  // Log form state
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState(forecast.locationName);
  const [activity, setActivity] = useState("Surf");
  const [waveHeight, setWaveHeight] = useState(forecast.current.waveHeight);
  const [waterTemp, setWaterTemp] = useState(forecast.current.tempWater);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");

  // Sync location defaults when forecast changes
  useEffect(() => {
    setLocation(forecast.locationName);
    setWaveHeight(forecast.current.waveHeight);
    setWaterTemp(forecast.current.tempWater);
  }, [forecast]);

  // Load logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem("oceanpulse_logs");
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error parsing logbook entries", e);
      }
    }
  }, []);

  // Save log entry
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: LogbookEntry = {
      id: crypto.randomUUID(),
      date,
      location,
      activity,
      waveHeight: Number(waveHeight),
      waterTemp: Number(waterTemp),
      rating,
      notes,
    };

    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem("oceanpulse_logs", JSON.stringify(updatedLogs));
    
    // Reset form
    setNotes("");
    setShowForm(false);
  };

  // Delete log entry
  const handleDeleteLog = (id: string) => {
    const updatedLogs = logs.filter((log) => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem("oceanpulse_logs", JSON.stringify(updatedLogs));
  };

  // Helper icons for activity
  const getActivityIcon = (act: string) => {
    switch (act.toLowerCase()) {
      case "surf":
      case "surfing":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "diving":
      case "snorkeling":
      case "scuba":
        return <Eye className="w-5 h-5 text-emerald-400" />;
      case "sailing":
      case "boating":
        return <Anchor className="w-5 h-5 text-indigo-400" />;
      case "swim":
      case "open-water swim":
      case "swimming":
        return <Compass className="w-5 h-5 text-blue-400" />;
      default:
        return <Grid className="w-5 h-5 text-slate-400" />;
    }
  };

  // Helper colors for activity ratings
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ideal":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "good":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
      case "caution":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "poor":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel p-5">
      {/* Tab Switchers */}
      <div className="flex border-b border-slate-800 pb-3 mb-4 gap-6">
        <button
          id="btn-tab-planner"
          onClick={() => setActiveTab("planner")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === "planner" 
              ? "text-cyan-400 border-b-2 border-cyan-500" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Coastal Activity Planner</span>
        </button>
        <button
          id="btn-tab-logbook"
          onClick={() => setActiveTab("logbook")}
          className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative ${
            activeTab === "logbook" 
              ? "text-cyan-400 border-b-2 border-cyan-500" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Marine Journal & Logs</span>
          {logs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded-full">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === "planner" ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl">
              <p className="text-xs text-slate-400 leading-relaxed">
                Our AI engine synthesizes real-time tide schedules, wind speed & direction alignment (offshore/onshore ratio), water temperatures, and swell intervals to score recreation indices.
              </p>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {forecast.recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  id={`rec-item-${rec.activity.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-800/70 rounded-lg">
                        {getActivityIcon(rec.activity)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-display">{rec.activity}</h4>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(rec.status)}`}>
                          {rec.status}
                        </span>
                      </div>
                    </div>

                    {/* Circular score display */}
                    <div className="relative w-11 h-11 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke={rec.score >= 80 ? "#10b981" : rec.score >= 60 ? "#06b6d4" : rec.score >= 40 ? "#f59e0b" : "#f43f5e"} 
                          strokeWidth="3" 
                          strokeDasharray={`${rec.score}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-[11px] font-mono font-bold text-white">
                        {rec.score}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mt-1 flex-1">
                    {rec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* LOGBOOK TAB */
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Logbook</h3>
              {!showForm && (
                <button
                  id="btn-log-session"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors rounded-lg shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Session</span>
                </button>
              )}
            </div>

            {/* Session logger form */}
            {showForm && (
              <form 
                onSubmit={handleAddLog} 
                className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3.5"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>New Session Entry</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700/60 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Location</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700/60 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Activity</label>
                    <select 
                      value={activity} 
                      onChange={(e) => setActivity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option>Surf</option>
                      <option>Diving</option>
                      <option>Open-water Swim</option>
                      <option>Sailing</option>
                      <option>Beachcombing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Waves (ft)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={waveHeight} 
                      onChange={(e) => setWaveHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Water Temp (°F)</label>
                    <input 
                      type="number" 
                      value={waterTemp} 
                      onChange={(e) => setWaterTemp(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700/60 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-1.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star className={`w-5 h-5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-mono">Journal Notes</label>
                  <textarea 
                    rows={2.5}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe wave shapes, marine life spotted, current drifts, crowds, or marine gear performance..."
                    required
                    className="w-full bg-slate-900 border border-slate-700/60 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-submit-log"
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-lg font-display"
                >
                  Save Log Entry
                </button>
              </form>
            )}

            {/* List of sessions */}
            <div className="space-y-3.5">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                  <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">Your marine logbook is empty</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Log your surfing, diving, or boating sessions to keep track of ideal tides, personal stats, and memorable conditions.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    id={`log-entry-${log.id}`}
                    className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/30 transition-all flex flex-col gap-2 relative group"
                  >
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded text-[10px] font-bold text-slate-200">
                        {getActivityIcon(log.activity)}
                        <span>{log.activity}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= log.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-1 italic">
                      "{log.notes}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-1 border-t border-slate-850 pt-2 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-[150px]">{log.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Waves className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{log.waveHeight} ft waves</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{log.waterTemp}°F Water</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
