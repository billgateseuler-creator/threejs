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
          this.cannonModel.scale.set(2, 2, 2);
          this.cannonModel.position.set(this.cannonPosition.x, 0, 0);
          
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

  getCannonPosition() {
    return new THREE.Vector3(this.cannonPosition.x, 1, 0);
  }
}