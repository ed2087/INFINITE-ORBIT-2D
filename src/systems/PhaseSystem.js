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
        
        // Musical phase tracking
        this.musicalIntensityHistory = [];
        this.coordinatedAttackCooldown = 0;
        this.lastSpecialEventTime = 0;
        this.musicalEventQueue = [];
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
        
        // Update difficulty scaling with musical awareness
        this.updateMusicalDifficultyScaling(gameTime, audioManager);
        
        // Update musical event system
        this.updateMusicalEvents(audioManager);
        
        // Update cooldowns
        if (this.coordinatedAttackCooldown > 0) {
            this.coordinatedAttackCooldown--;
        }
    }
    
    updateMusicalDifficultyScaling(gameTime, audioManager) {
        // Base difficulty progression over time
        const timeProgress = gameTime / CONFIG.SONG_DURATION;
        this.difficultyMultiplier = 1.0 + (timeProgress * 3.0);
        
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
        
        // Musical reactivity enhancements
        if (audioManager) {
            // Track musical intensity over time
            this.musicalIntensityHistory.push(audioManager.currentSongEnergy);
            if (this.musicalIntensityHistory.length > 600) { // 10 seconds of history
                this.musicalIntensityHistory.shift();
            }
            
            // Base audio-reactive difficulty
            const audioIntensity = audioManager.getIntensityMultiplier();
            this.difficultyMultiplier *= audioIntensity;
            
            // Energy level based scaling
            const energyMultipliers = [0.7, 0.85, 1.0, 1.3, 1.8];
            this.difficultyMultiplier *= energyMultipliers[audioManager.energyLevel] || 1.0;
            
            // Musical trend bonuses
            if (audioManager.energyTrend === 1) { // Building energy
                this.difficultyMultiplier *= 1.2;
            }
            
            // Bass spike intensity scaling
            if (audioManager.isBassSpikeActive()) {
                const spikeIntensity = audioManager.getBassSpikeIntensity();
                this.difficultyMultiplier *= (1.0 + spikeIntensity * 0.8);
            }
            
            // Beat-synced spawn rate increases
            const beatStrength = audioManager.getBeatStrength();
            this.spawnRateMultiplier = 1.0 + (beatStrength * 1.2);
            
            // Strong beat spawn bursts
            if (beatStrength > 0.8 && this.coordinatedAttackCooldown === 0) {
                this.spawnRateMultiplier *= 2.0;
                this.coordinatedAttackCooldown = 60; // 1 second cooldown
            }
        }
        
        // Phase progression within current phase
        const progressionBonus = this.phaseProgress * 0.5;
        this.difficultyMultiplier += progressionBonus;
    }
    
    updateMusicalEvents(audioManager) {
        if (!audioManager) return;
        
        const currentTime = Date.now();
        
        // Process queued musical events
        this.musicalEventQueue = this.musicalEventQueue.filter(event => {
            if (currentTime >= event.triggerTime) {
                this.executeMusicalEvent(event);
                return false; // Remove from queue
            }
            return true;
        });
        
        // Check for new musical event triggers
        this.checkForMusicalEventTriggers(audioManager, currentTime);
    }
    
    checkForMusicalEventTriggers(audioManager, currentTime) {
        // Prevent event spam
        if (currentTime - this.lastSpecialEventTime < 2000) return;
        
        // Bass drop event (panic wave)
        if (audioManager.shouldTriggerPanicAttack() && 
            audioManager.energyLevel >= 2) {
            
            this.queueMusicalEvent({
                type: 'bass_drop_panic',
                intensity: audioManager.getBassSpikeIntensity(),
                delay: 0
            });
            this.lastSpecialEventTime = currentTime;
        }
        
        // Energy buildup event (coordinated assault)
        if (audioManager.energyTrend === 1 && 
            audioManager.energyLevel >= 3 && 
            this.getAverageRecentIntensity() > 0.6) {
            
            this.queueMusicalEvent({
                type: 'energy_buildup_assault',
                intensity: audioManager.currentSongEnergy,
                delay: 500 // Half second delay to build tension
            });
            this.lastSpecialEventTime = currentTime;
        }
        
        // Chaos burst (during high-energy chaos moments)
        if (audioManager.energyLevel === 4 && 
            audioManager.strongBeats.length >= 4 &&
            Math.random() < 0.1) {
            
            this.queueMusicalEvent({
                type: 'chaos_burst',
                intensity: 2.0 + Math.random(),
                delay: 200
            });
            this.lastSpecialEventTime = currentTime;
        }
        
        // Musical phrase finale (end of musical sections)
        if (this.phaseProgress > 0.85 && Math.random() < 0.15) {
            this.queueMusicalEvent({
                type: 'phrase_finale',
                intensity: 1.5 + this.phaseProgress,
                delay: 0
            });
            this.lastSpecialEventTime = currentTime;
        }
    }
    
    queueMusicalEvent(event) {
        event.triggerTime = Date.now() + event.delay;
        this.musicalEventQueue.push(event);
        console.log(`🎵 Queued musical event: ${event.type} (intensity: ${event.intensity.toFixed(2)})`);
    }
    
    executeMusicalEvent(event) {
        console.log(`🎶 Executing musical event: ${event.type}`);
        
        // Create event data for the game to process
        const eventData = {
            type: event.type,
            intensity: event.intensity,
            timestamp: Date.now()
        };
        
        // Dispatch custom event for the game to handle
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('musicalGameEvent', { 
                detail: eventData 
            }));
        }
    }
    
    getAverageRecentIntensity() {
        if (this.musicalIntensityHistory.length < 60) return 0;
        
        const recent = this.musicalIntensityHistory.slice(-60); // Last second
        return recent.reduce((sum, val) => sum + val) / recent.length;
    }
    
    getCurrentPhase(gameTime) {
        for (const [phaseName, timing] of Object.entries(CONFIG.PHASES)) {
            if (gameTime >= timing.start && gameTime < timing.end) {
                return phaseName;
            }
        }
        return 'ENDGAME';
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
        
        this.triggerPhaseEffects(toPhase);
    }
    
    triggerPhaseEffects(phase) {
        // Queue phase transition event
        this.queueMusicalEvent({
            type: 'phase_transition',
            phase: phase,
            intensity: 2.0,
            delay: 0
        });
        
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
    
    getSpawnInterval() {
        const baseInterval = CONFIG.SPAWN_RATE.MIN;
        const maxInterval = CONFIG.SPAWN_RATE.MAX;
        
        // Calculate current spawn interval based on difficulty
        const progress = Math.min(this.difficultyMultiplier / 4.0, 1.0);
        const interval = MathUtils.lerp(maxInterval, baseInterval, progress);
        
        // Apply spawn rate multiplier (beat sync and musical events)
        return Math.max(interval / this.spawnRateMultiplier, CONFIG.SPAWN_RATE.MAX);
    }
    
    getShapeComplexity() {
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
        // Legacy method - now handled by musical event system
        return null;
    }
    
    getMutationRate() {
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
            totalTransitions: this.phaseTransitions.length,
            queuedEvents: this.musicalEventQueue.length
        };
    }
    
    getPhaseHistory() {
        return this.phaseTransitions.slice();
    }
    
    forcePhase(phaseName) {
        if (CONFIG.PHASES[phaseName]) {
            this.handlePhaseTransition(this.currentPhase, phaseName, 0);
        }
    }
    
    reset() {
        this.currentPhase = 'GEOMETRIC';
        this.phaseStartTime = 0;
        this.phaseTransitions = [];
        this.difficultyMultiplier = 1.0;
        this.spawnRateMultiplier = 1.0;
        this.phaseProgress = 0;
        this.musicalIntensityHistory = [];
        this.coordinatedAttackCooldown = 0;
        this.lastSpecialEventTime = 0;
        this.musicalEventQueue = [];
    }
}