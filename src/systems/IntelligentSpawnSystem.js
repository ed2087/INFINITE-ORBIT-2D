import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';
import { ShapeFactory } from '../entities/shapes/ShapeFactory.js';

export class IntelligentSpawnSystem {
    constructor() {
        this.threatAnalysis = [];
        this.safeCorridors = [];
        this.difficultyMultiplier = 1.0;
        this.musicIntensityHistory = [];
    }
    
    update(player, existingShapes, projectiles, audioManager, phaseSystem) {
        this.analyzeThreatLevel(player, existingShapes, projectiles);
        this.calculateSafeCorridors(player);
        this.updateDifficultyScaling(phaseSystem, audioManager);
    }
    
    analyzeThreatLevel(player, shapes, projectiles) {
        this.threatAnalysis = [];
        const playerPositions = this.predictPlayerPath(player);
        
        // Analyze existing threats
        [...shapes, ...projectiles].forEach(threat => {
            const threatLevel = this.calculateThreatLevel(threat, playerPositions);
            if (threatLevel > 0) {
                this.threatAnalysis.push({
                    object: threat,
                    level: threatLevel,
                    timeToImpact: this.calculateTimeToImpact(threat, player)
                });
            }
        });
        
        this.threatAnalysis.sort((a, b) => a.timeToImpact - b.timeToImpact);
    }
    
    calculateThreatLevel(threat, playerPositions) {
        if (!threat || !playerPositions) return 0;
        
        // Calculate minimum distance to player path
        let minDistance = Infinity;
        for (const position of playerPositions) {
            const distance = MathUtils.distance(threat.x, threat.y, position.x, position.y);
            minDistance = Math.min(minDistance, distance);
        }
        
        // Threat level based on proximity and object type
        const maxThreatDistance = 150;
        if (minDistance > maxThreatDistance) return 0;
        
        const proximityThreat = 1 - (minDistance / maxThreatDistance);
        const typeThreat = threat.state === 'firing' ? 1.5 : 0.8; // Firing objects more threatening
        
        return proximityThreat * typeThreat;
    }
    
    calculateTimeToImpact(threat, player) {
        if (!threat.vx && !threat.vy) return Infinity; // Not moving
        
        const dx = player.centerX - threat.x;
        const dy = player.centerY - threat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.sqrt(threat.vx * threat.vx + threat.vy * threat.vy);
        
        return speed > 0 ? distance / speed : Infinity;
    }
    
    predictPlayerPath(player) {
        const positions = [];
        const frames = CONFIG.INTELLIGENT_SPAWNING?.SPAWN_PREDICTION_FRAMES || 180;
        
        for (let i = 0; i < frames; i++) {
            const futureAngle = player.angle + (player.rotationSpeed * i);
            const futureX = player.centerX + Math.cos(futureAngle) * player.orbitRadius;
            const futureY = player.centerY + Math.sin(futureAngle) * player.orbitRadius;
            
            positions.push({
                x: futureX,
                y: futureY,
                angle: futureAngle,
                frame: i
            });
        }
        
        return positions;
    }
    
    calculateSafeCorridors(player) {
        this.safeCorridors = [];
        const corridorCount = 8; // Check 8 directions around player
        
        for (let i = 0; i < corridorCount; i++) {
            const angle = (i / corridorCount) * Math.PI * 2;
            const corridorWidth = this.calculateCorridorWidth();
            const isSafe = this.isCorridorSafe(player, angle, corridorWidth);
            
            this.safeCorridors.push({
                angle: angle,
                width: corridorWidth,
                safe: isSafe,
                threatLevel: this.getCorridorThreatLevel(player, angle, corridorWidth)
            });
        }
    }
    
    isCorridorSafe(player, angle, width) {
        // Check if corridor has threats blocking it
        const checkDistance = 200; // How far to check ahead
        const checkPoints = 10; // Resolution of safety check
        
        for (let i = 0; i < checkPoints; i++) {
            const distance = (i / checkPoints) * checkDistance;
            const checkX = player.centerX + Math.cos(angle) * distance;
            const checkY = player.centerY + Math.sin(angle) * distance;
            
            // Check if any threats are too close to this corridor point
            for (const threat of this.threatAnalysis) {
                const threatDistance = MathUtils.distance(checkX, checkY, threat.object.x, threat.object.y);
                const safeDistance = width * 50; // Convert angle to distance
                
                if (threatDistance < safeDistance) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getCorridorThreatLevel(player, angle, width) {
        let totalThreat = 0;
        const checkDistance = 150;
        
        // Check threat level in corridor direction
        const checkX = player.centerX + Math.cos(angle) * checkDistance;
        const checkY = player.centerY + Math.sin(angle) * checkDistance;
        
        for (const threat of this.threatAnalysis) {
            const distance = MathUtils.distance(checkX, checkY, threat.object.x, threat.object.y);
            const influence = Math.max(0, 1 - (distance / 100));
            totalThreat += threat.level * influence;
        }
        
        return totalThreat;
    }
    
    calculateCorridorWidth() {
        const baseWidth = CONFIG.INTELLIGENT_SPAWNING?.SAFE_CORRIDOR_MAX_ANGLE || Math.PI / 2;
        const minWidth = CONFIG.INTELLIGENT_SPAWNING?.SAFE_CORRIDOR_MIN_ANGLE || Math.PI / 6;
        const scaling = CONFIG.INTELLIGENT_SPAWNING?.DIFFICULTY_SCALING_FACTOR || 0.95;
        
        return Math.max(minWidth, baseWidth * Math.pow(scaling, this.difficultyMultiplier));
    }
    
    simulateSpawnImpact(x, y) {
        // Simulate what safe corridors would look like if we spawned at this position
        const simulatedThreat = {
            object: { x, y, vx: 0, vy: 0, state: 'aiming' },
            level: 0.5,
            timeToImpact: 60
        };
        
        const originalThreats = [...this.threatAnalysis];
        this.threatAnalysis.push(simulatedThreat);
        
        // Recalculate corridors with simulated threat
        const simulatedCorridors = [];
        const corridorCount = 8;
        
        for (let i = 0; i < corridorCount; i++) {
            const angle = (i / corridorCount) * Math.PI * 2;
            const corridorWidth = this.calculateCorridorWidth();
            const isSafe = this.isCorridorSafe({ centerX: window.innerWidth / 2, centerY: window.innerHeight / 2 }, angle, corridorWidth);
            
            simulatedCorridors.push({
                angle: angle,
                width: corridorWidth,
                safe: isSafe
            });
        }
        
        // Restore original threats
        this.threatAnalysis = originalThreats;
        
        return simulatedCorridors;
    }
    
    updateDifficultyScaling(phaseSystem, audioManager) {
        // Update difficulty based on phase and audio
        this.difficultyMultiplier = phaseSystem ? phaseSystem.difficultyMultiplier : 1.0;
        
        if (audioManager) {
            this.musicIntensityHistory.push(audioManager.currentAmplitude || 0);
            if (this.musicIntensityHistory.length > 300) {
                this.musicIntensityHistory.shift();
            }
        }
    }
    
    canSpawnAt(x, y, currentPhase, audioManager) {
        // Must guarantee at least one safe corridor remains
        const safeCorridorsAfterSpawn = this.simulateSpawnImpact(x, y);
        const safeCorridorCount = safeCorridorsAfterSpawn.filter(c => c.safe).length;
        
        if (safeCorridorCount < 1) {
            return false; // Would create impossible situation
        }
        
        // Check concurrent threat limit
        const maxThreats = CONFIG.INTELLIGENT_SPAWNING?.MAX_CONCURRENT_THREATS || 8;
        if (this.threatAnalysis.length >= maxThreats) {
            return false;
        }
        
        // Musical timing constraints
        return this.isMusicallySuitableForSpawn(audioManager);
    }
    
    isMusicallySuitableForSpawn(audioManager) {
        if (!audioManager) return true;
        
        // During bass spikes, limit spawning to maintain fairness
        if (audioManager.isBassSpikeActive && audioManager.isBassSpikeActive() && this.threatAnalysis.length > 4) {
            return false;
        }
        
        // During energy buildups, allow more spawns but with spacing
        if (audioManager.energyTrend === 1 && audioManager.energyLevel >= 3) {
            return Math.random() < 0.7; // 70% chance during intense moments
        }
        
        return true;
    }
    
    generateMusicalSpawn(audioManager, phaseSystem, canvasWidth, canvasHeight) {
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const position = ShapeFactory.createSpawnPosition();
            
            if (this.canSpawnAt(position.x, position.y, phaseSystem?.currentPhase, audioManager)) {
                return this.createMusicallyAwareShape(position, audioManager, phaseSystem);
            }
        }
        
        return null; // No valid spawn position found
    }
    
    createMusicallyAwareShape(position, audioManager, phaseSystem) {
        const shape = ShapeFactory.createRandomShape(
            position.x, 
            position.y, 
            phaseSystem?.currentPhase || 'GEOMETRIC', 
            audioManager
        );
        
        // Musical behavior modifications
        if (audioManager) {
            // Shapes spawned during intense moments get enhanced properties
            if (audioManager.energyLevel >= 3) {
                shape.speed *= 1.2;
                shape.aimDuration *= 0.8;
            }
            
            // Bass-reactive shapes during calm moments get increased patience
            if (audioManager.energyLevel <= 1 && shape.bassSensitivity > 0.5) {
                shape.aimDuration *= 1.5;
            }
        }
        
        return shape;
    }
    
    reset() {
        this.threatAnalysis = [];
        this.safeCorridors = [];
        this.difficultyMultiplier = 1.0;
        this.musicIntensityHistory = [];
    }
}