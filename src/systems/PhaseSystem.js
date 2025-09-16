import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';
import { ShapeFactory } from '../entities/shapes/ShapeFactory.js';

export class PhaseSystem {
    constructor() {
        this.currentPhase = 'GEOMETRIC';
        this.phaseStartTime = 0;
        this.phaseTransitions = [];
        this.difficultyMultiplier = 1.0;
        this.spawnRateMultiplier = 1.0;
        this.phaseProgress = 0;
    }
    
    update(gameTime, audioManager) {
        const previousPhase = this.currentPhase;
        
        // Determine current phase based on song time
        this.currentPhase = this.getCurrentPhase(gameTime);
        this.phaseProgress = this.getPhaseProgress(gameTime);
        
        // Handle phase transitions
        if (previousPhase !== this.currentPhase) {
            this.handlePhaseTransition(previousPhase, this.currentPhase, gameTime);
        }
        
        // Update difficulty scaling
        this.updateDifficultyScaling(gameTime, audioManager);
    }
    
    getCurrentPhase(gameTime) {
        for (const [phaseName, timing] of Object.entries(CONFIG.PHASES)) {
            if (gameTime >= timing.start && gameTime < timing.end) {
                return phaseName;
            }
        }
        return 'ENDGAME'; // Fallback for overtime
    }
    
    getPhaseProgress(gameTime) {
        const phaseInfo = CONFIG.PHASES[this.currentPhase];
        if (!phaseInfo) return 1.0;
        
        const elapsed = gameTime - phaseInfo.start;
        const duration = phaseInfo.end - phaseInfo.start;
        return Math.min(elapsed / duration, 1.0);
    }
    
    handlePhaseTransition(fromPhase, toPhase, gameTime) {
        console.log(`🎮 Phase Transition: ${fromPhase} → ${toPhase} at ${Math.floor(gameTime)}s`);
        
        const transition = {
            from: fromPhase,
            to: toPhase,
            time: gameTime,
            timestamp: Date.now()
        };
        
        this.phaseTransitions.push(transition);
        this.phaseStartTime = gameTime;
        
        // Trigger phase-specific effects
        this.triggerPhaseEffects(toPhase);
    }
    
    triggerPhaseEffects(phase) {
        switch (phase) {
            case 'ORGANIC':
                console.log('🌱 Organic phase: Curved shapes emerging...');
                break;
                
            case 'MECHANICAL':
                console.log('⚙️ Mechanical phase: Complex patterns activating...');
                break;
                
            case 'HYBRID':
                console.log('🧬 Hybrid phase: Mutations becoming dominant...');
                break;
                
            case 'CHAOS':
                console.log('🌪️ Chaos phase: All patterns unleashed...');
                break;
                
            case 'ENDGAME':
                console.log('💀 Endgame phase: Maximum difficulty reached...');
                break;
        }
    }
    
    updateDifficultyScaling(gameTime, audioManager) {
        // Base difficulty progression over time
        const timeProgress = gameTime / CONFIG.SONG_DURATION;
        this.difficultyMultiplier = 1.0 + (timeProgress * 3.0); // 4x harder by end
        
        // Phase-specific difficulty modifiers
        const phaseMultipliers = {
            GEOMETRIC: 1.0,
            ORGANIC: 1.2,
            MECHANICAL: 1.5,
            HYBRID: 2.0,
            CHAOS: 2.5,
            ENDGAME: 3.0
        };
        
        this.difficultyMultiplier *= phaseMultipliers[this.currentPhase] || 1.0;
        
        // Audio-reactive difficulty spikes
        if (audioManager) {
            const audioIntensity = audioManager.getIntensityMultiplier();
            this.difficultyMultiplier *= audioIntensity;
            
            // Beat-synced spawn rate increases
            const beatStrength = audioManager.getBeatStrength();
            this.spawnRateMultiplier = 1.0 + (beatStrength * 0.5);
        }
        
        // Phase progression within current phase
        const progressionBonus = this.phaseProgress * 0.5;
        this.difficultyMultiplier += progressionBonus;
    }
    
    getSpawnInterval() {
        const baseInterval = CONFIG.SPAWN_RATE.MIN;
        const maxInterval = CONFIG.SPAWN_RATE.MAX;
        
        // Calculate current spawn interval based on difficulty
        const progress = Math.min(this.difficultyMultiplier / 4.0, 1.0);
        const interval = MathUtils.lerp(baseInterval, maxInterval, progress);
        
        // Apply spawn rate multiplier (beat sync)
        return Math.max(interval / this.spawnRateMultiplier, CONFIG.SPAWN_RATE.MAX);
    }
    
    getShapeComplexity() {
        // Return complexity level for shape spawning
        const phaseComplexity = {
            GEOMETRIC: 1,
            ORGANIC: 2,
            MECHANICAL: 3,
            HYBRID: 4,
            CHAOS: 5,
            ENDGAME: 6
        };
        
        const baseComplexity = phaseComplexity[this.currentPhase] || 1;
        const progressBonus = Math.floor(this.phaseProgress * 2);
        
        return Math.min(baseComplexity + progressBonus, 8);
    }
    
    getAvailableShapes() {
        return ShapeFactory.getShapesForPhase(this.currentPhase);
    }
    
    shouldTriggerSpecialEvent() {
        // Trigger special events at phase boundaries
        if (this.phaseProgress > 0.9 && Math.random() < 0.1) {
            return {
                type: 'phase_finale',
                phase: this.currentPhase,
                intensity: 1.5 + this.phaseProgress
            };
        }
        
        // Random events during chaos phase
        if (this.currentPhase === 'CHAOS' && Math.random() < 0.05) {
            return {
                type: 'chaos_burst',
                intensity: 2.0 + Math.random()
            };
        }
        
        // Endgame survival events
        if (this.currentPhase === 'ENDGAME' && Math.random() < 0.08) {
            return {
                type: 'survival_wave',
                intensity: 2.5 + this.phaseProgress
            };
        }
        
        return null;
    }
    
    getMutationRate() {
        // Mutation rate increases with phase progression
        const baseRate = CONFIG.DNA.MUTATION_CHANCE;
        const phaseBonus = {
            GEOMETRIC: 0,
            ORGANIC: 0.1,
            MECHANICAL: 0.15,
            HYBRID: 0.25,
            CHAOS: 0.35,
            ENDGAME: 0.4
        };
        
        const progressBonus = this.phaseProgress * 0.1;
        return Math.min(baseRate + phaseBonus[this.currentPhase] + progressBonus, 0.95);
    }
    
    getReattackChance() {
        // Reattack behavior becomes more common in later phases
        const baseChance = CONFIG.REATTACK.CHANCE;
        const phaseMultiplier = {
            GEOMETRIC: 0.5,
            ORGANIC: 0.7,
            MECHANICAL: 0.9,
            HYBRID: 1.2,
            CHAOS: 1.5,
            ENDGAME: 2.0
        };
        
        return Math.min(baseChance * phaseMultiplier[this.currentPhase], 0.8);
    }
    
    // Analytics and debugging
    getPhaseInfo() {
        return {
            currentPhase: this.currentPhase,
            progress: this.phaseProgress,
            difficultyMultiplier: this.difficultyMultiplier,
            spawnRateMultiplier: this.spawnRateMultiplier,
            timeInPhase: Date.now() - this.phaseStartTime,
            totalTransitions: this.phaseTransitions.length
        };
    }
    
    getPhaseHistory() {
        return this.phaseTransitions.slice(); // Return copy
    }
    
    // For debugging - force phase change
    forcePhase(phaseName) {
        if (CONFIG.PHASES[phaseName]) {
            this.handlePhaseTransition(this.currentPhase, phaseName, 0);
        }
    }
    
    // Reset for new game
    reset() {
        this.currentPhase = 'GEOMETRIC';
        this.phaseStartTime = 0;
        this.phaseTransitions = [];
        this.difficultyMultiplier = 1.0;
        this.spawnRateMultiplier = 1.0;
        this.phaseProgress = 0;
    }
}