import { AnimalData } from "../wildlife/animal";

export interface SightingCardInstance {
  id: string;
  speciesId: string;
  name: string;
  scientificName: string;
  category: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  length: number;
  weight: number;
  gpsLocation: string; // "36.843° N, 121.902° W"
  traits: string[];
  lore: string;
  score: number;
  scannedAt: string; // ISO date string
  ratingMultiplier: number; // 1.0 to 1.5 based on size perfection
  shinyCode: "Standard" | "Bio-Luminescent" | "Golden-Slick" | "Albino-Ghost";
}

const SHINY_CHANCES = [
  { type: "Bio-Luminescent" as const, chance: 0.12 },
  { type: "Golden-Slick" as const, chance: 0.04 },
  { type: "Albino-Ghost" as const, chance: 0.015 }
];

const MARINE_BONUS_TRAITS = [
  "Deep Trench Dweller",
  "High-Frequency Vocalist",
  "Migration Champion",
  "Abyssal Glider",
  "Micro-Plankton Enthusiast",
  "Echolocation Master",
  "Kelpmist Master",
  "Estuary Patroller"
];

/**
 * Creates a unique card instance from a species base template
 */
export function generateSightingCard(species: AnimalData, sanctuaryName: string, boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): SightingCardInstance {
  const cardId = `card_${species.id}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 1. Calculate random length and weight variations
  const lengthVariation = 0.85 + Math.random() * 0.3; // +/- 15%
  const length = Number((species.lengthRange[0] + Math.random() * (species.lengthRange[1] - species.lengthRange[0])).toFixed(2));
  
  const sizeRatio = length / species.lengthRange[1];
  const baseWeight = species.baseWeight;
  const weight = Math.round(baseWeight * Math.pow(sizeRatio, 3) * (0.9 + Math.random() * 0.2));

  // Size perfection multiplier
  const sizePerfection = sizeRatio > 1.05 ? 1.5 : sizeRatio > 0.95 ? 1.2 : 1.0;

  // 2. Roll Shiny skin variation
  let shinyCode: SightingCardInstance["shinyCode"] = "Standard";
  const roll = Math.random();
  let accumulatedChance = 0;
  for (const shiny of SHINY_CHANCES) {
    accumulatedChance += shiny.chance;
    if (roll < accumulatedChance) {
      shinyCode = shiny.type;
      break;
    }
  }

  // 3. Roll extra traits
  const extraTrait = MARINE_BONUS_TRAITS[Math.floor(Math.random() * MARINE_BONUS_TRAITS.length)];
  const cardTraits = [...species.traits];
  if (!cardTraits.includes(extraTrait)) {
    cardTraits.push(extraTrait);
  }

  // 4. Map simulated GPS coordinates
  const latSpan = boundingBox.maxLat - boundingBox.minLat;
  const lonSpan = boundingBox.maxLon - boundingBox.minLon;
  const lat = (boundingBox.minLat + Math.random() * latSpan).toFixed(4);
  const lon = (boundingBox.minLon + Math.random() * lonSpan).toFixed(4);
  const gpsLocation = `${lat}° N, ${lon}° W`;

  // 5. Calculate Score
  let rarityMult = 100;
  if (species.rarity === "Legendary") rarityMult = 1000;
  else if (species.rarity === "Epic") rarityMult = 500;
  else if (species.rarity === "Rare") rarityMult = 250;

  const shinyMult = shinyCode !== "Standard" ? 1.5 : 1.0;
  const score = Math.round((rarityMult + length * 1.5 + Math.sqrt(weight) * 0.5) * sizePerfection * shinyMult);

  return {
    id: cardId,
    speciesId: species.id,
    name: species.name,
    scientificName: species.scientificName,
    category: species.category,
    rarity: species.rarity as SightingCardInstance["rarity"],
    length,
    weight,
    gpsLocation,
    traits: cardTraits,
    lore: species.lore,
    score,
    scannedAt: new Date().toISOString(),
    ratingMultiplier: sizePerfection,
    shinyCode
  };
}

/**
 * Handles persistent card collection manager inside localStorage
 */
export class PlayerCollection {
  private static STORAGE_KEY = "oceanpulse_sighting_deck_v1";

  public static getCards(): SightingCardInstance[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load player collections:", e);
    }
    return [];
  }

  public static addCard(card: SightingCardInstance): boolean {
    const deck = this.getCards();
    
    // Check if duplicate is already owned with same or better score (optional: just add everything to show sightings feed)
    deck.unshift(card); // insert at top
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(deck));
      return true;
    } catch (e) {
      console.error("Failed to persist sighting card:", e);
      return false;
    }
  }

  public static clearCollection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

/**
 * Simulates a Card Pack containing 3 random sightings from a sanctuary
 */
export class SightingCardPack {
  public static openPack(sanctuary: { name: string; speciesPool: AnimalData[]; boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number } }): SightingCardInstance[] {
    const results: SightingCardInstance[] = [];
    const pool = sanctuary.speciesPool;

    if (pool.length === 0) return [];

    // Open exactly 3 cards
    for (let i = 0; i < 3; i++) {
      // Pick species based on weighted rarity probability
      const selectedSpecies = this.drawWeightedSpecies(pool);
      const card = generateSightingCard(selectedSpecies, sanctuary.name, sanctuary.boundingBox);
      results.push(card);
    }

    return results;
  }

  private static drawWeightedSpecies(pool: AnimalData[]): AnimalData {
    const weights = pool.map(s => s.rarityWeight || 0.2);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        return pool[i];
      }
    }
    return pool[pool.length - 1]; // fallback
  }
}
