import { CONFIG } from '../../utils/Config.js';
import { MathUtils } from '../../utils/MathUtils.js';
import { ShapeDNA } from './ShapeDNA.js';

export class BaseShape {
    constructor(x, y, dna = null) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.targetX = 0;
        this.targetY = 0;
        this.vx = 0;
        this.vy = 0;
        
        // DNA and traits
        this.dna = dna || new ShapeDNA();
        this.applyDNATraits();
        
        // State machine
        this.state = 'aiming';
        this.stateTime = 0;
        this.aimDuration = 60 + Math.random() * 60; // 1-2 seconds
        
        // Combat properties
        this.hasReattacked = false;
        this.wallHitCount = 0;
        this.life = 1000; // Default life
        
        // Reduce life for homing shapes - they should die quickly
        if (this.trajectory === 'homing') {
            this.life = 660; // 6 seconds at 60fps instead of 16+ seconds
        }
        
        // Visual properties
        this.rotation = Math.random() * Math.PI * 2;
        this.scale = 1.0;
        this.opacity = 1.0;
        this.glowRadius = 0;
        
        // Audio reactivity
        this.lastBeatTime = 0;
        this.beatPhase = 0;
        
        this.shapeType = 'base'; // Override in subclasses
    }
    
    applyDNATraits() {
        this.speed = this.dna.traits.get('speed');
        this.rotationSpeed = this.dna.traits.get('rotationSpeed');
        this.size = this.dna.traits.get('size');
        this.trajectory = this.dna.traits.get('trajectory');
        this.canReattack = this.dna.traits.get('canReattack');
        this.canSplit = this.dna.traits.get('splitOnDeath');
        this.splitCount = this.dna.traits.get('splitCount');
        this.canBounce = this.dna.traits.get('wallBounce');
        this.isBeatSynced = this.dna.traits.get('beatSync');
        this.isFrequencyReactive = this.dna.traits.get('frequencyReactive');
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        this.stateTime++;
        this.life--;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Handle audio reactivity
        this.updateAudioEffects(audioManager);
        
        // State machine
        switch (this.state) {
            case 'aiming':
                this.updateAiming(orbitPlayer);
                break;
            case 'firing':
                this.updateFiring();
                break;
            case 'reattacking':
                this.updateReattack(orbitPlayer);
                break;
            case 'dying':
                this.updateDying();
                break;
        }
        
        // Check for wall proximity (reattack behavior)
        if (this.state === 'firing' && this.canReattack && !this.hasReattacked) {
            if (this.isNearWall()) {
                this.initiateReattack(orbitPlayer);
            }
        }
        
        return this.life > 0 && this.opacity > 0;
    }
    
    updateAiming(orbitPlayer) {
        // Calculate target based on trajectory DNA trait
        this.calculateTarget(orbitPlayer);
        
        // Fire when aim duration is reached
        if (this.stateTime >= this.aimDuration) {
            this.fire();
        }
    }
    
    calculateTarget(orbitPlayer) {
        const centerX = orbitPlayer.centerX;
        const centerY = orbitPlayer.centerY;
        const orbitRadius = orbitPlayer.orbitRadius;
        
        switch (this.trajectory) {
            case 'straight':
                this.targetX = centerX;
                this.targetY = centerY;
                break;
                
            case 'curved':
                // Aim ahead of player movement
                const predictTime = 30;
                const playerAngle = orbitPlayer.angle + (orbitPlayer.rotationSpeed * predictTime);
                this.targetX = centerX + Math.cos(playerAngle) * orbitRadius;
                this.targetY = centerY + Math.sin(playerAngle) * orbitRadius;
                break;
                
            case 'spiral':
                // Aim with spiral offset
                const spiralOffset = this.stateTime * 0.05;
                this.targetX = centerX + Math.cos(spiralOffset) * orbitRadius * 0.5;
                this.targetY = centerY + Math.sin(spiralOffset) * orbitRadius * 0.5;
                break;
                
            case 'zigzag':
                // Zigzag pattern targeting
                const zigzag = Math.sin(this.stateTime * 0.1) * orbitRadius;
                this.targetX = centerX + zigzag;
                this.targetY = centerY;
                break;
                
            case 'homing':
                // Direct homing to current player position
                const currentPlayerX = centerX + Math.cos(orbitPlayer.angle) * orbitRadius;
                const currentPlayerY = centerY + Math.sin(orbitPlayer.angle) * orbitRadius;
                this.targetX = currentPlayerX;
                this.targetY = currentPlayerY;
                break;
        }
    }
    
    fire() {
        this.state = 'firing';
        this.stateTime = 0;
        
        // Calculate velocity toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = MathUtils.vectorLength(dx, dy);
        
        if (distance > 0) {
            const normalized = MathUtils.normalizeVector(dx, dy);
            this.vx = normalized.x * this.speed;
            this.vy = normalized.y * this.speed;
        }
    }
    
    updateFiring() {
        // Move projectile
        this.x += this.vx;
        this.y += this.vy;
    }
    
    isNearWall() {
        const margin = CONFIG.REATTACK.WALL_DISTANCE;
        return (this.x < margin || this.x > window.innerWidth - margin ||
                this.y < margin || this.y > window.innerHeight - margin);
    }
    
    initiateReattack(orbitPlayer) {
        if (!this.canReattack || this.hasReattacked) return;
        
        this.hasReattacked = true;
        this.state = 'reattacking';
        this.stateTime = 0;
        
        // Recalculate velocity toward player
        this.calculateTarget(orbitPlayer);
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = MathUtils.vectorLength(dx, dy);
        
        if (distance > 0) {
            const normalized = MathUtils.normalizeVector(dx, dy);
            this.vx = normalized.x * this.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
            this.vy = normalized.y * this.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
        }
    }
    
    updateReattack(orbitPlayer) {
        // Continue moving toward player
        this.x += this.vx;
        this.y += this.vy;
        
        // Optional: Update targeting for true homing behavior
        if (this.trajectory === 'homing' && this.stateTime % 10 === 0) {
            this.calculateTarget(orbitPlayer);
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = MathUtils.vectorLength(dx, dy);
            
            if (distance > 0) {
                const normalized = MathUtils.normalizeVector(dx, dy);
                this.vx = normalized.x * this.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
                this.vy = normalized.y * this.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
            }
        }
    }
    
    updateAudioEffects(audioManager) {
        if (!audioManager) return;
        
        // Beat synchronization
        if (this.isBeatSynced) {
            const beatStrength = audioManager.getBeatStrength();
            this.scale = 1.0 + (beatStrength * 0.3);
            this.beatPhase = beatStrength;
        }
        
        // Frequency reactivity
        if (this.isFrequencyReactive) {
            this.glowRadius = audioManager.currentAmplitude * 20;
        }
    }
    
    // Handle collision with another shape
    onCollision(otherShape) {
        // This will be handled by the MutationSystem
        this.state = 'dying';
        this.stateTime = 0;
    }
    
    // Split into multiple shapes when dying
    split() {
        if (!this.canSplit) return [];
        
        const offspring = [];
        for (let i = 0; i < this.splitCount; i++) {
            const angle = (i / this.splitCount) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const newX = this.x + Math.cos(angle) * distance;
            const newY = this.y + Math.sin(angle) * distance;
            
            // Create mutated offspring
            const childDNA = new ShapeDNA(this.dna);
            const child = new this.constructor(newX, newY, childDNA);
            child.scale = 0.7; // Smaller offspring
            offspring.push(child);
        }
        
        return offspring;
    }
    
    updateDying() {
        this.opacity -= 0.05;
        this.scale += 0.02;
    }
    
    // Override in subclasses
    render(ctx, audioManager) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;
        
        // Get color from DNA
        const color = this.dna.getColor(audioManager);
        
        // Apply visual effects
        const effects = this.dna.getVisualEffects();
        if (effects.includes('glow') || this.glowRadius > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(10, this.glowRadius);
        }
        
        // Subclasses will implement specific shape rendering
        this.renderShape(ctx, color);
        
        ctx.restore();
    }
    
    // Override this in shape variants
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    }
    
    // Bounds checking
    isOffScreen() {
        const margin = 100;
        return (this.x < -margin || this.x > window.innerWidth + margin ||
                this.y < -margin || this.y > window.innerHeight + margin);
    }
    
    getBounds() {
        return {
            x: this.x - this.size/2,
            y: this.y - this.size/2,
            width: this.size,
            height: this.size
        };
    }
}