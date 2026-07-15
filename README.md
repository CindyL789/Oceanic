# OceanPulse 🌊

OceanPulse is an advanced full-stack marine intelligence dashboard featuring real-time simulated marine weather, swell and tide tracking, wave trends, and a specialized AI chat assistant powered by Gemini.

---

## 🚀 Local Development Setup

To run this application locally, follow these steps:

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### 3. Run dev server
```bash
npm run dev
```

### 4. Open http://localhost:3000
Once the dev server is active, open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠 Features

- **Tide Chart**: Interactive tide elevation tracker with current phase status.
- **Wave Trend Chart**: Historical and current wave heights paired with wave period trends.
- **Swell Compass**: Vector direction visualizer for wind and swells.
- **Ocean Pulse Simulator**: Adjustable slider dashboard controlling wind, wave, and current parameters.
- **Oceanic AI Chat**: Direct integration with Gemini API to consult with marine biologists and weather models.
- **Full-Stack Node/Express + Vite Integration**: High-performance, low-latency API proxy server for secure backend calls.
