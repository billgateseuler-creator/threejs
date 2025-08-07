import * as THREE from 'three';

export class PhysicsEngine {
  constructor() {
    this.parameters = {
      initialSpeed: 25,
      mass: 1,
      gravity: 9.8,
      airResistance: 0.47,
      restitution: 0.8
    };
    
    this.presets = {
      football: {
        mass: 0.41,
        airResistance: 0.47,
        restitution: 0.6,
        initialSpeed: 25
      },
      basketball: {
        mass: 0.62,
        airResistance: 0.47,
        restitution: 0.85,
        initialSpeed: 20
      },
      tennis: {
        mass: 0.057,
        airResistance: 0.47,
        restitution: 0.75,
        initialSpeed: 30
      },
      bowling: {
        mass: 7.26,
        airResistance: 0.47,
        restitution: 0.2,
        initialSpeed: 15
      },
      custom: {
        mass: 1,
        airResistance: 0.47,
        restitution: 0.8,
        initialSpeed: 25
      }
    };
  }

  setPreset(presetName) {
    if (this.presets[presetName]) {
      Object.assign(this.parameters, this.presets[presetName]);
    }
  }

  calculateInitialVelocity(launchAngle) {
    const angleRad = (launchAngle * Math.PI) / 180;
    const speed = this.parameters.initialSpeed;
    
    return new THREE.Vector3(
      speed * Math.cos(angleRad),
      speed * Math.sin(angleRad),
      0
    );
  }

  updateProjectile(projectile, deltaTime) {
    const { position, velocity } = projectile;
    const { mass, gravity, airResistance } = this.parameters;
    
    // Calculate air resistance force
    const speed = velocity.length();
    const dragForce = new THREE.Vector3()
      .copy(velocity)
      .normalize()
      .multiplyScalar(-0.5 * airResistance * speed * speed / mass);
    
    // Apply forces
    const acceleration = new THREE.Vector3(
      dragForce.x,
      -gravity + dragForce.y,
      dragForce.z
    );
    
    // Update velocity and position using Euler integration
    velocity.add(acceleration.clone().multiplyScalar(deltaTime));
    position.add(velocity.clone().multiplyScalar(deltaTime));
    
    // Ground collision detection
    if (position.y <= 0.5) { // Assuming projectile radius of 0.5
      position.y = 0.5;
      
      // Apply restitution to vertical velocity
      if (velocity.y < 0) {
        velocity.y *= -this.parameters.restitution;
        
        // Apply friction to horizontal velocity
        velocity.x *= 0.8;
        velocity.z *= 0.8;
        
        // Stop very small bounces
        if (Math.abs(velocity.y) < 0.5) {
          velocity.y = 0;
        }
      }
    }
    
    // Check if projectile has stopped
    const isMoving = velocity.length() > 0.1 || position.y > 0.25;
    return isMoving;
  }

  calculateTrajectoryPoints(startPosition, launchAngle, numPoints = 100) {
    const points = [];
    const initialVel = this.calculateInitialVelocity(launchAngle);
    
    let pos = startPosition.clone();
    let vel = initialVel.clone();
    const dt = 0.05;
    
    for (let i = 0; i < numPoints; i++) {
      points.push(pos.clone());
      
      // Simple trajectory calculation (without air resistance for preview)
      vel.y -= this.parameters.gravity * dt;
      pos.add(vel.clone().multiplyScalar(dt));
      
      if (pos.y <= 0) break;
    }
    
    return points;
  }
}