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
        this.baseAimDuration = 60 + Math.random() * 60; // Base aim time
        this.aimDuration = this.baseAimDuration;
        
        // Musical reactivity properties
        this.lastBeatTime = 0;
        this.beatSyncOffset = Math.random() * Math.PI * 2;
        this.musicalAggression = 1.0;
        this.panicMode = false;
        this.coordinatedAttack = false;
        
        // Combat properties
        this.hasReattacked = false;
        this.wallHitCount = 0;
        this.life = 1000;
        
        if (this.trajectory === 'homing') {
            this.life = 660;
        }
        
        // Visual properties
        this.rotation = Math.random() * Math.PI * 2;
        this.scale = 1.0;
        this.opacity = 1.0;
        this.glowRadius = 0;
        
        // Audio reactivity
        this.beatPhase = 0;
        
        this.shapeType = 'base';
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
        
        // Musical DNA traits
        this.bassSensitivity = this.dna.traits.get('bassSensitivity') || 0.5;
        this.panicAttackSusceptible = this.dna.traits.get('panicSusceptible') || Math.random() < 0.3;
        this.beatAnticipation = this.dna.traits.get('beatAnticipation') || Math.random() < 0.4;
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        this.stateTime++;
        this.life--;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Handle musical reactivity
        this.updateMusicalBehavior(audioManager);
        
        // State machine
        switch (this.state) {
            case 'aiming':
                this.updateAiming(orbitPlayer, audioManager);
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
    
updateMusicalBehavior(audioManager) {
    if (!audioManager) return;
    
    // Update musical aggression level based on shape type and audio
    this.musicalAggression = audioManager.getFrequencyAggressionLevel(this.shapeType);
    
    // Enhanced size dancing for shapes (more dramatic than player)
    this.updateMusicalSizeReactivity(audioManager);
    
    // Check for panic attack triggers
    if (this.panicAttackSusceptible && audioManager.shouldTriggerPanicAttack()) {
        this.triggerPanicAttack();
    }
    
    // Check for coordinated attack signals
    if (audioManager.shouldTriggerCoordinatedAttack()) {
        this.coordinatedAttack = true;
    }
    
    // Beat synchronization effects
    if (this.isBeatSynced) {
        this.beatPhase = audioManager.getBeatStrength();
        
        // More dramatic beat scaling for shapes
        const beatIntensity = this.beatPhase * this.beatPhase; // Squared for more drama
        this.scale = 0.7 + (beatIntensity * 0.8); // 0.7 to 1.5 range
        
        // Beat anticipation behavior
        if (this.beatAnticipation && this.state === 'aiming') {
            const timeToNextBeat = audioManager.getTimeToNextBeat();
            if (timeToNextBeat < 10 && this.beatPhase < 0.2) {
                this.aimDuration = Math.min(this.aimDuration, timeToNextBeat + 5);
            }
        }
    }
    
    // Frequency reactivity
    if (this.isFrequencyReactive) {
        this.glowRadius = this.musicalAggression * 25; // Increased glow
        
        // Speed modifications based on frequency content
        const speedMod = audioManager.getEnergyBasedSpeedMultiplier();
        this.speed = this.dna.traits.get('speed') * speedMod;
    }
}

updateMusicalSizeReactivity(audioManager) {
    // Get relative audio values (like the player circles)
    const bassIntensity = audioManager.currentBass;
    const recentBassAverage = audioManager.recentBassAverage || 0.3;
    const relativeBass = Math.max(0, bassIntensity - recentBassAverage);
    
    // Different shapes react to different frequency ranges
    let primaryFrequency = relativeBass; // Default to bass
    
    // Shape-specific frequency reactivity
    switch (this.shapeType) {
        case 'triangle':
        case 'hexagon':
        case 'diamond':
        case 'octagon':
        case 'pentagon':
        case 'cross':
        case 'blade':
            // Geometric shapes react strongly to bass
            primaryFrequency = relativeBass * 1.5;
            break;
            
        case 'spiral':
        case 'flower':
        case 'wave':
        case 'comet':
        case 'boomerang':
            // Organic shapes react to mids
            const relativeMids = Math.max(0, audioManager.currentMids - 0.3);
            primaryFrequency = relativeMids * 1.3;
            break;
            
        case 'lightning':
        case 'star':
        case 'crystal':
        case 'plasma':
            // Energy shapes react to highs
            const relativeHighs = Math.max(0, audioManager.currentHighs - 0.25);
            primaryFrequency = relativeHighs * 1.2;
            break;
            
        case 'gear':
        case 'spinner':
        case 'vortex':
        case 'arrow':
            // Mechanical shapes react to full spectrum but more dramatically
            primaryFrequency = (relativeBass + audioManager.currentMids + audioManager.currentHighs) * 0.6;
            break;
    }
    
    // Base size from DNA
    const originalSize = this.dna.traits.get('size');
    const minSizeMultiplier = 0.6; // Can shrink to 60% of original
    const maxSizeMultiplier = 1.8; // Can grow to 180% of original
    
    // Calculate target size based on musical reactivity
    let sizeMultiplier = 1.0; // Start at original size
    
    // Primary frequency effect (main dancing)
    sizeMultiplier += primaryFrequency * 0.8;
    
    // Beat pulsing (more dramatic for shapes)
    const beatStrength = audioManager.getBeatStrength();
    const beatPulse = beatStrength * beatStrength * 0.4; // Squared for drama
    sizeMultiplier += beatPulse;
    
    // Bass spikes cause dramatic size jumps
    if (audioManager.isBassSpikeActive()) {
        const spikeIntensity = audioManager.getBassSpikeIntensity() - recentBassAverage;
        sizeMultiplier += Math.max(0, spikeIntensity * 0.6);
    }
    
    // Energy level provides base scaling
    const energyMultipliers = [0.8, 0.9, 1.0, 1.2, 1.4]; // Calm to chaos
    const energyBase = energyMultipliers[audioManager.energyLevel] || 1.0;
    sizeMultiplier *= energyBase;
    
    // Panic mode makes shapes bigger and more aggressive
    if (this.panicMode) {
        sizeMultiplier *= 1.3;
    }
    
    // Fast smoothing for responsive dancing
    const smoothingFactor = 0.4; // Very responsive
    const targetSize = originalSize * Math.max(minSizeMultiplier, Math.min(maxSizeMultiplier, sizeMultiplier));
    
    // Smooth size transitions
    this.size = this.size + (targetSize - this.size) * smoothingFactor;
    
    // Additional visual effects based on size changes
    if (sizeMultiplier > 1.3) {
        this.glowRadius = Math.max(this.glowRadius, 15); // Force glow on large shapes
    }
}
    
    triggerPanicAttack() {
        if (this.panicMode || this.state === 'firing') return;
        
        console.log(`🚨 Panic Attack: ${this.shapeType} at ${this.x},${this.y}`);
        
        this.panicMode = true;
        this.aimDuration = 1; // Fire almost immediately
        this.speed *= 1.8; // Much faster movement
        this.musicalAggression = 2.0;
        
        // Visual panic indicators
        this.glowRadius = 25;
        this.rotationSpeed *= 2;
    }
    
    updateAiming(orbitPlayer, audioManager) {
        // Calculate dynamic aim duration based on musical factors
        this.calculateMusicalAimDuration(audioManager);
        
        // Calculate target based on trajectory and musical state
        this.calculateTarget(orbitPlayer, audioManager);
        
        // Fire when conditions are met
        if (this.shouldFire(audioManager)) {
            this.fire();
        }
    }
    
    calculateMusicalAimDuration(audioManager) {
        if (!audioManager) {
            this.aimDuration = this.baseAimDuration;
            return;
        }
        
        let modifiedDuration = this.baseAimDuration;
        
        // Panic attack - fire immediately
        if (this.panicMode) {
            this.aimDuration = 1;
            return;
        }
        
        // Bass-driven aggression
        if (this.bassSensitivity > 0.5) {
            const bassReduction = audioManager.currentBass * this.bassSensitivity;
            modifiedDuration *= (1.0 - bassReduction * 0.7);
        }
        
        // Energy level modifications
        const energyMultipliers = [1.2, 1.0, 0.8, 0.6, 0.4]; // Chill to Chaos
        modifiedDuration *= energyMultipliers[audioManager.energyLevel] || 1.0;
        
        // Beat synchronization
        if (this.isBeatSynced && this.beatAnticipation) {
            const timeToNextBeat = audioManager.getTimeToNextBeat();
            if (timeToNextBeat < modifiedDuration) {
                modifiedDuration = Math.max(timeToNextBeat, 5);
            }
        }
        
        // Coordinated attack override
        if (this.coordinatedAttack) {
            modifiedDuration = Math.min(modifiedDuration, 15);
        }
        
        this.aimDuration = Math.max(modifiedDuration, 5); // Minimum 5 frames
    }
    
    shouldFire(audioManager) {
        // Standard time-based firing
        if (this.stateTime >= this.aimDuration) {
            return true;
        }
        
        // Musical trigger conditions
        if (audioManager) {
            // Strong beat trigger (for beat-synced shapes)
            if (this.isBeatSynced && audioManager.getBeatStrength() > 0.8) {
                return this.stateTime > 10; // Minimum aim time
            }
            
            // Bass spike trigger (for bass-sensitive shapes)  
            if (this.bassSensitivity > 0.7 && audioManager.isBassSpikeActive()) {
                return this.stateTime > 5;
            }
            
            // Coordinated attack trigger
            if (this.coordinatedAttack && this.stateTime > 8) {
                return true;
            }
        }
        
        return false;
    }
    
    calculateTarget(orbitPlayer, audioManager) {
        const centerX = orbitPlayer.centerX;
        const centerY = orbitPlayer.centerY;
        const orbitRadius = orbitPlayer.orbitRadius;
        
        // Base trajectory calculation
        let baseTargetX, baseTargetY;
        
        switch (this.trajectory) {
            case 'straight':
                baseTargetX = centerX;
                baseTargetY = centerY;
                break;
                
            case 'curved':
                const predictTime = this.panicMode ? 60 : 30; // More prediction in panic mode
                const playerAngle = orbitPlayer.angle + (orbitPlayer.rotationSpeed * predictTime);
                baseTargetX = centerX + Math.cos(playerAngle) * orbitRadius;
                baseTargetY = centerY + Math.sin(playerAngle) * orbitRadius;
                break;
                
            case 'spiral':
                const spiralOffset = this.stateTime * 0.05;
                baseTargetX = centerX + Math.cos(spiralOffset) * orbitRadius * 0.5;
                baseTargetY = centerY + Math.sin(spiralOffset) * orbitRadius * 0.5;
                break;
                
            case 'zigzag':
                const zigzag = Math.sin(this.stateTime * 0.1) * orbitRadius;
                baseTargetX = centerX + zigzag;
                baseTargetY = centerY;
                break;
                
            case 'homing':
                const currentPlayerX = centerX + Math.cos(orbitPlayer.angle) * orbitRadius;
                const currentPlayerY = centerY + Math.sin(orbitPlayer.angle) * orbitRadius;
                baseTargetX = currentPlayerX;
                baseTargetY = currentPlayerY;
                break;
                
            default:
                baseTargetX = centerX;
                baseTargetY = centerY;
        }
        
        // Musical modifications to targeting
        if (audioManager) {
            // Panic mode - direct targeting
            if (this.panicMode) {
                const currentPlayerX = centerX + Math.cos(orbitPlayer.angle) * orbitRadius;
                const currentPlayerY = centerY + Math.sin(orbitPlayer.angle) * orbitRadius;
                baseTargetX = currentPlayerX;
                baseTargetY = currentPlayerY;
            }
            
            // High frequency chaos - add targeting jitter
            if (audioManager.currentHighs > 0.7) {
                const jitterAmount = audioManager.currentHighs * 50;
                baseTargetX += (Math.random() - 0.5) * jitterAmount;
                baseTargetY += (Math.random() - 0.5) * jitterAmount;
            }
            
            // Bass-driven leading (predict player movement better)
            if (audioManager.currentBass > 0.6 && this.bassSensitivity > 0.5) {
                const leadTime = audioManager.currentBass * 40;
                const playerAngle = orbitPlayer.angle + (orbitPlayer.rotationSpeed * leadTime);
                baseTargetX = centerX + Math.cos(playerAngle) * orbitRadius;
                baseTargetY = centerY + Math.sin(playerAngle) * orbitRadius;
            }
        }
        
        this.targetX = baseTargetX;
        this.targetY = baseTargetY;
    }
    
    fire() {
        this.state = 'firing';
        this.stateTime = 0;
        this.panicMode = false; // Reset panic mode
        this.coordinatedAttack = false; // Reset coordinated attack flag
        
        // Calculate velocity toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = MathUtils.vectorLength(dx, dy);
        
        if (distance > 0) {
            const normalized = MathUtils.normalizeVector(dx, dy);
            
            // Apply musical speed modifications
            let finalSpeed = this.speed;
            
            if (this.panicMode) {
                finalSpeed *= 1.8;
            }
            
            this.vx = normalized.x * finalSpeed;
            this.vy = normalized.y * finalSpeed;
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
    
    // Handle collision with another shape
    onCollision(otherShape) {
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
    
    // Combine musical scale with beat scale for maximum effect
    const combinedScale = this.scale; // Musical scale is now calculated in updateMusicalBehavior
    ctx.scale(combinedScale, combinedScale);
    
    ctx.globalAlpha = this.opacity;
    
    // Get color from DNA
    const color = this.dna.getColor(audioManager);
    
    // Apply visual effects
    const effects = this.dna.getVisualEffects();
    if (effects.includes('glow') || this.glowRadius > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(10, this.glowRadius);
    }
    
    // Panic mode visual effects (brighter, more intense)
    if (this.panicMode) {
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = Math.max(20, this.glowRadius * 1.5);
    }
    
    // Enhanced glow during intense musical moments
    if (audioManager && audioManager.energyLevel >= 3) {
        ctx.shadowBlur = Math.max(ctx.shadowBlur, 25);
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