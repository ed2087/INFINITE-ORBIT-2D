// Core game configuration for 60-minute electronic music survival
export const CONFIG = {
    // Audio & Timing
    SONG_DURATION: 3600, // 60 minutes in seconds
    SAMPLE_RATE: 44100,
    FFT_SIZE: 2048,
    
    // Game Progression (exponential scaling over 60 minutes)
    PHASES: {
        GEOMETRIC: { start: 0, end: 600 },      // 0-10 min: Basic shapes
        ORGANIC: { start: 600, end: 1200 },    // 10-20 min: Curved forms
        MECHANICAL: { start: 1200, end: 1800 }, // 20-30 min: Complex patterns
        HYBRID: { start: 1800, end: 2400 },    // 30-40 min: Mutations dominate
        CHAOS: { start: 2400, end: 3000 },     // 40-50 min: Pure evolution
        ENDGAME: { start: 3000, end: 3600 }    // 50-60 min: Survival mode
    },
    
    // Difficulty Scaling
    SPAWN_RATE: {
        MIN: 180,    // frames between spawns at start
        MAX: 12,     // frames between spawns at end
        CURVE: 2.5   // exponential curve factor
    },
    
    SPEED_SCALING: {
        INITIAL: 1.0,
        FINAL: 12.0,
        AUDIO_MULTIPLIER: 0.3 // extra speed based on audio intensity
    },
    
    // DNA & Mutation System
    DNA: {
        MUTATION_CHANCE: 0.85,
        CHAIN_MUTATION_CHANCE: 0.4,
        MAX_MUTATIONS_PER_SHAPE: 6,
        GENETIC_DRIFT: 0.1,
        TRAIT_INHERITANCE_RATE: 0.7
    },
    
    // Shape Behaviors
    REATTACK: {
        CHANCE: 0.35,
        WALL_DISTANCE: 80,
        SPEED_MULTIPLIER: 1.4
    },
    
    // Visual & Audio
    PARTICLE_SYSTEMS: true,
    SCREEN_SHAKE: true,
    AUDIO_REACTIVE_COLORS: true,
    BEAT_DETECTION: true
};

// DNA Trait Definitions
export const DNA_TRAITS = {
    // Movement traits
    SPEED: { min: 0.5, max: 8.0, default: 2.0 },
    ROTATION_SPEED: { min: -0.2, max: 0.2, default: 0.05 },
    TRAJECTORY: ['straight', 'curved', 'spiral', 'zigzag', 'homing'],
    
    // Combat traits  
    REATTACK_ABILITY: { probability: 0.3 },
    SPLIT_ON_DEATH: { probability: 0.2, count: [2, 3, 4] },
    WALL_BOUNCE: { probability: 0.15 },
    
    // Visual traits
    SIZE: { min: 8, max: 45, default: 20 },
    COLOR_HUE: { min: 0, max: 360 },
    GLOW_INTENSITY: { min: 0, max: 2.0, default: 0.5 },
    
    // Audio reactive traits
    BEAT_SYNC: { probability: 0.4 },
    FREQUENCY_REACTIVE: { probability: 0.3 }
};