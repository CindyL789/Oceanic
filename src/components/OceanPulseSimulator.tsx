import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OceanPulseEngine } from "../engine/three-adaptor";
import { MarineAnimal } from "../wildlife/animal";
import {
  SightingCardInstance,
  generateSightingCard,
  PlayerCollection,
  SightingCardPack
} from "../cards/sighting-card";
import { MarineBiologistCompanion, DialogueNode } from "../athelgard/marine-biologist";
import sanctuariesData from "../data/sanctuaries.json";
import {
  Anchor,
  Compass,
  Gauge,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  Eye,
  Trash2,
  PackageOpen,
  MapPin,
  FlameKindling,
  User,
  Heart,
  Globe2
} from "lucide-react";

export const OceanPulseSimulator: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<OceanPulseEngine | null>(null);
  const biologistRef = useRef<MarineBiologistCompanion>(new MarineBiologistCompanion());

  // Sanctuary Selection
  const [activeSanctuaryIdx, setActiveSanctuaryIdx] = useState(0);
  const activeSanctuary = sanctuariesData[activeSanctuaryIdx];

  // Dive Depth
  const [depth, setDepth] = useState(30); // initial 30m

  // Scanning HUD & Game States
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [lastScannedCard, setLastScannedCard] = useState<SightingCardInstance | null>(null);
  const [biologistDialogue, setBiologistDialogue] = useState<DialogueNode>({
    speaker: "Athelgard (Biologist)",
    text: "Welcome to the research submersible! Click on any marine animal swimming in the viewport to scan its genetics, or unwrap card packs to grow our marine collection.",
    mood: "cheerful"
  });

  // Card Pack Reveal System
  const [unboxedCards, setUnboxedCards] = useState<SightingCardInstance[] | null>(null);
  const [revealedCardIdx, setRevealedCardIdx] = useState<number>(0);

  // Player Sighting Card Deck (loads from local persistence)
  const [collection, setCollection] = useState<SightingCardInstance[]>([]);

  // Telemetry logs
  const [oxygenLevel, setOxygenLevel] = useState(100);
  const [waterPressure, setWaterPressure] = useState(1.3); // Atmospheres

  // Load collection on startup
  useEffect(() => {
    setCollection(PlayerCollection.getCards());

    // Slow depletion of oxygens for aesthetic immersion
    const interval = setInterval(() => {
      setOxygenLevel(prev => {
        if (prev <= 88) return 100; // auto replenish
        return prev - 1;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Set water pressure based on depth (1 atmosphere per 10 meters)
  useEffect(() => {
    const calculatedAtm = Number((1.0 + depth / 10.0).toFixed(1));
    setWaterPressure(calculatedAtm);

    // Update ThreeJS Engine Fog & Lighting as well
    if (engineRef.current) {
      engineRef.current.updateDepth(depth);
    }
  }, [depth]);

  // Synchronize dynamic wildlife whenever Sanctuary swaps
  useEffect(() => {
    if (!mountRef.current) return;

    // Build or restart engine
    if (!engineRef.current) {
      const engine = new OceanPulseEngine({
        container: mountRef.current,
        onEngineReady: () => {
          setIsEngineReady(true);
        },
        onAnimalScanned: (animal: MarineAnimal) => {
          handleScanSpecies(animal);
        }
      });
      engineRef.current = engine;
    }

    // Populate active species pools
    const species = activeSanctuary.speciesPool;
    const box = activeSanctuary.boundingBox;
    engineRef.current.populateWildlife(species, box);
    biologistRef.current.setActiveSanctuary(activeSanctuary.name);

    // Prompt introductory message
    setBiologistDialogue({
      speaker: "Athelgard",
      text: `We have arrived at the **${activeSanctuary.name}**! ${activeSanctuary.description} Dive depth is calibrated to ${depth}m. Keep a sharp look out for ${species.map(s => s.name).slice(0, 3).join(", ")}.`,
      mood: "cheerful"
    });

    // Clean up on component unmount
    return () => {
      // Keep engine alive unless fully destroyed
    };
  }, [activeSanctuaryIdx]);

  // Handle Scan click on 3D wildlife actor
  const handleScanSpecies = (animal: MarineAnimal) => {
    // Generate Sighting Card
    const targetBaseSpecies = activeSanctuary.speciesPool.find(s => s.name.toLowerCase() === animal.name.toLowerCase());
    if (!targetBaseSpecies) return;

    const newCard = generateSightingCard(
      targetBaseSpecies,
      activeSanctuary.name,
      activeSanctuary.boundingBox
    );

    // Save card to localStorage deck
    PlayerCollection.addCard(newCard);
    setCollection(PlayerCollection.getCards());

    // Set interactive visual nodes
    setLastScannedCard(newCard);

    // Get Athelgard's reaction
    const commentary = biologistRef.current.generateScanCommentary(newCard);
    setBiologistDialogue(commentary);
  };

  // Trigger conversational prompts
  const handleQueryBiologist = (type: "biology" | "conservation" | "ecosystem") => {
    const response = biologistRef.current.generateResearchPrompt(type);
    setBiologistDialogue(response);
  };

  // Open a Sighting Card Pack from current sanctuary
  const handleUnboxPack = () => {
    const cards = SightingCardPack.openPack({
      name: activeSanctuary.name,
      speciesPool: activeSanctuary.speciesPool,
      boundingBox: activeSanctuary.boundingBox
    });

    // Save all to player collection
    cards.forEach(c => PlayerCollection.addCard(c));
    setCollection(PlayerCollection.getCards());

    // Launch reveal flow
    setUnboxedCards(cards);
    setRevealedCardIdx(0);
    setLastScannedCard(cards[0]);

    // Update Athelgard
    biologistRef.current.registerSighting(cards[0]);
    setBiologistDialogue({
      speaker: "Athelgard",
      text: `Magnificent unboxing! We've retrieved 3 deep-ocean data cores. Click through to analyze their genetic traits.`,
      mood: "excited"
    });
  };

  const handleNextUnboxedCard = () => {
    if (!unboxedCards) return;
    const nextIdx = revealedCardIdx + 1;
    if (nextIdx < unboxedCards.length) {
      setRevealedCardIdx(nextIdx);
      setLastScannedCard(unboxedCards[nextIdx]);
      biologistRef.current.registerSighting(unboxedCards[nextIdx]);
    } else {
      // Unboxing finished
      setUnboxedCards(null);
    }
  };

  // Clear Collected deck
  const handleResetCollection = () => {
    if (confirm("Are you sure you want to clear your local sighting journal? This cannot be undone.")) {
      PlayerCollection.clearCollection();
      setCollection([]);
      setLastScannedCard(null);
    }
  };

  // Format date helper
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render proper border style based on Card Rarity
  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "from-amber-400 to-orange-500 text-slate-950 font-extrabold border-amber-300 ring-2 ring-amber-400/30 animate-pulse";
      case "Epic":
        return "from-purple-500 to-indigo-600 text-purple-100 border-purple-400";
      case "Rare":
        return "from-cyan-500 to-blue-500 text-cyan-100 border-cyan-400";
      default:
        return "from-slate-700 to-slate-800 text-slate-300 border-slate-600";
    }
  };

  // Render proper card glow based on Card Rarity & Shiny Status
  const getCardGlowStyle = (card: SightingCardInstance) => {
    let shadowColor = "hover:shadow-slate-500/20 hover:border-slate-700";
    if (card.rarity === "Legendary") shadowColor = "shadow-amber-500/10 border-amber-500/40 hover:shadow-amber-500/30";
    else if (card.rarity === "Epic") shadowColor = "shadow-purple-500/10 border-purple-500/40 hover:shadow-purple-500/30";
    else if (card.rarity === "Rare") shadowColor = "shadow-cyan-500/10 border-cyan-500/40 hover:shadow-cyan-500/30";

    if (card.shinyCode !== "Standard") {
      return `${shadowColor} ring-2 ring-pink-500/20 bg-gradient-to-b from-slate-950 via-slate-950 to-pink-950/20`;
    }
    return `${shadowColor} bg-slate-950/90`;
  };

  return (
    <div className="space-y-6">
      {/* 3D Marine Simulator Canvas Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: 3D Telemetry Telescope Window */}
        <div className="lg:col-span-2 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group">
          
          {/* Submersible HUD Glass overlay */}
          <div className="absolute inset-x-0 top-0 p-4 z-20 pointer-events-none flex items-center justify-between bg-gradient-to-b from-black/80 via-black/20 to-transparent">
            
            {/* Left hud telemetry */}
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">TELEMETRY LOCK</span>
                <span className="text-xs font-bold text-white uppercase font-display">{activeSanctuary.name}</span>
              </div>
            </div>

            {/* Right depth coordinates */}
            <div className="text-right font-mono">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider block">COORD GRID</span>
              <span className="text-[11px] text-slate-300 font-bold block">{activeSanctuary.coordinates}</span>
            </div>

          </div>

          {/* Three.js DOM viewport container */}
          <div className="w-full h-[380px] sm:h-[480px] relative bg-cyan-950/30 cursor-crosshair">
            
            {/* The mounting canvas node */}
            <div ref={mountRef} className="w-full h-full" />

            {/* Loading state indicator */}
            {!isEngineReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-30">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Warming optics...</span>
              </div>
            )}

            {/* Crosshair Center HUD Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30 group-hover:opacity-60 transition-opacity">
              <div className="w-16 h-16 border border-cyan-500/40 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              </div>
              {/* Corner brackets */}
              <div className="absolute w-8 h-8 border-t border-l border-cyan-500 top-12 left-12" />
              <div className="absolute w-8 h-8 border-t border-r border-cyan-500 top-12 right-12" />
              <div className="absolute w-8 h-8 border-b border-l border-cyan-500 bottom-12 left-12" />
              <div className="absolute w-8 h-8 border-b border-r border-cyan-500 bottom-12 right-12" />
            </div>

            {/* Float HUD indicators at bottom of frame */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-20 flex flex-wrap gap-4 items-center justify-between">
              
              <div className="flex gap-4">
                {/* Depth gauge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300 rounded-xl">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DIVE: {depth}m</span>
                </div>

                {/* Pressure gauge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 text-xs font-mono text-amber-300 rounded-xl">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>BAR: {waterPressure} ATM</span>
                </div>

                {/* Oxygen Gauge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 text-xs font-mono text-emerald-300 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>O₂: {oxygenLevel}%</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-slate-800/50">
                <span>[HOVER / CLICK WILDLIFE TO SCAN GENETICS]</span>
              </div>

            </div>

          </div>

          {/* Submersible Controls & Sanctuary Selectors */}
          <div className="p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 z-20">
            
            {/* Sanctuary switch tabs */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Active Sanctuary Zone</label>
              <div className="flex flex-wrap gap-2">
                {sanctuariesData.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSanctuaryIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      activeSanctuaryIdx === idx
                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s.id === "monterey_bay" ? "🇺🇸 " : s.id === "great_barrier_reef" ? "🇦🇺 " : "🇪🇨 "}
                    {s.id === "monterey_bay" ? "Monterey" : s.id === "great_barrier_reef" ? "Barrier Reef" : "Galápagos"}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth Slider controls */}
            <div className="flex-1 max-w-sm space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Submersible Depth Control</span>
                <span className="text-cyan-400 font-bold">{depth} METERS</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-600">0m (Photic)</span>
                <input
                  type="range"
                  min="5"
                  max="1250"
                  step="5"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="flex-1 accent-cyan-400 bg-slate-900 rounded-lg appearance-none h-1.5 border border-slate-800 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-600">1250m (Abyssal)</span>
              </div>
            </div>

            {/* Data core unbox packets button */}
            <div className="flex items-end">
              <button
                onClick={handleUnboxPack}
                className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition-all font-display"
              >
                <PackageOpen className="w-4 h-4" />
                <span>Harvest Data Core</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Athelgard AI Companion & Scanned Sighting Card Overlay */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Section 1: Athelgard Dialogue Coach Panel */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden border border-slate-800">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <User className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <span>Dr. Athelgard</span>
                  <span className="text-[9px] uppercase font-mono font-bold px-1 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">Biologist</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">Sanctuary Research Director</p>
              </div>
            </div>

            {/* Dialogue text window */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-900/80 text-xs text-slate-300 leading-relaxed font-sans min-h-[95px] flex flex-col justify-between">
              <div>
                <p dangerouslySetInnerHTML={{ __html: biologistDialogue.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
              </div>
              <div className="flex items-center justify-end mt-2 text-[9px] font-mono uppercase">
                <span className={`px-1.5 py-0.5 rounded ${
                  biologistDialogue.mood === "excited" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  biologistDialogue.mood === "warning" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                }`}>
                  Mood: {biologistDialogue.mood}
                </span>
              </div>
            </div>

            {/* Research triggers */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQueryBiologist("biology")}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg font-mono transition-all"
              >
                🧬 Biology
              </button>
              <button
                onClick={() => handleQueryBiologist("conservation")}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg font-mono transition-all"
              >
                🌱 Conservation
              </button>
              <button
                onClick={() => handleQueryBiologist("ecosystem")}
                className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded-lg font-mono transition-all"
              >
                🌀 Sanctuary
              </button>
            </div>

          </div>

          {/* Section 2: Active Sighting Card Render */}
          <div className="flex-1 flex flex-col justify-center">
            {lastScannedCard ? (
              <div className="flex flex-col gap-4">
                
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>🔬 TELEMETRY READOUT</span>
                  {unboxedCards && (
                    <span className="text-amber-400 font-bold">
                      REVEALED {revealedCardIdx + 1} / {unboxedCards.length}
                    </span>
                  )}
                </div>

                {/* Sighting holographic card */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 ${getCardGlowStyle(lastScannedCard)} flex flex-col gap-4 shadow-xl relative overflow-hidden`}>
                  
                  {/* Subtle water caustics overlay in card */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-pink-500/5 opacity-40 pointer-events-none" />

                  {/* Header: Name and scientific */}
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">{lastScannedCard.category}</span>
                      <h3 className="text-lg font-extrabold text-white font-display tracking-tight leading-tight mt-0.5">{lastScannedCard.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 italic mt-0.5">{lastScannedCard.scientificName}</p>
                    </div>

                    {/* Rarity badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider border ${getRarityBadgeStyle(lastScannedCard.rarity)}`}>
                      {lastScannedCard.rarity}
                    </span>
                  </div>

                  {/* Body graphic stats */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-900 space-y-3.5 z-10">
                    
                    {/* Size and Weight meters */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">PHYSIOLOGY</span>
                        <span className="text-xs font-bold text-white block mt-0.5">{lastScannedCard.length} meters</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">MASS INDEX</span>
                        <span className="text-xs font-bold text-white block mt-0.5">{(lastScannedCard.weight / 1000).toFixed(1)} metric tons</span>
                      </div>
                    </div>

                    {/* GPS tag and Shiny skin status */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-3">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">GPS SECTOR</span>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 block mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{lastScannedCard.gpsLocation.split(",")[0]}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">PHENOTYPE</span>
                        <span className={`text-[10px] font-mono font-bold block mt-0.5 ${
                          lastScannedCard.shinyCode !== "Standard" ? "text-pink-400 animate-pulse" : "text-slate-400"
                        }`}>
                          {lastScannedCard.shinyCode}
                        </span>
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">RESEARCH RATING</span>
                      <span className="text-sm font-extrabold text-amber-400 font-display flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        <span>{lastScannedCard.score.toLocaleString()} PTS</span>
                      </span>
                    </div>

                  </div>

                  {/* Lore fact box */}
                  <p className="text-[11px] text-slate-400 leading-relaxed italic z-10 border-l border-slate-800 pl-2.5">
                    "{lastScannedCard.lore}"
                  </p>

                  {/* Display individual Trait tags */}
                  <div className="flex flex-wrap gap-1.5 z-10">
                    {lastScannedCard.traits.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-300 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Bottom stamp */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-600 mt-2 z-10 uppercase border-t border-slate-900/50 pt-2">
                    <span>Logged: {formatDate(lastScannedCard.scannedAt)}</span>
                    <span>OPNODE: {lastScannedCard.id.slice(-6)}</span>
                  </div>

                </div>

                {unboxedCards && (
                  <button
                    onClick={handleNextUnboxedCard}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-white rounded-xl transition-all"
                  >
                    {revealedCardIdx === unboxedCards.length - 1 ? "Finish Collection Scan" : "Examine Next Sighting"}
                  </button>
                )}

              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center text-slate-500">
                <Compass className="w-10 h-10 text-slate-600 animate-spin-slow mb-3" />
                <h4 className="text-xs font-bold text-slate-400 font-display uppercase tracking-widest">Telescope Standby</h4>
                <p className="text-[11px] mt-1.5 leading-relaxed max-w-[200px]">
                  Waiting for active 3D research scan or data core unboxing.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sighting Deck Card Collection */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              <span>Sanctuary Sightings Journal ({collection.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Your registered research cards across deep ocean dives.</p>
          </div>

          <div className="flex gap-3">
            {collection.length > 0 && (
              <button
                onClick={handleResetCollection}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Journal</span>
              </button>
            )}
          </div>
        </div>

        {collection.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 max-h-[300px] overflow-y-auto pr-1">
            {collection.map((card) => {
              const isLegendary = card.rarity === "Legendary";
              const isEpic = card.rarity === "Epic";
              const isRare = card.rarity === "Rare";

              let cardBorder = "border-slate-800 bg-slate-950/80 hover:border-slate-700";
              if (isLegendary) cardBorder = "border-amber-500/40 bg-amber-950/10 hover:border-amber-400";
              else if (isEpic) cardBorder = "border-purple-500/40 bg-purple-950/10 hover:border-purple-400";
              else if (isRare) cardBorder = "border-cyan-500/40 bg-cyan-950/10 hover:border-cyan-400";

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setLastScannedCard(card);
                    biologistRef.current.registerSighting(card);
                    const commentary = biologistRef.current.generateScanCommentary(card);
                    setBiologistDialogue(commentary);
                  }}
                  className={`p-3.5 rounded-2xl border ${cardBorder} flex flex-col justify-between gap-2.5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{card.category}</span>
                    <span className={`text-[8px] uppercase font-mono px-1 border rounded ${
                      isLegendary ? "border-amber-500/40 text-amber-400 font-extrabold" :
                      isEpic ? "border-purple-500/40 text-purple-400" :
                      isRare ? "border-cyan-500/40 text-cyan-400" :
                      "border-slate-700 text-slate-400"
                    }`}>
                      {card.rarity.slice(0, 3)}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-extrabold text-white font-display truncate">{card.name}</h5>
                    <p className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{card.scientificName}</p>
                  </div>

                  <div className="border-t border-slate-900/80 pt-2 flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-500">{card.length}m</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{card.score}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500">
            <Globe2 className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-xs font-bold text-slate-400 font-display uppercase tracking-widest">No Sightings Registered</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Your journal is currently blank. Explore the 3D submarine viewpoint or open data core card packs to record your findings.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
