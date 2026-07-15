import * as THREE from "three";

export class UnderwaterWorld {
  private scene: THREE.Scene;
  private seabedMesh!: THREE.Mesh;
  private kelpStrands: { mesh: THREE.Object3D; initialRotation: number; x: number; z: number; height: number }[] = [];
  private bubbleParticles!: THREE.Points;
  private bubbleCount = 180;
  private bubblePositions!: Float32Array;
  private bubbleSpeeds: number[] = [];

  // Lighting nodes for dynamic depth transitions
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private searchlightLeft!: THREE.SpotLight;
  private searchlightRight!: THREE.SpotLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.setupLights();
    this.buildSeabed();
    this.spawnKelpForest();
    this.spawnBubbleParticles();
  }

  private setupLights(): void {
    // Soft environmental blue-green ambient light
    this.ambientLight = new THREE.AmbientLight(0x0e7490, 0.6);
    this.scene.add(this.ambientLight);

    // Dynamic solar shaft light
    this.directionalLight = new THREE.DirectionalLight(0x22d3ee, 1.2);
    this.directionalLight.position.set(10, 40, 10);
    this.scene.add(this.directionalLight);

    // Create dual spotlights simulating the research submersible's front high-beams
    this.searchlightLeft = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 6, 0.5, 1);
    this.searchlightLeft.position.set(-3, 0, 0);
    this.scene.add(this.searchlightLeft);

    this.searchlightRight = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 6, 0.5, 1);
    this.searchlightRight.position.set(3, 0, 0);
    this.scene.add(this.searchlightRight);

    // Spotlights target standard direction helpers
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(-3, 0, -30);
    this.scene.add(leftTarget);
    this.searchlightLeft.target = leftTarget;

    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(3, 0, -30);
    this.scene.add(rightTarget);
    this.searchlightRight.target = rightTarget;
  }

  private buildSeabed(): void {
    // Large grid plane for ocean bed
    const width = 250;
    const height = 250;
    const segments = 48;
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    
    // Deform vertices with double sine waves to simulate oceanic sand ripples and ridges
    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      
      // Multi-octave sand dune noise
      const z = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3.5 + 
                Math.sin(x * 0.15) * Math.sin(y * 0.1) * 0.8;
      
      posAttr.setZ(i, z);
    }
    geometry.computeVertexNormals();

    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0x115e59, // Dark Teal / Sand
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    this.seabedMesh = new THREE.Mesh(geometry, sandMaterial);
    this.seabedMesh.rotation.x = -Math.PI / 2;
    this.seabedMesh.position.y = -22; // lower depth
    this.scene.add(this.seabedMesh);
  }

  private spawnKelpForest(): void {
    // Generate individual kelp plants on the seabed
    const kelpMaterial = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Forest dark green
      roughness: 0.7,
      flatShading: true,
      side: THREE.DoubleSide
    });

    for (let count = 0; count < 110; count++) {
      // Place kelp clusters in specific sandy fields
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      
      // Only grow within bounding sector
      if (Math.sqrt(x*x + z*z) < 15) continue; // clear central submersible zone

      const height = 5 + Math.random() * 15;
      const segments = Math.floor(height / 1.5);
      
      // Assemble kelp stalk using stack of cylinder links
      const stalkGroup = new THREE.Group();
      let currentY = -22; // seabed position

      for (let s = 0; s < segments; s++) {
        const linkRadius = 0.2 * (1 - s / segments);
        const linkGeom = new THREE.CylinderGeometry(linkRadius, linkRadius + 0.05, 1.5, 5);
        const link = new THREE.Mesh(linkGeom, kelpMaterial);
        link.position.set(0, 0.75, 0);

        // Nested pivot group for beautiful cumulative sine-wave sway
        const pivot = new THREE.Group();
        pivot.position.set(0, s === 0 ? 0 : 1.5, 0);
        pivot.add(link);
        
        if (s === 0) {
          stalkGroup.position.set(x, -22, z);
          this.scene.add(stalkGroup);
          stalkGroup.add(pivot);
        } else {
          // Find deep leaf to stack
          let leaf: THREE.Object3D = stalkGroup;
          while (leaf.children.length > 0 && leaf.children[0] instanceof THREE.Group) {
            leaf = leaf.children[0];
          }
          leaf.add(pivot);
        }
      }

      this.kelpStrands.push({
        mesh: stalkGroup,
        initialRotation: Math.random() * Math.PI,
        x,
        z,
        height
      });
    }
  }

  private spawnBubbleParticles(): void {
    const geometry = new THREE.BufferGeometry();
    this.bubblePositions = new Float32Array(this.bubbleCount * 3);

    for (let i = 0; i < this.bubbleCount; i++) {
      // Spawn bubbles scattered in space
      this.bubblePositions[i * 3] = (Math.random() - 0.5) * 100;      // X
      this.bubblePositions[i * 3 + 1] = -22 + Math.random() * 45;    // Y (seabed upwards)
      this.bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;  // Z

      this.bubbleSpeeds.push(1.5 + Math.random() * 3.5);
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(this.bubblePositions, 3));

    // Material with transparent round dots
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      gradient.addColorStop(0.3, "rgba(165, 243, 252, 0.6)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const bubbleMat = new THREE.PointsMaterial({
      size: 0.5,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.bubbleParticles = new THREE.Points(geometry, bubbleMat);
    this.scene.add(this.bubbleParticles);
  }

  public update(time: number, deltaTime: number): void {
    // 1. Sway kelp forest recursively
    const swaySpeed = 1.2;
    this.kelpStrands.forEach((kelp) => {
      const angle = Math.sin(time * swaySpeed + kelp.initialRotation) * 0.08;
      
      // Apply sway angle on nested links down the stalk chain
      let pivot: THREE.Object3D | undefined = kelp.mesh.children[0];
      while (pivot && pivot instanceof THREE.Group) {
        pivot.rotation.z = angle;
        pivot.rotation.x = angle * 0.5;
        pivot = pivot.children[1]; // traverse to nested pivot
      }
    });

    // 2. Animate rise of bubble particles
    const positions = this.bubbleParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.bubbleCount; i++) {
      positions[i * 3 + 1] += this.bubbleSpeeds[i] * deltaTime; // rise Y

      // Respawn at seabed when floating above limits
      if (positions[i * 3 + 1] > 25) {
        positions[i * 3 + 1] = -22;
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      }
    }
    this.bubbleParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Adapts lighting, fog densities, and submersible high-beams based on underwater depth layer.
   * - Photic Zone: 0m to 150m (Sunlit cyan fog, no headlight)
   * - Twilight Zone: 150m to 800m (Deep navy blue fog, soft light extinction)
   * - Abyssal Zone: 800m+ (Pitch black fog, headlights fully active to pierce darkness)
   */
  public updateDepthLayer(depth: number, cameraPosition: THREE.Vector3, cameraDirection: THREE.Vector3): void {
    let fogColor = 0x0e7490; // Photic cyan
    let fogDensity = 0.02;
    let solarIntensity = 1.2;
    let ambientIntensity = 0.6;
    let headlightIntensity = 0.0;

    if (depth <= 150) {
      // Photic Zone
      const ratio = depth / 150;
      fogColor = this.interpolateColor(0x0e7490, 0x0f172a, ratio);
      fogDensity = 0.015 + ratio * 0.015;
      solarIntensity = 1.2 * (1 - ratio * 0.8);
      ambientIntensity = 0.6 * (1 - ratio * 0.5);
      headlightIntensity = 0.0;
    } else if (depth > 150 && depth <= 800) {
      // Twilight Zone
      const ratio = (depth - 150) / (800 - 150);
      fogColor = this.interpolateColor(0x0f172a, 0x030712, ratio);
      fogDensity = 0.03 + ratio * 0.025;
      solarIntensity = 0.24 * (1 - ratio);
      ambientIntensity = 0.3 * (1 - ratio * 0.8);
      headlightIntensity = ratio * 4.0; // headlights start turning on
    } else {
      // Abyssal Zone
      fogColor = 0x020617; // Midnight dark
      fogDensity = 0.055;
      solarIntensity = 0.0;
      ambientIntensity = 0.05;
      headlightIntensity = 6.0; // peak spotlight intensity
    }

    // Apply color and densities
    this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    this.scene.background = new THREE.Color(fogColor);

    this.ambientLight.intensity = ambientIntensity;
    this.directionalLight.intensity = solarIntensity;
    
    // Position submersible headlights relative to active camera
    this.searchlightLeft.position.copy(cameraPosition).addScaledVector(cameraDirection, 0.5);
    this.searchlightRight.position.copy(cameraPosition).addScaledVector(cameraDirection, 0.5);
    this.searchlightLeft.intensity = headlightIntensity;
    this.searchlightRight.intensity = headlightIntensity;

    // Direct headlight targets forward
    const targetDist = 40;
    const forwardLeft = cameraDirection.clone().multiplyScalar(targetDist).add(cameraPosition);
    const forwardRight = cameraDirection.clone().multiplyScalar(targetDist).add(cameraPosition);
    this.searchlightLeft.target.position.copy(forwardLeft);
    this.searchlightRight.target.position.copy(forwardRight);
  }

  private interpolateColor(c1: number, c2: number, ratio: number): number {
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;

    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
  }
}
