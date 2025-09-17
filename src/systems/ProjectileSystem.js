import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.maxProjectiles = 500; // Performance limit
        this.projectileLifetime = 1000; // frames
    }
    
    update(deltaTime, player, audioManager) {
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!this.updateProjectile(projectile, deltaTime, player, audioManager)) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Enforce projectile limit
        if (this.projectiles.length > this.maxProjectiles) {
            // Remove oldest projectiles
            const toRemove = this.projectiles.length - this.maxProjectiles;
            this.projectiles.splice(0, toRemove);
        }
    }
    
    updateProjectile(projectile, deltaTime, player, audioManager) {
        projectile.life--;
        
        // Remove if lifetime expired
        if (projectile.life <= 0) {
            return false;
        }
        
        // Apply DNA-based behaviors
        this.applyDNABehaviors(projectile, player, audioManager);
        
        // Update position
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // Update visual properties
        projectile.rotation += projectile.rotationSpeed;
        
        // Handle audio reactivity
        if (projectile.isBeatSynced && audioManager) {
            const beatStrength = audioManager.getBeatStrength();
            projectile.scale = 1.0 + (beatStrength * 0.3);
        }
        
        if (projectile.isFrequencyReactive && audioManager) {
            projectile.glowRadius = audioManager.currentAmplitude * 15;
        }
        
        return true;
    }
    
    applyDNABehaviors(projectile, player, audioManager) {
        // Homing behavior
        if (projectile.trajectory === 'homing' && projectile.stateTime % 15 === 0) {
            this.applyHomingBehavior(projectile, player);
        }
        
        // Spiral trajectory
        if (projectile.trajectory === 'spiral') {
            this.applySpiralTrajectory(projectile);
        }
        
        // Zigzag pattern
        if (projectile.trajectory === 'zigzag') {
            this.applyZigzagTrajectory(projectile);
        }
        
        // Apply mutations
        this.applyMutationBehaviors(projectile, audioManager);
        
        projectile.stateTime++;
    }
    
    applyHomingBehavior(projectile, player) {
        if (!player.isAlive) return;
        
        const spherePositions = player.getSpherePositions();
        const targetSphere = spherePositions[0]; // Target first sphere
        
        const dx = targetSphere.x - projectile.x;
        const dy = targetSphere.y - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const homingStrength = 0.1; // How strongly it homes
            const targetVx = (dx / distance) * projectile.speed;
            const targetVy = (dy / distance) * projectile.speed;
            
            projectile.vx = MathUtils.lerp(projectile.vx, targetVx, homingStrength);
            projectile.vy = MathUtils.lerp(projectile.vy, targetVy, homingStrength);
        }
    }
    
    applySpiralTrajectory(projectile) {
        const spiralStrength = 0.02;
        const angle = Math.atan2(projectile.vy, projectile.vx) + spiralStrength;
        const speed = Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
        
        projectile.vx = Math.cos(angle) * speed;
        projectile.vy = Math.sin(angle) * speed;
    }
    
    applyZigzagTrajectory(projectile) {
        const zigzagFrequency = 0.1;
        const zigzagAmplitude = 1.0;
        
        // Add perpendicular velocity component
        const perpAngle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;
        const zigzagOffset = Math.sin(projectile.stateTime * zigzagFrequency) * zigzagAmplitude;
        
        projectile.vx += Math.cos(perpAngle) * zigzagOffset;
        projectile.vy += Math.sin(perpAngle) * zigzagOffset;
    }
    
    applyMutationBehaviors(projectile, audioManager) {
        if (!projectile.mutations || projectile.mutations.size === 0) return;
        
        for (const mutation of projectile.mutations) {
            switch (mutation) {
                case 'size_boost':
                    projectile.size = Math.min(projectile.size * 1.001, 60);
                    break;
                    
                case 'speed_boost':
                    const speedMultiplier = 1.002;
                    projectile.vx *= speedMultiplier;
                    projectile.vy *= speedMultiplier;
                    break;
                    
                case 'splitting':
                    if (projectile.stateTime === 300 && Math.random() < 0.3) {
                        this.splitProjectile(projectile);
                    }
                    break;
                    
                case 'phase':
                    // Phasing projectiles ignore some collisions
                    projectile.isPhasing = true;
                    break;
                    
                case 'electric':
                    this.applyElectricEffect(projectile, audioManager);
                    break;
                    
                case 'fire_trail':
                    this.applyFireTrail(projectile);
                    break;
            }
        }
    }
    
    splitProjectile(projectile) {
        const splitCount = 2 + Math.floor(Math.random() * 2);
        const angleStep = (Math.PI * 2) / splitCount;
        
        for (let i = 0; i < splitCount; i++) {
            const angle = i * angleStep;
            const speed = projectile.speed * 0.7;
            
            const newProjectile = {
                ...projectile,
                x: projectile.x,
                y: projectile.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: projectile.size * 0.8,
                life: 400,
                stateTime: 0,
                mutations: new Set([...projectile.mutations].filter(m => m !== 'splitting'))
            };
            
            this.projectiles.push(newProjectile);
        }
        
        // Mark original for removal
        projectile.life = 0;
    }
    
    applyElectricEffect(projectile, audioManager) {
        // Electric projectiles create lightning between nearby projectiles
        if (projectile.stateTime % 30 === 0 && audioManager) {
            projectile.electricIntensity = audioManager.currentHighs * 2;
        }
    }
    
    applyFireTrail(projectile) {
        // Fire trail creates particle effects
        if (projectile.stateTime % 5 === 0) {
            projectile.fireTrailIntensity = 1.0 + Math.random() * 0.5;
        }
    }
    
    addProjectile(projectile) {
        // Add initial projectile properties
        projectile.stateTime = 0;
        projectile.scale = 1.0;
        projectile.glowRadius = 0;
        projectile.electricIntensity = 0;
        projectile.fireTrailIntensity = 0;
        projectile.isPhasing = false;
        
        this.projectiles.push(projectile);
    }
    
    removeProjectiles(projectilesToRemove) {
        for (const projectile of projectilesToRemove) {
            const index = this.projectiles.indexOf(projectile);
            if (index !== -1) {
                this.projectiles.splice(index, 1);
            }
        }
    }
    
    getProjectiles() {
        return this.projectiles;
    }
    
    getProjectileCount() {
        return this.projectiles.length;
    }
    
    // Performance optimization - spatial culling
    getVisibleProjectiles(viewBounds) {
        return this.projectiles.filter(projectile => {
            return projectile.x >= viewBounds.left - 50 &&
                   projectile.x <= viewBounds.right + 50 &&
                   projectile.y >= viewBounds.top - 50 &&
                   projectile.y <= viewBounds.bottom + 50;
        });
    }
    
    // Clear all projectiles (for restart)
    clear() {
        this.projectiles = [];
    }
    
    // Get statistics
    getStats() {
        const mutationCounts = {};
        let totalMutations = 0;
        
        for (const projectile of this.projectiles) {
            if (projectile.mutations) {
                for (const mutation of projectile.mutations) {
                    mutationCounts[mutation] = (mutationCounts[mutation] || 0) + 1;
                    totalMutations++;
                }
            }
        }
        
        return {
            totalProjectiles: this.projectiles.length,
            totalMutations,
            mutationBreakdown: mutationCounts,
            averageMutationsPerProjectile: totalMutations / Math.max(this.projectiles.length, 1)
        };
    }
}