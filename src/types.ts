export interface CurrentConditions {
  tempWater: number;
  tempAir: number;
  weatherDesc: string;
  weatherIcon: string;
  waveHeight: number;
  waveHeightMax: number;
  swellDirection: string;
  swellDirDegrees: number;
  swellPeriod: number;
  windSpeed: number;
  windDirection: string;
  windDirDegrees: number;
  windGust: number;
  tideState: string;
  tideHeight: number;
  uvIndex: number;
  ripCurrentRisk: string; // 'Low' | 'Moderate' | 'High'
  waterQuality: string; // 'Good' | 'Fair' | 'Poor'
  safetyRating: string; // 'Safe' | 'Caution' | 'Dangerous'
  safetyReason: string;
}

export interface TideEvent {
  time: string;
  height: number;
  label: string; // '', 'High Tide', 'Low Tide'
}

export interface WaveForecastPoint {
  day: string;
  time: string;
  waveHeight: number;
  swellPeriod: number;
  windSpeed: number;
}

export interface ActivityRecommendation {
  activity: string; // 'Surf' | 'Diving' | 'Open-water Swim' | 'Sailing' | 'Beachcombing'
  score: number; // 0-100
  text: string;
  status: string; // 'Ideal' | 'Good' | 'Caution' | 'Poor'
}

export interface EnvironmentalAlert {
  level: string; // 'Info' | 'Warning' | 'Danger'
  title: string;
  message: string;
}

export interface MarineLifePrediction {
  activityLevel: string;
  notableSpecies: string[];
  bestViewingTimes: string;
}

export interface MarineForecast {
  locationName: string;
  coordinates: string;
  current: CurrentConditions;
  tideForecast: TideEvent[];
  waveForecast: WaveForecastPoint[];
  recommendations: ActivityRecommendation[];
  environmentalAlerts: EnvironmentalAlert[];
  marineLifePrediction: MarineLifePrediction;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface LogbookEntry {
  id: string;
  date: string;
  location: string;
  activity: string;
  waveHeight: number;
  waterTemp: number;
  rating: number; // 1-5
  notes: string;
}
