import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { SceneManager } from './scene/SceneManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { ProjectileManager } from './projectile/ProjectileManager.js';

class ProjectileSimulator {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.gui = new GUI();
    
    // Managers
    this.sceneManager = new SceneManager(this.scene);
    this.physicsEngine = new PhysicsEngine();
    this.audioManager = new AudioManager();
    this.projectileManager = new ProjectileManager(this.scene, this.physicsEngine, this.audioManager);
    
    // Animation
    this.clock = new THREE.Clock();
    this.isAnimating = false;
    
    this.init();
  }

  async init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();
    
    try {
      await this.sceneManager.loadAssets();
      await this.audioManager.loadAudio();
      
      this.setupGUI();
      this.setupEventListeners();
      this.hideLoading();
      this.animate();
    } catch (error) {
      console.error('Failed to initialize simulator:', error);
      document.getElementById('loading').textContent = 'Failed to load assets. Please refresh.';
    }
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB); // Sky blue
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('app').appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera.position.set(15, 8, 15);
    this.camera.lookAt(0, 0, 0);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    this.scene.add(directionalLight);
  }

  setupGUI() {
    this.gui.title('🎯 Projectile Motion Controls');
    
    // Cannon controls
    const cannonFolder = this.gui.addFolder('🔫 Cannon');
    cannonFolder.add(this.sceneManager.cannonPosition, 'x', -15, 15, 0.1)
      .name('Position X')
      .onChange(() => this.sceneManager.updateCannonPosition());
    cannonFolder.add(this.sceneManager, 'cannonAngle', 0, 90, 1)
      .name('Barrel Angle (°)')
      .onChange(() => this.sceneManager.updateCannonAngle());
    
    // Physics parameters
    const physicsFolder = this.gui.addFolder('⚡ Physics Parameters');
    const params = this.physicsEngine.parameters;
    
    physicsFolder.add(params, 'mass', 0.1, 10, 0.1).name('Mass (kg)');
    physicsFolder.add(params, 'gravity', 1, 20, 0.1).name('Gravity (m/s²)');
    physicsFolder.add(params, 'airResistance', 0, 2, 0.01).name('Air Resistance');
    physicsFolder.add(params, 'restitution', 0, 1, 0.05).name('Bounce Factor');
    
    // Projectile presets
    const presetsFolder = this.gui.addFolder('🏀 Projectile Presets');
    const presets = {
      'Football': () => this.physicsEngine.setPreset('football'),
      'Basketball': () => this.physicsEngine.setPreset('basketball'),
      'Tennis Ball': () => this.physicsEngine.setPreset('tennis'),
      'Bowling Ball': () => this.physicsEngine.setPreset('bowling'),
      'Custom': () => this.physicsEngine.setPreset('custom')
    };
    
    Object.entries(presets).forEach(([name, action]) => {
      presetsFolder.add({ action }, 'action').name(name);
    });
    
    // Controls
    const controlsFolder = this.gui.addFolder('🎮 Controls');
    controlsFolder.add({ launch: () => this.launch() }, 'launch').name('🚀 Launch!');
    controlsFolder.add({ reset: () => this.reset() }, 'reset').name('🔄 Reset Scene');
    controlsFolder.add({ clearTrails: () => this.projectileManager.clearTrails() }, 'clearTrails').name('🧹 Clear Trails');
    
    // Open important folders by default
    cannonFolder.open();
    physicsFolder.open();
    controlsFolder.open();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'Space':
          event.preventDefault();
          this.launch();
          break;
        case 'KeyR':
          this.reset();
          break;
        case 'KeyC':
          this.projectileManager.clearTrails();
          break;
      }
    });
  }

  launch() {
    if (this.isAnimating) return;
    
    // Get cannon position and angle
    const cannonPos = this.sceneManager.getCannonPosition();
    const cannonAngle = this.sceneManager.cannonAngle;
    
    // Launch projectile from barrel tip with cannon's angle
    this.projectileManager.launch(cannonPos, cannonAngle);
    this.isAnimating = true;
  }

  reset() {
    this.projectileManager.reset();
    this.isAnimating = false;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('info-panel').style.display = 'block';
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    if (this.isAnimating) {
      const stillMoving = this.projectileManager.update(deltaTime);
      if (!stillMoving) {
        this.isAnimating = false;
      }
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the simulator
new ProjectileSimulator();