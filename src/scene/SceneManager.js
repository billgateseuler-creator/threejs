import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    
    this.cannonModel = null;
    this.cloudModel = null;
    this.cannonPosition = { x: -10 };
    this.cannonAngle = 45; // Default cannon angle
    
    this.ground = null;
  }

  async loadAssets() {
    try {
      // Load ground texture
      const groundTexture = await this.loadTexture('./Ground.jpeg');
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(10, 10);
      
      // Create ground
      this.createGround(groundTexture);
      
      // Load 3D models
      await Promise.all([
        this.loadCannon(),
        this.loadCloud()
      ]);
      
      console.log('All assets loaded successfully');
    } catch (error) {
      console.error('Error loading assets:', error);
      throw error;
    }
  }

  loadTexture(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        resolve,
        undefined,
        reject
      );
    });
  }

  createGround(texture) {
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      map: texture,
      side: THREE.DoubleSide
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    
    this.scene.add(this.ground);
  }

  loadCannon() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        './cannon.glb',
        (gltf) => {
          this.cannonModel = gltf.scene;
          this.cannonModel.scale.set(0.009, 0.009, 0.009);
          this.cannonModel.position.set(this.cannonPosition.x, 0.1, 0);
          
          // Enable shadows
          this.cannonModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          this.scene.add(this.cannonModel);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  loadCloud() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        './cloud.glb',
        (gltf) => {
          this.cloudModel = gltf.scene;
          this.cloudModel.scale.set(3, 3, 3);
          this.cloudModel.position.set(5, 15, -10);
          
          // Make clouds slightly transparent
          this.cloudModel.traverse((child) => {
            if (child.isMesh) {
              child.material.transparent = true;
              child.material.opacity = 0.8;
            }
          });
          
          this.scene.add(this.cloudModel);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  updateCannonPosition() {
    if (this.cannonModel) {
      this.cannonModel.position.x = this.cannonPosition.x;
    }
  }

  updateCannonAngle() {
    if (this.cannonModel) {
      this.cannonModel.traverse((child) => {
        if (child.name && child.name.includes("Cylinder")) {
          child.rotation.z = THREE.MathUtils.degToRad(this.cannonAngle / 2.9);
        }
      });
    }
  }

  getCannonPosition() {
    // Calculate barrel end position based on angle
    const angleRad = THREE.MathUtils.degToRad(this.cannonAngle);
    const barrelLength = 2.5; // Increased barrel length for small cannon scale
    
    const barrelEndX = this.cannonPosition.x + Math.cos(angleRad) * barrelLength;
    const barrelEndY = 0.5 + Math.sin(angleRad) * barrelLength; // Adjusted base height
    
    return new THREE.Vector3(barrelEndX, barrelEndY, 0);
  }
}