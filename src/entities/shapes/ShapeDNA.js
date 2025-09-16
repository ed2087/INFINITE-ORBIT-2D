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
        this.traits.set('canReattack', Math.random() < (DNA_TRAITS.REATTACK_ABILITY.probability * 0.5)); // Half as likely
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
                // Use weighted selection even for single trait generation
                const trajectoryWeights = {
                    'straight': 50,
                    'curved': 30,
                    'spiral': 10,
                    'zigzag': 8,
                    'homing': 2
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
            // Add more cases as needed
        }
    }
    
    applyGeneticDrift() {
        for (const [key, value] of this.traits) {
            if (typeof value === 'number' && Math.random() < DNA_TRAITS.GENETIC_DRIFT) {
                const drift = (Math.random() - 0.5) * 0.2; // ±10% drift
                this.traits.set(key, Math.max(0, value * (1 + drift)));
            }
        }
    }
    
    // Cross two DNA strands to create hybrid offspring
    static crossbreed(dna1, dna2) {
        const offspring = new ShapeDNA();
        offspring.generation = Math.max(dna1.generation, dna2.generation) + 1;
        offspring.lineage = [...dna1.lineage.slice(-2), ...dna2.lineage.slice(-2), offspring.generateLineageId()];
        
        // Combine traits from both parents
        const allTraits = new Set([...dna1.traits.keys(), ...dna2.traits.keys()]);
        
        for (const trait of allTraits) {
            const parent1Value = dna1.traits.get(trait);
            const parent2Value = dna2.traits.get(trait);
            
            if (parent1Value !== undefined && parent2Value !== undefined) {
                // Both parents have this trait - blend or choose
                if (typeof parent1Value === 'number' && typeof parent2Value === 'number') {
                    // Numeric traits - blend with some randomness
                    const blend = Math.random();
                    const blended = (parent1Value * blend) + (parent2Value * (1 - blend));
                    offspring.traits.set(trait, blended);
                } else {
                    // Non-numeric traits - randomly choose from either parent
                    offspring.traits.set(trait, Math.random() < 0.5 ? parent1Value : parent2Value);
                }
            } else {
                // Only one parent has this trait
                offspring.traits.set(trait, parent1Value || parent2Value);
            }
        }
        
        // Apply mutation chance
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
            
            // Introduce radical mutation
            this.generateSingleTrait(randomTrait);
        }
        
        // Chain mutations - sometimes trigger additional mutations
        if (Math.random() < CONFIG.DNA.CHAIN_MUTATION_CHANCE) {
            this.mutate(); // Recursive mutation
        }
    }
    
    generateLineageId() {
        return Math.random().toString(36).substr(2, 4).toUpperCase();
    }
    
    // Get color based on DNA and current audio state
    getColor(audioManager) {
        let baseHue = this.traits.get('colorHue');
        
        if (this.traits.get('frequencyReactive') && audioManager) {
            // Shift hue based on audio frequencies
            baseHue += audioManager.currentBass * 60 + audioManager.currentHighs * 120;
            baseHue = baseHue % 360;
        }
        
        const saturation = 70 + (this.generation * 2); // More saturated with each generation
        const lightness = 50 + (this.traits.get('glowIntensity') * 20);
        
        return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    }
    
    // Get visual effects based on DNA
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
    
    // Debug info
    getDebugInfo() {
        return {
            generation: this.generation,
            lineage: this.lineage.join(' → '),
            traits: Object.fromEntries(this.traits),
            mutationLevel: this.generation > 0 ? 'High' : 'None'
        };
    }
}