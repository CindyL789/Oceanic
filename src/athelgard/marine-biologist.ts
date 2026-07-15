import { SightingCardInstance } from "../cards/sighting-card";

export interface DialogueNode {
  speaker: string;
  text: string;
  mood: "excited" | "scholarly" | "warning" | "cheerful" | "philosophical";
}

export class MarineBiologistCompanion {
  private name: string = "Athelgard";
  private title: string = "Veteran Marine Biologist & Chief Oceanographer";
  private lastScannedCard: SightingCardInstance | null = null;
  private activeSanctuaryName: string = "Monterey Bay";

  // Retain dialog history
  private memoryHistory: { role: "user" | "biologist"; text: string }[] = [];

  constructor() {}

  public setActiveSanctuary(name: string): void {
    this.activeSanctuaryName = name;
  }

  public registerSighting(card: SightingCardInstance): void {
    this.lastScannedCard = card;
  }

  /**
   * Generates instant, high-fidelity dialogue reactions to a 3D scanned animal
   */
  public generateScanCommentary(card: SightingCardInstance): DialogueNode {
    this.lastScannedCard = card;
    const name = card.name;
    const category = card.category.toLowerCase();

    // Custom shiny triggers
    if (card.shinyCode !== "Standard") {
      return {
        speaker: `${this.name} (${this.title})`,
        text: `By Neptune's trident! A **${card.shinyCode}** skin variant of the **${name}**! This is an incredibly rare genetic mutation causing unique reflectivity down in the current. Log this immediately in your research journal!`,
        mood: "excited"
      };
    }

    // Legendary triggers
    if (card.rarity === "Legendary") {
      return {
        speaker: `${this.name}`,
        text: `Sweet Mother of Oceans... a wild **${name}** (${card.scientificName})! At **${card.length} meters** and **${card.weight.toLocaleString()} kg**, this is a legendary apex discovery! Notice how its geometric profile glides gracefully. This sighting is a massive indicator of a thriving sanctuary.`,
        mood: "excited"
      };
    }

    // Category based custom commentary
    switch (category) {
      case "whale":
        return {
          speaker: `${this.name}`,
          text: `An elegant **${name}** glide! Did you know cetaceans play a vital role in vertical nutrient pump cycles? By feeding at depth and releasing nutrients near the surface, they act as mechanical marine engines that power phytoplanktons. Magnificent!`,
          mood: "scholarly"
        };
      case "shark":
        return {
          speaker: `${this.name}`,
          text: `A magnificent **${name}** patrolling! Don't let movie lore fool you—sharks are the immune system of our seas. They hunt the weak and prevent diseases from running rampant through bony fish species. Stand in awe, but maintain research boundaries.`,
          mood: "philosophical"
        };
      case "reptile":
        return {
          speaker: `${this.name}`,
          text: `Look at this **${name}**! Its shell measures **${card.length} meters**. In our current warming trends, sea turtles face extreme nesting hazards due to rising beach temperatures, which impacts hatchling gender ratios. Supporting marine sanctuaries is their biggest shield against extinction.`,
          mood: "warning"
        };
      case "bird":
        return {
          speaker: `${this.name}`,
          text: `A **${name}** darting through! Highly adaptive, yet extremely vulnerable to surface microplastics. These brave flyers rely on pristine surface currents to hunt small krill. Let's make sure our digital telemetry raises awareness about keeping plastics off the shoreline!`,
          mood: "warning"
        };
      default:
        return {
          speaker: `${this.name}`,
          text: `Ah, a delightful **${name}**! A key resident of **${this.activeSanctuaryName}**. Observing its movement gives us crucial telemetry on localized current velocities and water cleanliness index. Beautiful specimen.`,
          mood: "cheerful"
        };
    }
  }

  /**
   * Generates a tailored research fact based on local memory and clicked options
   */
  public generateResearchPrompt(type: "biology" | "conservation" | "ecosystem"): DialogueNode {
    const card = this.lastScannedCard;
    
    if (type === "biology") {
      if (card) {
        return {
          speaker: this.name,
          text: `Let's dissect the biology of the **${card.name}** (${card.scientificName}). At **${card.length} meters**, its morphology is perfectly optimized. For example, its ${card.traits[0]} trait acts as an evolutionary lock-and-key with its depth range of ${card.category === "Whale" ? "0-500m" : "0-100m"}. Truly a masterpiece of fluid mechanics!`,
          mood: "scholarly"
        };
      }
      return {
        speaker: this.name,
        text: `Please tap or click on any swimming creature in the 3D marine telescope first! I'll break down their muscular structure, cellular salinity valves, and migratory instincts instantly.`,
        mood: "cheerful"
      };
    }

    if (type === "conservation") {
      return {
        speaker: this.name,
        text: `Urgent coastal warning: our warming thermal layers are causing rapid kelp canopy collapses. Without kelp, countless nursery species lose their shielding. Our mission with OceanPulse is to log these sightings so global policy makers have hard, empirical telemetry to declare strict zero-trawl zones.`,
        mood: "warning"
      };
    }

    // Ecosystem trigger
    return {
      speaker: this.name,
      text: `We are currently stationed at the **${this.activeSanctuaryName}**. Ocean sanctuaries represent less than 8% of global waters, yet they hold over 60% of breeding apex predators. By connecting the cold deep trenches to the warm shallow reefs, they form resilient migratory corridors!`,
      mood: "philosophical"
    };
  }
}
