import * as THREE from 'three';

export class ProjectileManager {
  constructor(scene, physicsEngine, audioManager) {
    this.scene = scene;
    this.physicsEngine = physicsEngine;
    this.audioManager = audioManager;
    
    this.projectiles = [];
    this.trails = [];
    this.maxProjectiles = 5;
    this.maxTrailPoints = 200;
  }

  launch(startPosition, launchAngle) {
    // Play launch sound
    this.audioManager.playLaunchSound();
    
    // Start wind sound
    this.audioManager.startWindSound();
    
    // Create projectile
    const projectile = this.createProjectile(startPosition, launchAngle);
    
    // Remove oldest projectile if we have too many
    if (this.projectiles.length >= this.maxProjectiles) {
      this.removeOldestProjectile();
    }
    
    this.projectiles.push(projectile);
    
    // Create trail for this projectile
    const trail = this.createTrail();
    this.trails.push(trail);
  }

  createProjectile(startPosition, launchAngle) {
    // Create sphere geometry for projectile
    const geometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xff4444,
      shininess: 100,
      specular: 0x222222
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(startPosition);
    mesh.castShadow = true;
    
    this.scene.add(mesh);
    
    return {
      mesh,
      position: startPosition.clone(),
      velocity: this.physicsEngine.calculateInitialVelocity(launchAngle),
      isActive: true,
      trailPoints: []
    };
  }

  createTrail() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff6666,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    
    const positions = new Float32Array(this.maxTrailPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    
    return {
      line,
      points: [],
      geometry
    };
  }

  update(deltaTime) {
    let anyProjectileMoving = false;
    
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      const trail = this.trails[i];
      
      if (projectile.isActive) {
        const isMoving = this.physicsEngine.updateProjectile(projectile, deltaTime);
        
        // Update mesh position
        projectile.mesh.position.copy(projectile.position);
        
        // Add point to trail
        this.updateTrail(trail, projectile.position.clone());
        
        if (isMoving) {
          anyProjectileMoving = true;
        } else {
          projectile.isActive = false;
        }
      }
    }
    
    // Stop wind sound if no projectiles are moving
    if (!anyProjectileMoving) {
      this.audioManager.stopWindSound();
    }
    
    return anyProjectileMoving;
  }

  updateTrail(trail, newPoint) {
    trail.points.push(newPoint);
    
    // Limit trail length
    if (trail.points.length > this.maxTrailPoints) {
      trail.points.shift();
    }
    
    // Update geometry
    const positions = trail.geometry.attributes.position.array;
    for (let i = 0; i < trail.points.length; i++) {
      const point = trail.points[i];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    trail.geometry.setDrawRange(0, trail.points.length);
    trail.geometry.attributes.position.needsUpdate = true;
  }

  removeOldestProjectile() {
    if (this.projectiles.length > 0) {
      const oldProjectile = this.projectiles.shift();
      const oldTrail = this.trails.shift();
      
      this.scene.remove(oldProjectile.mesh);
      this.scene.remove(oldTrail.line);
      
      // Dispose of geometries and materials
      oldProjectile.mesh.geometry.dispose();
      oldProjectile.mesh.material.dispose();
      oldTrail.geometry.dispose();
      oldTrail.line.material.dispose();
    }
  }

  clearTrails() {
    // Clear all trail points but keep the lines
    this.trails.forEach(trail => {
      trail.points = [];
      trail.geometry.setDrawRange(0, 0);
      trail.geometry.attributes.position.needsUpdate = true;
    });
  }

  reset() {
    // Remove all projectiles and trails
    while (this.projectiles.length > 0) {
      this.removeOldestProjectile();
    }
    
    // Stop wind sound
    this.audioManager.stopWindSound();
  }
}