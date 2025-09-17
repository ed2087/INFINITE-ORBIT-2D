import { CONFIG, DNA_TRAITS } from '../../utils/Config.js';
import { MathUtils } from '../../utils/MathUtils.js';

export class ShapeDNA {
    constructor(parentDNA = null) {
        this.traits = new Map();
        this.generation = parentDNA ? parentDNA.generation + 1 : 0;
        this.lineage = parentDNA ? [...parentDNA.lineage, this.generateLineageId()] : [this.generateLineageId()];
        
        if (parentDNA) {
            this.inheritTraits(parentDNA);
        } else {
            this.generateRandomTraits();
        }
    }
    
    generateRandomTraits() {
        // Movement traits
        this.traits.set('speed', MathUtils.random(DNA_TRAITS.SPEED.min, DNA_TRAITS.SPEED.max));
        this.traits.set('rotationSpeed', MathUtils.random(DNA_TRAITS.ROTATION_SPEED.min, DNA_TRAITS.ROTATION_SPEED.max));
        
        // Weighted trajectory selection - make homing rare
        const trajectoryWeights = {
            'straight': 50,    // 50% chance - most common
            'curved': 30,      // 30% chance - predictive aim
            'spiral': 10,      // 10% chance - spiral pattern
            'zigzag': 8,       // 8% chance - zigzag movement
            'homing': 2        // 2% chance - rare homing behavior
        };
        
        const weightedTrajectories = [];
        for (const [traj, weight] of Object.entries(trajectoryWeights)) {
            for (let i = 0; i < weight; i++) {
                weightedTrajectories.push(traj);
            }
        }
        this.traits.set('trajectory', MathUtils.randomChoice(weightedTrajectories));
        
        // Combat traits - reduce reattack probability too
        this.traits.set('canReattack', Math.random() < (DNA_TRAITS.REATTACK_ABILITY.probability * 0.5));
        this.traits.set('splitOnDeath', Math.random() < DNA_TRAITS.SPLIT_ON_DEATH.probability);
        this.traits.set('splitCount', MathUtils.randomChoice(DNA_TRAITS.SPLIT_ON_DEATH.count));
        this.traits.set('wallBounce', Math.random() < DNA_TRAITS.WALL_BOUNCE.probability);
        
        // Visual traits
        this.traits.set('size', MathUtils.random(DNA_TRAITS.SIZE.min, DNA_TRAITS.SIZE.max));
        this.traits.set('colorHue', MathUtils.random(DNA_TRAITS.COLOR_HUE.min, DNA_TRAITS.COLOR_HUE.max));
        this.traits.set('glowIntensity', MathUtils.random(DNA_TRAITS.GLOW_INTENSITY.min, DNA_TRAITS.GLOW_INTENSITY.max));
        
        // Audio reactive traits
        this.traits.set('beatSync', Math.random() < DNA_TRAITS.BEAT_SYNC.probability);
        this.traits.set('frequencyReactive', Math.random() < DNA_TRAITS.FREQUENCY_REACTIVE.probability);
        
        // Musical DNA traits (NEW)
        this.traits.set('bassSensitivity', 
            Math.random() < DNA_TRAITS.BASS_SENSITIVITY.probability ? 
            MathUtils.random(DNA_TRAITS.BASS_SENSITIVITY.min, DNA_TRAITS.BASS_SENSITIVITY.max) : 
            DNA_TRAITS.BASS_SENSITIVITY.default
        );
        
        this.traits.set('panicSusceptible', Math.random() < DNA_TRAITS.PANIC_SUSCEPTIBLE.probability);
        this.traits.set('beatAnticipation', Math.random() < DNA_TRAITS.BEAT_ANTICIPATION.probability);
        this.traits.set('musicalTimingPref', MathUtils.randomChoice(DNA_TRAITS.MUSICAL_TIMING_PREF));
    }
    
    inheritTraits(parentDNA) {
        // Inherit most traits from parent
        for (const [key, value] of parentDNA.traits) {
            if (Math.random() < DNA_TRAITS.TRAIT_INHERITANCE_RATE) {
                this.traits.set(key, value);
            } else {
                // Generate new random trait
                this.generateSingleTrait(key);
            }
        }
        
        // Apply genetic drift - small random mutations
        this.applyGeneticDrift();
    }
    
    generateSingleTrait(traitName) {
        switch (traitName) {
            case 'speed':
                this.traits.set('speed', MathUtils.random(DNA_TRAITS.SPEED.min, DNA_TRAITS.SPEED.max));
                break;
            case 'rotationSpeed':
                this.traits.set('rotationSpeed', MathUtils.random(DNA_TRAITS.ROTATION_SPEED.min, DNA_TRAITS.ROTATION_SPEED.max));
                break;
            case 'trajectory':
                const trajectoryWeights = {
                    'straight': 50, 'curved': 30, 'spiral': 10, 'zigzag': 8, 'homing': 2
                };
                const weightedTrajectories = [];
                for (const [traj, weight] of Object.entries(trajectoryWeights)) {
                    for (let i = 0; i < weight; i++) {
                        weightedTrajectories.push(traj);
                    }
                }
                this.traits.set('trajectory', MathUtils.randomChoice(weightedTrajectories));
                break;
            case 'size':
                this.traits.set('size', MathUtils.random(DNA_TRAITS.SIZE.min, DNA_TRAITS.SIZE.max));
                break;
            case 'colorHue':
                this.traits.set('colorHue', MathUtils.random(DNA_TRAITS.COLOR_HUE.min, DNA_TRAITS.COLOR_HUE.max));
                break;
            case 'bassSensitivity':
                this.traits.set('bassSensitivity', MathUtils.random(DNA_TRAITS.BASS_SENSITIVITY.min, DNA_TRAITS.BASS_SENSITIVITY.max));
                break;
            case 'musicalTimingPref':
                this.traits.set('musicalTimingPref', MathUtils.randomChoice(DNA_TRAITS.MUSICAL_TIMING_PREF));
                break;
        }
    }
    
    applyGeneticDrift() {
        for (const [key, value] of this.traits) {
            if (typeof value === 'number' && Math.random() < DNA_TRAITS.GENETIC_DRIFT) {
                const drift = (Math.random() - 0.5) * 0.2;
                this.traits.set(key, Math.max(0, value * (1 + drift)));
            }
        }
    }
    
    // Rest of the methods remain the same...
    static crossbreed(dna1, dna2) {
        const offspring = new ShapeDNA();
        offspring.generation = Math.max(dna1.generation, dna2.generation) + 1;
        offspring.lineage = [...dna1.lineage.slice(-2), ...dna2.lineage.slice(-2), offspring.generateLineageId()];
        
        const allTraits = new Set([...dna1.traits.keys(), ...dna2.traits.keys()]);
        
        for (const trait of allTraits) {
            const parent1Value = dna1.traits.get(trait);
            const parent2Value = dna2.traits.get(trait);
            
            if (parent1Value !== undefined && parent2Value !== undefined) {
                if (typeof parent1Value === 'number' && typeof parent2Value === 'number') {
                    const blend = Math.random();
                    const blended = (parent1Value * blend) + (parent2Value * (1 - blend));
                    offspring.traits.set(trait, blended);
                } else {
                    offspring.traits.set(trait, Math.random() < 0.5 ? parent1Value : parent2Value);
                }
            } else {
                offspring.traits.set(trait, parent1Value || parent2Value);
            }
        }
        
        if (Math.random() < CONFIG.DNA.MUTATION_CHANCE) {
            offspring.mutate();
        }
        
        return offspring;
    }
    
    mutate() {
        const mutationCount = Math.floor(Math.random() * CONFIG.DNA.MAX_MUTATIONS_PER_SHAPE) + 1;
        
        for (let i = 0; i < mutationCount; i++) {
            const traitNames = Array.from(this.traits.keys());
            const randomTrait = MathUtils.randomChoice(traitNames);
            
            this.generateSingleTrait(randomTrait);
        }
        
        if (Math.random() < CONFIG.DNA.CHAIN_MUTATION_CHANCE) {
            this.mutate();
        }
    }
    
    generateLineageId() {
        return Math.random().toString(36).substr(2, 4).toUpperCase();
    }
    
    getColor(audioManager) {
        let baseHue = this.traits.get('colorHue');
        
        if (this.traits.get('frequencyReactive') && audioManager) {
            baseHue += audioManager.currentBass * 60 + audioManager.currentHighs * 120;
            baseHue = baseHue % 360;
        }
        
        const saturation = 70 + (this.generation * 2);
        const lightness = 50 + (this.traits.get('glowIntensity') * 20);
        
        return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    }
    
    getVisualEffects() {
        const effects = [];
        
        if (this.traits.get('glowIntensity') > 1.5) {
            effects.push('glow');
        }
        
        if (this.generation > 5) {
            effects.push('mutation-aura');
        }
        
        if (this.traits.get('beatSync')) {
            effects.push('beat-pulse');
        }
        
        return effects;
    }
    
    getDebugInfo() {
        return {
            generation: this.generation,
            lineage: this.lineage.join(' → '),
            traits: Object.fromEntries(this.traits),
            mutationLevel: this.generation > 0 ? 'High' : 'None'
        };
    }
}