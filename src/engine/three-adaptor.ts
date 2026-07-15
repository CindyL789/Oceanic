import * as THREE from "three";
import { UnderwaterWorld } from "../worlds/underwater";
import { MarineAnimal, createAnimalInstance } from "../wildlife/animal";
import { AnimalData } from "../wildlife/animal";

export interface EngineConfig {
  container: HTMLDivElement;
  onAnimalScanned: (animal: MarineAnimal) => void;
  onEngineReady: () => void;
}

export class OceanPulseEngine {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.Camera; // Perspective
  private renderer!: THREE.WebGLRenderer;
  private underwaterWorld!: UnderwaterWorld;
  private animals: MarineAnimal[] = [];
  private onAnimalScanned: (animal: MarineAnimal) => void;

  // Animation states
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();
  private isDestroyed = false;

  // Submersible control states
  private currentDepth = 30; // standard initial depth in meters
  private targetYaw = 0;
  private targetPitch = 0;
  private curYaw = 0;
  private curPitch = 0;

  constructor(config: EngineConfig) {
    this.container = config.container;
    this.onAnimalScanned = config.onAnimalScanned;

    this.initThree();
    this.initControls();
    
    // Notify React layer
    config.onEngineReady();

    this.startLoop();
  }

  private initThree(): void {
    const rect = this.container.getBoundingClientRect();

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup (Fov, aspect, near, far)
    const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 1000);
    camera.position.set(0, 2, 35); // pull back to overlook the bay
    this.camera = camera;

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // keep performance super light

    // Append WebGL canvas to container
    this.container.appendChild(this.renderer.domElement);

    // 4. Initialize procedural underwater scenery (seabed, kelp, bubbles, headlights)
    this.underwaterWorld = new UnderwaterWorld(this.scene);

    // Initial fog trigger
    this.updateDepth(this.currentDepth);

    // Handle window resize dynamically
    window.addEventListener("resize", this.handleResize);
  }

  private initControls(): void {
    // Soft mouse float controller mimicking floating inside an ocean current
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Control viewing angles based on hover positions
      this.targetYaw = -x * 0.45;
      this.targetPitch = y * 0.35;
    };

    this.container.addEventListener("mousemove", handleMouseMove);

    // Click handler for raycaster scanning
    const handleMouseClick = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      // Collect meshes to test intersection
      const targets: THREE.Object3D[] = [];
      this.animals.forEach(animal => {
        targets.push(animal.group);
      });

      // Scan descendants
      const intersects = raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        // Find animalInstance attached in userData
        let clickedObject: THREE.Object3D | null = intersects[0].object;
        while (clickedObject && !clickedObject.userData.animalInstance) {
          clickedObject = clickedObject.parent;
        }

        if (clickedObject && clickedObject.userData.animalInstance) {
          const matchedAnimal = clickedObject.userData.animalInstance as MarineAnimal;
          this.onAnimalScanned(matchedAnimal);
        }
      }
    };

    this.container.addEventListener("click", handleMouseClick);
  }

  /**
   * Spawns a list of species in the Three.js viewport
   */
  public populateWildlife(speciesPool: AnimalData[], boundingBox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): void {
    // Clear previous animals from the scene
    this.animals.forEach(animal => {
      this.scene.remove(animal.group);
    });
    this.animals = [];

    // Instantiate 3D actors for each species
    speciesPool.forEach((species) => {
      // Create 2 - 3 active agents of each species to populate the sandbox beautifully
      const copies = species.rarity === "Legendary" ? 1 : 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < copies; i++) {
        const instance = createAnimalInstance(species, boundingBox);
        
        // Randomly scatter initial spots inside range
        const scatterX = (Math.random() - 0.5) * 50;
        const scatterY = (Math.random() - 0.5) * 15 - 4;
        const scatterZ = (Math.random() - 0.5) * 50;
        instance.group.position.set(scatterX, scatterY, scatterZ);

        this.scene.add(instance.group);
        this.animals.push(instance);
      }
    });
  }

  public updateDepth(depth: number): void {
    this.currentDepth = depth;
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = rect.width / rect.height;
      this.camera.updateProjectionMatrix();
    }
    
    this.renderer.setSize(rect.width, rect.height);
  };

  private startLoop(): void {
    const loop = () => {
      if (this.isDestroyed) return;

      const time = this.clock.getElapsedTime();
      const deltaTime = Math.min(this.clock.getDelta(), 0.1); // cap spikes

      // 1. Smoothly interpolate camera yaw/pitch for floaty sea currents look
      this.curYaw += (this.targetYaw - this.curYaw) * 3 * deltaTime;
      this.curPitch += (this.targetPitch - this.curPitch) * 3 * deltaTime;

      this.camera.rotation.set(0, 0, 0); // reset
      this.camera.rotation.y = this.curYaw;
      this.camera.rotation.x = this.curPitch;

      // 2. Simulate Caustics: Oscillate sunlight color/intensity with rapid wave patterns
      const causticOsc = Math.sin(time * 3.5) * Math.cos(time * 2.0) * 0.15 + 0.85;
      const sunLight = this.scene.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;
      if (sunLight) {
        // Only trigger caustic light shafts in photic layers
        const factor = Math.max(0, 1 - this.currentDepth / 250);
        sunLight.intensity = 1.3 * causticOsc * factor;
      }

      // 3. Update procedurals (seabed, sways, bubbles)
      this.underwaterWorld.update(time, deltaTime);

      // Obtain camera forward looking vector
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.underwaterWorld.updateDepthLayer(this.currentDepth, this.camera.position, cameraDir);

      // 4. Update individual marine animal agents
      this.animals.forEach(animal => {
        animal.update(deltaTime);
      });

      // 5. Fire frame rendering
      this.renderer.render(this.scene, this.camera);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    this.isDestroyed = true;
    window.removeEventListener("resize", this.handleResize);
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.container.innerHTML = ""; // purge elements
    
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
