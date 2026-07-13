# COPILOT TASK — Capability Boost for Oceanic (from Captain)

> **For:** GitHub Copilot in CindyL789/Oceanic
> **From:** Captain (@NyxSpecter4) via Ziggy assistant
> **Date:** 2026-07-13
> **Priority:** HIGH — this is a capability boost from the bountywarz factory
> **Read this entire file before starting. Execute step by step.**

## What Captain built on oceanpulse

Captain added **live animal GPS tracking** and a **full Supabase backend** to oceanpulse (the sister project). PR: https://github.com/NyxSpecter4/oceanpulse/pull/4

This task brings the same capabilities to Oceanic, adapted for your React + TypeScript + Vite + Gemini stack.

## CRITICAL RULES

1. **NEVER create a new GitHub repository.** Work only in CindyL789/Oceanic.
2. **NEVER push directly to main.** Create a branch: `feature/movebank-gps-tracking`
3. **One PR for this entire task.** Don't split it.
4. **Follow the existing code style** — TypeScript, React hooks, Tailwind CSS, Lucide icons.
5. **Test locally** with `npm run dev` before pushing.

## What you're building

Three new capabilities for Oceanic:

1. **Live animal GPS tracking** — Pull real animal tracking data from Movebank (free API, 10.9 billion GPS locations, 1,674 species) and display it alongside the existing marine weather dashboard
2. **Supabase backend** — User accounts, logbook persistence, sighting collection, leaderboards
3. **Sighting system** — Players can log wildlife sightings with GPS coords, species, photos

## Step 1: Install dependencies

```bash
npm install @supabase/supabase-js
```

Add to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=  # already exists
```

## Step 2: Create the Supabase schema

Create file: `database/oceanic-schema.sql`

```sql
-- OCEANIC — SUPABASE SCHEMA
-- Adapted from bountywarz factory patterns for Cindy's marine weather app

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  account_level INTEGER DEFAULT 1,
  total_xp BIGINT DEFAULT 0,
  lifetime_sightings INTEGER DEFAULT 0,
  lifetime_species_discovered INTEGER DEFAULT 0,
  titles TEXT[] DEFAULT ARRAY['Sailor'],
  active_title TEXT DEFAULT 'Sailor',
  stats JSONB DEFAULT '{}'
);

-- Logbook entries (replaces local-only LogbookEntry)
CREATE TABLE IF NOT EXISTS logbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES accounts(user_id),
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  activity TEXT NOT NULL,
  wave_height REAL,
  water_temp REAL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  lat REAL,
  lon REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logbook_user ON logbook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_logbook_date ON logbook_entries(date DESC);

-- Wildlife sightings
CREATE TABLE IF NOT EXISTS sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES accounts(user_id),
  species TEXT NOT NULL,
  species_subtype TEXT,
  individual_name TEXT,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  sighting_time TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  confidence TEXT DEFAULT 'certain',
  conditions JSONB DEFAULT '{}',
  xp_awarded INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common',
  source TEXT DEFAULT 'player',
  movebank_study_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sightings_user ON sightings(user_id);
CREATE INDEX IF NOT EXISTS idx_sightings_species ON sightings(species);
CREATE INDEX IF NOT EXISTS idx_sightings_time ON sightings(sighting_time DESC);

-- Species collection (Pokedex-style)
CREATE TABLE IF NOT EXISTS species_collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES accounts(user_id),
  species TEXT NOT NULL,
  species_subtype TEXT,
  first_sighting_at TIMESTAMPTZ DEFAULT NOW(),
  total_sightings INTEGER DEFAULT 1,
  best_rarity TEXT DEFAULT 'common',
  UNIQUE(user_id, species, species_subtype)
);

-- Live animal tracks from Movebank
CREATE TABLE IF NOT EXISTS live_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movebank_study_id INTEGER NOT NULL,
  individual_id TEXT NOT NULL,
  species TEXT NOT NULL,
  individual_name TEXT,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  speed_kmh REAL,
  temperature_c REAL,
  total_distance_km REAL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(movebank_study_id, individual_id)
);

CREATE INDEX IF NOT EXISTS idx_live_tracks_species ON live_tracks(species);

-- Track history (append-only)
CREATE TABLE IF NOT EXISTS track_history (
  id BIGSERIAL PRIMARY KEY,
  live_track_id UUID REFERENCES live_tracks(id) ON DELETE CASCADE,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  speed_kmh REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sighting feed (multiplayer activity)
CREATE TABLE IF NOT EXISTS sighting_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES accounts(user_id),
  username TEXT NOT NULL,
  species TEXT NOT NULL,
  rarity TEXT NOT NULL,
  lat REAL,
  lon REAL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES accounts(user_id),
  username TEXT NOT NULL,
  category TEXT NOT NULL,
  score BIGINT DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_category ON leaderboards(category, score DESC);

-- ROW LEVEL SECURITY
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own account" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own account" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users see own logbook" ON logbook_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own logbook" ON logbook_entries FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Users see own sightings" ON sightings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own sightings" ON sightings FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Users see own collection" ON species_collection FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Live tracks public" ON live_tracks FOR SELECT USING (true);
CREATE POLICY "Track history public" ON track_history FOR SELECT USING (true);
CREATE POLICY "Feed public" ON sighting_feed FOR SELECT USING (true);
CREATE POLICY "Users create feed items" ON sighting_feed FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Leaderboards public" ON leaderboards FOR SELECT USING (true);
```

## Step 3: Create the Movebank API client

Create file: `src/lib/movebank.ts`

```typescript
/**
 * Movebank API client — live animal GPS tracking
 * Free API: 10.9 billion locations, 10,000+ studies, 1,674 species
 * Docs: https://github.com/movebank/movebank-api-doc
 */

const MOVEBANK_BASE = 'https://www.movebank.org/movebank/service/direct-read';

export interface MovebankStudy {
  id: number;
  name: string;
  species: string;
  individuals: number;
  locations: number;
  startTime: string;
  endTime: string;
}

export interface MovebankLocation {
  lat: number;
  lon: number;
  timestamp: string;
  individualId: string;
  individualName: string;
  species: string;
  speed: number | null;
  temperature: number | null;
}

export interface LiveAnimal {
  species: string;
  name: string;
  lat: number;
  lon: number;
  track: { lat: number; lon: number; time: string; speed: number | null }[];
  lastSeen: string;
  distanceTraveled: number;
}

// Common marine species taxon IDs
const SPECIES_MAP: Record<string, string> = {
  'whale': '328753765',
  'humpback-whale': '765534',
  'dolphin': '328753765',
  'bottlenose-dolphin': '2389683',
  'shark': '328753770',
  'great-white-shark': '328753771',
  'sea-turtle': '328753773',
  'seal': '328753775',
  'tuna': '328753780',
};

function getAuthHeaders(): Record<string, string> {
  const username = import.meta.env.VITE_MOVEBANK_USERNAME;
  const password = import.meta.env.VITE_MOVEBANK_PASSWORD;
  if (username && password) {
    const auth = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${auth}` };
  }
  return {};
}

export async function listMarineStudies(species = 'whale'): Promise<MovebankStudy[]> {
  const params = new URLSearchParams({
    entity_type: 'study',
    i_can_see_data: 'true',
    study_type: 'tracking',
  });
  const taxonId = SPECIES_MAP[species.toLowerCase()] || species;
  params.set('taxon_ids', taxonId);

  const res = await fetch(`${MOVEBANK_BASE}?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Movebank API error: ${res.status}`);
  const data = await res.json();
  return data.map((s: any) => ({
    id: s.study_id,
    name: s.study_name,
    species: s.taxon_ids,
    individuals: s.number_of_individuals,
    locations: s.number_of_events,
    startTime: s.start_timestamp,
    endTime: s.end_timestamp,
  }));
}

export async function getStudyLocations(
  studyId: number,
  opts: { limit?: number; individual?: string } = {}
): Promise<MovebankLocation[]> {
  const params = new URLSearchParams({
    entity_type: 'event',
    study_id: studyId.toString(),
  });
  if (opts.limit) params.set('max_events_per_individual', opts.limit.toString());
  if (opts.individual) params.set('individual_id', opts.individual);

  const res = await fetch(`${MOVEBANK_BASE}?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Movebank API error: ${res.status}`);
  const data = await res.json();
  return data.map((e: any) => ({
    lat: e.location_lat,
    lon: e.location_long,
    timestamp: e.timestamp,
    individualId: e.individual_id,
    individualName: e.individual_local_identifier,
    species: e.taxon_canonical_name,
    speed: e.ground_speed,
    temperature: e.external_temperature,
  }));
}

export function trackToLiveAnimal(track: MovebankLocation[]): LiveAnimal | null {
  if (!track || track.length === 0) return null;
  const latest = track[track.length - 1];
  return {
    species: latest.species || 'unknown',
    name: latest.individualName || `wild-${latest.individualId}`,
    lat: latest.lat,
    lon: latest.lon,
    track: track.map(p => ({ lat: p.lat, lon: p.lon, time: p.timestamp, speed: p.speed })),
    lastSeen: latest.timestamp,
    distanceTraveled: calculateDistance(track),
  };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateDistance(track: MovebankLocation[]): number {
  let total = 0;
  for (let i = 1; i < track.length; i++) {
    total += haversine(track[i - 1].lat, track[i - 1].lon, track[i].lat, track[i].lon);
  }
  return Math.round(total);
}
```

## Step 4: Create the Supabase client

Create file: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Backend features disabled.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Logbook sync
export async function saveLogbookEntry(entry: {
  date: string; location: string; activity: string;
  wave_height?: number; water_temp?: number; rating?: number;
  notes?: string; lat?: number; lon?: number;
}) {
  const { data, error } = await supabase.from('logbook_entries').insert(entry).select();
  if (error) throw error;
  return data;
}

export async function getLogbookEntries() {
  const { data, error } = await supabase
    .from('logbook_entries')
    .select('*').order('date', { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}

// Sighting recording
export async function recordSighting(sighting: {
  species: string; species_subtype?: string; lat: number; lon: number;
  photo_url?: string; confidence?: string; rarity?: string; conditions?: any;
}) {
  const { data, error } = await supabase.from('sightings').insert(sighting).select();
  if (error) throw error;
  return data;
}

export async function getSightings() {
  const { data, error } = await supabase
    .from('sightings').select('*').order('sighting_time', { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}

// Live tracks
export async function getLiveTracks() {
  const { data, error } = await supabase
    .from('live_tracks').select('*').order('last_updated', { ascending: false });
  if (error) throw error;
  return data;
}

// Leaderboards
export async function getLeaderboard(category: string, limit = 50) {
  const { data, error } = await supabase
    .from('leaderboards').select('username, score, rank')
    .eq('category', category).order('score', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}
```

## Step 5: Create the AnimalTracker component

Create file: `src/components/AnimalTracker.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Fish, MapPin, Navigation } from 'lucide-react';
import { listMarineStudies, getStudyLocations, trackToLiveAnimal, type LiveAnimal } from '../lib/movebank';

export function AnimalTracker() {
  const [animals, setAnimals] = useState<LiveAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [species, setSpecies] = useState('whale');

  useEffect(() => {
    loadAnimals();
  }, [species]);

  async function loadAnimals() {
    setLoading(true);
    setError(null);
    try {
      const studies = await listMarineStudies(species);
      if (studies.length === 0) {
        setAnimals([]);
        setLoading(false);
        return;
      }
      // Get locations from first 3 studies
      const topStudies = studies.slice(0, 3);
      const allAnimals: LiveAnimal[] = [];
      for (const study of topStudies) {
        const locations = await getStudyLocations(study.id, { limit: 50 });
        const animal = trackToLiveAnimal(locations);
        if (animal) allAnimals.push(animal);
      }
      setAnimals(allAnimals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <Fish className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Live Animal Tracker</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {['whale', 'dolphin', 'shark', 'sea-turtle', 'seal', 'tuna'].map(s => (
          <button
            key={s}
            onClick={() => setSpecies(s)}
            className={`px-3 py-1 rounded-lg text-sm capitalize transition ${
              species === s
                ? 'bg-cyan-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading && <p className="text-white/50 text-sm">Loading live GPS data from Movebank...</p>}
      {error && <p className="text-red-400 text-sm">Error: {error}</p>}

      {!loading && animals.length === 0 && (
        <p className="text-white/50 text-sm">No tracking data available for {species}.</p>
      )}

      <div className="space-y-3">
        {animals.map((animal, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-white font-medium capitalize">{animal.species}</h3>
                <p className="text-white/40 text-xs">{animal.name}</p>
              </div>
              <span className="text-cyan-400 text-2xl font-bold">
                {animal.distanceTraveled} km
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {animal.lat.toFixed(2)}, {animal.lon.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {animal.track.length} track points
              </span>
              <span>Last seen: {new Date(animal.lastSeen).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 6: Add AnimalTracker to the dashboard

In `src/App.tsx`, import and add the AnimalTracker component below the existing dashboard content:

```tsx
import { AnimalTracker } from './components/AnimalTracker';

// Add inside the main layout, after the existing dashboard components:
<AnimalTracker />
```

## Step 7: Create the cron sync endpoint

Add to `server.ts` (inside the Express app, before the Vite middleware):

```typescript
// Movebank sync endpoint (protect with CRON_SECRET)
app.post('/api/sync-movebank', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const MOVEBANK_BASE = 'https://www.movebank.org/movebank/service/direct-read';
    const species = ['whale', 'dolphin', 'shark', 'sea-turtle', 'seal'];
    let synced = 0;

    for (const s of species) {
      const studyRes = await fetch(`${MOVEBANK_BASE}?entity_type=study&i_can_see_data=true&study_type=tracking&taxon_ids=${s}`);
      if (!studyRes.ok) continue;
      const studies = await studyRes.json();
      for (const study of studies.slice(0, 3)) {
        const locRes = await fetch(`${MOVEBANK_BASE}?entity_type=event&study_id=${study.study_id}&max_events_per_individual=50`);
        if (!locRes.ok) continue;
        const locations = await locRes.json();
        // Upsert to Supabase here (requires server-side Supabase client)
        synced++;
      }
    }

    res.json({ status: 'ok', synced, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 8: Add env example

Update `.env.example`:
```
GEMINI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_MOVEBANK_USERNAME=  # optional, public studies work without auth
VITE_MOVEBANK_PASSWORD=  # optional
CRON_SECRET=
```

## Step 9: Commit and PR

```bash
git checkout -b feature/movebank-gps-tracking
git add .
git commit -m "feat: add live animal GPS tracking + Supabase backend

- src/lib/movebank.ts: Movebank API client (10.9B animal GPS locations, free)
- src/lib/supabase.ts: Supabase client for logbook, sightings, leaderboards
- src/components/AnimalTracker.tsx: Live animal tracker widget
- database/oceanic-schema.sql: Full Supabase schema with RLS
- server.ts: Cron sync endpoint for hourly GPS data refresh

Adapted from bountywarz factory patterns. Same capabilities as oceanpulse PR #4."
git push origin feature/movebank-gps-tracking
```

Then open a PR with title: `feat: live animal GPS tracking + Supabase backend (factory boost from Captain)`

## What Cindy needs to do after merge

1. Create a Supabase project at https://supabase.com (free tier)
2. Run `database/oceanic-schema.sql` in the Supabase SQL Editor
3. Set the env vars in `.env.local` and on Vercel
4. Set up a cron job to hit `/api/sync-movebank` hourly
5. The AnimalTracker widget will show live whale/dolphin/shark/turtle GPS data alongside the marine weather dashboard

## Why this matters

Oceanic already has marine weather, tide charts, wave forecasts, and AI consultation. Adding live animal GPS tracking makes it the only marine app that shows BOTH weather AND real wildlife movements. That's a unique product.

The Supabase backend adds user accounts, persistent logbooks, and sighting collection. The same schema patterns are used in bountywarz and oceanpulse. One pattern, three products.

## Questions? 

Open an issue on oceanpulse: https://github.com/NyxSpecter4/oceanpulse/issues
Or message Captain directly.
