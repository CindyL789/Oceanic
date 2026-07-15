import * as THREE from "three";

export interface AnimalData {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  rarity: string;
  baseWeight: number;
  lengthRange: number[];
  depthRange: number[];
  traits: string[];
  lore: string;
  rarityWeight: number;
}

export class MarineAnimal {
  public id: string;
  public name: string;
  public scientificName: string;
  public category: string;
  public rarity: string;
  public traits: string[];
  public lore: string;

  // 3D Engine Objects
  public group: THREE.Group;
  public bodyMesh!: THREE.Mesh | THREE.Group;
  public tailMesh!: THREE.Mesh;

  // Size/Stats
  public length: number;
  public weight: number;
  public score: number;

  // GPS coordinates in the simulated sanctuary
  public gpsLat: number;
  public gpsLon: number;

  // Waypoint navigation variables
  protected waypoints: THREE.Vector3[] = [];
  protected currentWaypointIndex: number = 0;
  protected speed: number = 2.0;
  protected rotationSpeed: number = 1.5;
  protected animationTime: number = 0;

  constructor(data: AnimalData, boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number }) {
    this.id = `${data.id}_${Math.random().toString(36).substr(2, 5)}`;
    this.name = data.name;
    this.scientificName = data.scientificName;
    this.category = data.category;
    this.rarity = data.rarity;
    this.traits = [...data.traits];
    this.lore = data.lore;

    // Generate random individual variations
    const lMin = data.lengthRange[0];
    const lMax = data.lengthRange[1];
    this.length = Number((lMin + Math.random() * (lMax - lMin)).toFixed(1));
    
    const sizeRatio = this.length / lMax;
    this.weight = Math.round(data.baseWeight * Math.pow(sizeRatio, 3) * (0.85 + Math.random() * 0.3));
    this.score = this.calculateRarityScore();

    // Map to a GPS coordinate within sanctuary bounds
    const latSpan = boundingBox.maxLat - boundingBox.minLat;
    const lonSpan = boundingBox.maxLon - boundingBox.minLon;
    this.gpsLat = Number((boundingBox.minLat + Math.random() * latSpan).toFixed(4));
    this.gpsLon = Number((boundingBox.minLon + Math.random() * lonSpan).toFixed(4));

    // ThreeJS Node Setup
    this.group = new THREE.Group();
    this.group.name = `animal_${this.id}`;
    // Attach self reference for raycaster lookup
    this.group.userData = { animalInstance: this };

    this.buildGeometry();
    this.generateWaypoints();
  }

  private calculateRarityScore(): number {
    let multiplier = 1;
    switch (this.rarity) {
      case "Legendary": multiplier = 15; break;
      case "Epic": multiplier = 8; break;
      case "Rare": multiplier = 4; break;
      default: multiplier = 1.5; break;
    }
    const weightFactor = Math.log10(this.weight + 1) * 2;
    return Math.round((this.length * multiplier + weightFactor) * 10);
  }

  protected buildGeometry(): void {
    // Override in subclasses. Let's create a fallback capsule geometry.
    const geometry = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.2,
      metalness: 0.1,
    });
    const fallbackMesh = new THREE.Mesh(geometry, material);
    fallbackMesh.rotation.x = Math.PI / 2;
    this.group.add(fallbackMesh);
    this.bodyMesh = fallbackMesh;
  }

  private generateWaypoints(): void {
    const waypointCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < waypointCount; i++) {
      // Waypoints spread across the 3D marine sandbox
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 30 - 5; // offset downwards
      const z = (Math.random() - 0.5) * 80;
      this.waypoints.push(new THREE.Vector3(x, y, z));
    }
    // Set initial position
    if (this.waypoints.length > 0) {
      this.group.position.copy(this.waypoints[0]);
    }
  }

  public update(deltaTime: number, speedMultiplier: number = 1.0): void {
    if (this.waypoints.length === 0) return;

    this.animationTime += deltaTime * speedMultiplier * this.speed;

    const target = this.waypoints[this.currentWaypointIndex];
    const position = this.group.position;

    // Move towards target waypoint
    const dir = new THREE.Vector3().subVectors(target, position);
    const distance = dir.length();

    if (distance < 3.0) {
      // Near waypoint, transition to next
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      dir.normalize();

      // Smoothly rotate towards waypoint target
      const targetRotation = Math.atan2(dir.x, dir.z);
      
      // Calculate current yaw and interpolate
      let currentYaw = this.group.rotation.y;
      
      // Handle modular wrapping
      let diff = targetRotation - currentYaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      this.group.rotation.y += diff * this.rotationSpeed * deltaTime;

      // Handle pitch (up/down rotation)
      const pitchTarget = Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
      let currentPitch = this.group.rotation.x;
      let pitchDiff = pitchTarget - currentPitch;
      this.group.rotation.x += pitchDiff * this.rotationSpeed * deltaTime;

      // Translate forward in local space direction
      const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.group.rotation);
      this.group.position.addScaledVector(forward, this.speed * speedMultiplier * deltaTime);
    }

    // Animate Tail movement based on velocity/time
    this.animateBodyParts();
  }

  protected animateBodyParts(): void {
    if (this.tailMesh) {
      // Standard fish flap
      this.tailMesh.rotation.y = Math.sin(this.animationTime * 2.5) * 0.35;
    }
  }
}

// 🐳 SUBCLASS: WHALES (Gigantic, horizontal tail fluke movement, slow & majestic)
export class WhaleAnimal extends MarineAnimal {
  protected override buildGeometry(): void {
    this.speed = 1.1;
    this.rotationSpeed = 0.4;

    const bodyGroup = new THREE.Group();

    // Main giant capsule body
    const bodyGeom = new THREE.CapsuleGeometry(2.5, 8, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate blue/grey
      roughness: 0.3,
      metalness: 0.05,
    });
    const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
    mainBody.rotation.x = Math.PI / 2;
    mainBody.scale.set(1.2, 1, 1); // Flatten slightly
    bodyGroup.add(mainBody);

    // Left flipper
    const flipperGeom = new THREE.BoxGeometry(0.4, 0.8, 3.5);
    const leftFlipper = new THREE.Mesh(flipperGeom, bodyMat);
    leftFlipper.position.set(-2.8, -0.5, 1);
    leftFlipper.rotation.set(0.2, 0, 0.5);
    bodyGroup.add(leftFlipper);

    // Right flipper
    const rightFlipper = new THREE.Mesh(flipperGeom, bodyMat);
    rightFlipper.position.set(2.8, -0.5, 1);
    rightFlipper.rotation.set(0.2, 0, -0.5);
    bodyGroup.add(rightFlipper);

    // Fluke Connector (Tail Stem)
    const tailStemGeom = new THREE.CylinderGeometry(1.2, 0.5, 4, 8);
    const tailStem = new THREE.Mesh(tailStemGeom, bodyMat);
    tailStem.position.set(0, 0, -5.5);
    tailStem.rotation.x = Math.PI / 2;
    
    // Fluke (Horizontal Fins)
    const flukeGeom = new THREE.BoxGeometry(4.5, 0.2, 1.8);
    const fluke = new THREE.Mesh(flukeGeom, bodyMat);
    fluke.position.set(0, -1.8, 0); // Position at end of tail cylinder
    fluke.rotation.x = -Math.PI / 2;
    tailStem.add(fluke);

    bodyGroup.add(tailStem);
    this.tailMesh = tailStem; // Track the stem for flapping animations

    this.group.add(bodyGroup);
    this.bodyMesh = bodyGroup;
  }

  protected override animateBodyParts(): void {
    if (this.tailMesh) {
      // Cetaceans flap tail vertically (up and down)
      this.tailMesh.rotation.x = Math.PI / 2 + Math.sin(this.animationTime * 1.5) * 0.22;
    }
  }
}

// 🐬 SUBCLASS: DOLPHINS (Sleek, fast, playful vertical fluke, dorsal fin)
export class DolphinAnimal extends MarineAnimal {
  protected override buildGeometry(): void {
    this.speed = 3.6;
    this.rotationSpeed = 1.8;

    const bodyGroup = new THREE.Group();

    // Streamlined body capsule
    const bodyGeom = new THREE.CapsuleGeometry(0.7, 3.0, 8, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Lighter blue/grey
      roughness: 0.15,
      metalness: 0.05,
    });
    const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
    mainBody.rotation.x = Math.PI / 2;
    bodyGroup.add(mainBody);

    // Snout / Beak
    const snoutGeom = new THREE.ConeGeometry(0.25, 0.9, 8);
    const snout = new THREE.Mesh(snoutGeom, bodyMat);
    snout.position.set(0, -0.2, 2.2);
    snout.rotation.x = Math.PI / 2;
    bodyGroup.add(snout);

    // Dorsal Fin (Curved back)
    const dorsalGeom = new THREE.ConeGeometry(0.3, 0.8, 4);
    const dorsal = new THREE.Mesh(dorsalGeom, bodyMat);
    dorsal.position.set(0, 0.9, -0.4);
    dorsal.rotation.set(-0.5, 0, 0);
    bodyGroup.add(dorsal);

    // Pectoral Fins
    const pecGeom = new THREE.BoxGeometry(0.1, 0.3, 1.0);
    const leftPec = new THREE.Mesh(pecGeom, bodyMat);
    leftPec.position.set(-0.8, -0.2, 0.6);
    leftPec.rotation.set(0, 0, 0.4);
    bodyGroup.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeom, bodyMat);
    rightPec.position.set(0.8, -0.2, 0.6);
    rightPec.rotation.set(0, 0, -0.4);
    bodyGroup.add(rightPec);

    // Tail Stem
    const tailStemGeom = new THREE.CylinderGeometry(0.35, 0.15, 1.8, 8);
    const tailStem = new THREE.Mesh(tailStemGeom, bodyMat);
    tailStem.position.set(0, 0, -2.1);
    tailStem.rotation.x = Math.PI / 2;

    // Dolphin Flukes (Horizontal)
    const flukeGeom = new THREE.BoxGeometry(1.5, 0.1, 0.6);
    const fluke = new THREE.Mesh(flukeGeom, bodyMat);
    fluke.position.set(0, -0.8, 0);
    fluke.rotation.x = -Math.PI / 2;
    tailStem.add(fluke);

    bodyGroup.add(tailStem);
    this.tailMesh = tailStem;

    this.group.add(bodyGroup);
    this.bodyMesh = bodyGroup;
  }

  protected override animateBodyParts(): void {
    if (this.tailMesh) {
      // Dolphin vertical fluke wave
      this.tailMesh.rotation.x = Math.PI / 2 + Math.sin(this.animationTime * 3.5) * 0.28;
      // Soft pitch wave in the whole body to simulate swimming
      if (this.bodyMesh) {
        this.bodyMesh.position.y = Math.sin(this.animationTime * 3.5) * 0.15;
      }
    }
  }
}

// 🦈 SUBCLASS: SHARKS (Fierce diamond body, prominent dorsal, horizontal caudal flapping)
export class SharkAnimal extends MarineAnimal {
  protected override buildGeometry(): void {
    this.speed = 2.4;
    this.rotationSpeed = 1.1;

    const bodyGroup = new THREE.Group();

    // Sharp streamlined capsule body
    const bodyGeom = new THREE.CapsuleGeometry(0.85, 3.4, 8, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Ocean slate grey
      roughness: 0.4,
      metalness: 0.1,
    });
    const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
    mainBody.rotation.x = Math.PI / 2;
    bodyGroup.add(mainBody);

    // Nose Cone
    const noseGeom = new THREE.ConeGeometry(0.85, 1.4, 8);
    const nose = new THREE.Mesh(noseGeom, bodyMat);
    nose.position.set(0, -0.05, 2.2);
    nose.rotation.x = Math.PI / 2;
    bodyGroup.add(nose);

    // Iconic Dorsal Fin
    const dorsalGeom = new THREE.ConeGeometry(0.4, 1.2, 4);
    const dorsal = new THREE.Mesh(dorsalGeom, bodyMat);
    dorsal.position.set(0, 1.2, -0.2);
    dorsal.rotation.set(-0.3, 0, 0);
    bodyGroup.add(dorsal);

    // Long Pectoral Fins
    const pecGeom = new THREE.BoxGeometry(0.12, 0.4, 1.6);
    const leftPec = new THREE.Mesh(pecGeom, bodyMat);
    leftPec.position.set(-1.1, -0.2, 0.5);
    leftPec.rotation.set(0.1, 0.1, 0.6);
    bodyGroup.add(leftPec);

    const rightPec = new THREE.Mesh(pecGeom, bodyMat);
    rightPec.position.set(1.1, -0.2, 0.5);
    rightPec.rotation.set(0.1, -0.1, -0.6);
    bodyGroup.add(rightPec);

    // Vertical Caudal Fin (Shark Tail Stem)
    const tailStemGeom = new THREE.CylinderGeometry(0.45, 0.15, 2.0, 8);
    const tailStem = new THREE.Mesh(tailStemGeom, bodyMat);
    tailStem.position.set(0, 0, -2.3);
    tailStem.rotation.x = Math.PI / 2;

    // Caudal Fin Blade (Vertical)
    const caudalGeom = new THREE.ConeGeometry(0.5, 1.6, 4);
    const caudal = new THREE.Mesh(caudalGeom, bodyMat);
    caudal.position.set(0, -0.9, 0); // attached at tail cylinder tip
    caudal.rotation.set(-Math.PI / 2, 0, 0);
    caudal.scale.set(0.2, 1.2, 1);
    tailStem.add(caudal);

    bodyGroup.add(tailStem);
    this.tailMesh = tailStem;

    this.group.add(bodyGroup);
    this.bodyMesh = bodyGroup;
  }

  protected override animateBodyParts(): void {
    if (this.tailMesh) {
      // Fish tail flaps side to side (Y rotation)
      this.tailMesh.rotation.y = Math.sin(this.animationTime * 2.8) * 0.4;
    }
  }
}

// 🐢 SUBCLASS: REPTILES / TURTLES (Disc-shaped shell, flipper flapping, slow & peaceful)
export class ReptileAnimal extends MarineAnimal {
  protected override buildGeometry(): void {
    this.speed = 1.3;
    this.rotationSpeed = 0.8;

    const bodyGroup = new THREE.Group();

    // Low-profile wide shell mesh
    const shellGeom = new THREE.SphereGeometry(1.3, 16, 12);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Olive green
      roughness: 0.6,
      metalness: 0.1,
    });
    const shell = new THREE.Mesh(shellGeom, shellMat);
    shell.scale.set(1.4, 0.6, 1.8); // Flatten and elongate like a sea turtle shell
    bodyGroup.add(shell);

    // Turtle Head
    const headGeom = new THREE.SphereGeometry(0.45, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Green skin
      roughness: 0.5,
    });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, -0.1, 1.8);
    bodyGroup.add(head);

    // Massive Wing-like Front Flippers (these flap up and down)
    const flipperGeom = new THREE.BoxGeometry(2.0, 0.1, 0.6);
    
    const leftFlipper = new THREE.Mesh(flipperGeom, headMat);
    leftFlipper.position.set(-1.8, 0, 0.8);
    leftFlipper.rotation.set(0, 0.3, 0.2);
    bodyGroup.add(leftFlipper);

    const rightFlipper = new THREE.Mesh(flipperGeom, headMat);
    rightFlipper.position.set(1.8, 0, 0.8);
    rightFlipper.rotation.set(0, -0.3, -0.2);
    bodyGroup.add(rightFlipper);

    // Rear flippers
    const rearGeom = new THREE.BoxGeometry(0.8, 0.08, 0.4);
    const rearLeft = new THREE.Mesh(rearGeom, headMat);
    rearLeft.position.set(-0.8, -0.1, -1.3);
    rearLeft.rotation.set(0, 0.1, 0.1);
    bodyGroup.add(rearLeft);

    const rearRight = new THREE.Mesh(rearGeom, headMat);
    rearRight.position.set(0.8, -0.1, -1.3);
    rearRight.rotation.set(0, -0.1, -0.1);
    bodyGroup.add(rearRight);

    this.group.add(bodyGroup);
    this.bodyMesh = bodyGroup;
    
    // We'll track the front flippers for flapping
    this.tailMesh = leftFlipper; // We will use custom animating for flippers
  }

  protected override animateBodyParts(): void {
    if (this.bodyMesh) {
      const flippers = this.bodyMesh.children.filter(c => c.position.z === 0.8);
      if (flippers.length === 2) {
        const flap = Math.sin(this.animationTime * 1.8) * 0.4;
        flippers[0].rotation.z = 0.2 + flap;      // Left flipper
        flippers[1].rotation.z = -0.2 - flap;     // Right flipper
      }
    }
  }
}

// 🐧 SUBCLASS: BIRDS / PENGUINS (Small torpedo capsule, fast flippers, erratic darts)
export class BirdAnimal extends MarineAnimal {
  protected override buildGeometry(): void {
    this.speed = 3.2;
    this.rotationSpeed = 2.2;

    const bodyGroup = new THREE.Group();

    // Small capsule body
    const bodyGeom = new THREE.CapsuleGeometry(0.3, 0.8, 8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Obsidian dark feathers
      roughness: 0.1,
    });
    const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
    mainBody.rotation.x = Math.PI / 2;
    bodyGroup.add(mainBody);

    // White belly panel
    const bellyGeom = new THREE.BoxGeometry(0.4, 0.1, 0.6);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Clean white feathers
      roughness: 0.2,
    });
    const belly = new THREE.Mesh(bellyGeom, bellyMat);
    belly.position.set(0, -0.25, 0.1);
    bodyGroup.add(belly);

    // Beak
    const beakGeom = new THREE.ConeGeometry(0.08, 0.25, 4);
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Orange beak
      roughness: 0.4,
    });
    const beak = new THREE.Mesh(beakGeom, beakMat);
    beak.position.set(0, -0.05, 0.65);
    beak.rotation.x = Math.PI / 2;
    bodyGroup.add(beak);

    // Flippers (wings)
    const flipperGeom = new THREE.BoxGeometry(0.1, 0.15, 0.65);
    const flipperMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const leftWing = new THREE.Mesh(flipperGeom, flipperMat);
    leftWing.position.set(-0.35, 0, 0);
    leftWing.rotation.set(0, 0, 0.6);
    bodyGroup.add(leftWing);

    const rightWing = new THREE.Mesh(flipperGeom, flipperMat);
    rightWing.position.set(0.35, 0, 0);
    rightWing.rotation.set(0, 0, -0.6);
    bodyGroup.add(rightWing);

    this.group.add(bodyGroup);
    this.bodyMesh = bodyGroup;
    this.tailMesh = leftWing; // Flaps wings
  }

  protected override animateBodyParts(): void {
    if (this.bodyMesh) {
      const wings = this.bodyMesh.children.filter(c => c.position.x === -0.35 || c.position.x === 0.35);
      if (wings.length === 2) {
        const flap = Math.sin(this.animationTime * 4.5) * 0.55;
        wings[0].rotation.z = 0.6 + flap;       // Left wing
        wings[1].rotation.z = -0.6 - flap;      // Right wing
      }
    }
  }
}

// Animal Factory
export function createAnimalInstance(data: AnimalData, boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): MarineAnimal {
  const category = data.category.toLowerCase();
  if (category === "whale") {
    return new WhaleAnimal(data, boundingBox);
  } else if (category === "dolphin") {
    return new DolphinAnimal(data, boundingBox);
  } else if (category === "shark") {
    return new SharkAnimal(data, boundingBox);
  } else if (category === "reptile") {
    return new ReptileAnimal(data, boundingBox);
  } else if (category === "bird") {
    return new BirdAnimal(data, boundingBox);
  }
  return new MarineAnimal(data, boundingBox);
}
