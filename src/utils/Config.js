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
    
    
    // Musical Reactivity Thresholds
    MUSICAL: {
        BASS_PANIC_THRESHOLD: 0.7,
        BASS_SPIKE_SENSITIVITY: 2.0, // Standard deviations above average
        ENERGY_LEVELS: {
            CHILL: { max: 0.2, speedMod: 0.7, aimMod: 1.2 },
            BUILDING: { max: 0.4, speedMod: 0.85, aimMod: 1.0 },
            INTENSE: { max: 0.6, speedMod: 1.0, aimMod: 0.8 },
            PEAK: { max: 0.8, speedMod: 1.3, aimMod: 0.6 },
            CHAOS: { max: 1.0, speedMod: 1.8, aimMod: 0.4 }
        },
        COORDINATED_ATTACK_THRESHOLD: 3, // Strong beats needed
        BEAT_SYNC_WINDOW: 10, // Frames before/after beat
        PANIC_ATTACK_DURATION: 60 // Frames
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

    // Intelligent Spawning System
    INTELLIGENT_SPAWNING: {
        SAFE_CORRIDOR_MIN_ANGLE: Math.PI / 6, // 30 degrees minimum safe zone
        SAFE_CORRIDOR_MAX_ANGLE: Math.PI / 2, // 90 degrees maximum safe zone
        SPAWN_PREDICTION_FRAMES: 180, // 3 seconds ahead prediction
        DIFFICULTY_SCALING_FACTOR: 0.95, // Corridor narrows by 5% every phase
        THREAT_ANALYSIS_RADIUS: 150, // Distance to analyze threats
        MAX_CONCURRENT_THREATS: 8 // Maximum shapes that can threaten player simultaneously
    },

    // Power-up System
    POWERUPS: {
        SPAWN_CHANCE: 0.15, // 15% chance per destroyed shape
        LIFETIME: 600, // 10 seconds to collect
        TYPES: {
            THUNDER_WAVE: { duration: 240, cooldown: 1800 }, // 4s active, 30s cooldown
            FIRE_SHIELD: { duration: 300, cooldown: 1500 },  // 5s active, 25s cooldown
            EMP_BLAST: { duration: 60, cooldown: 2400 },     // 1s active, 40s cooldown
            TIME_SLOW: { duration: 180, cooldown: 2000 }     // 3s active, 33s cooldown
        }
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
    FREQUENCY_REACTIVE: { probability: 0.3 },
    
    // Musical DNA traits (NEW)
    BASS_SENSITIVITY: { min: 0.1, max: 1.0, default: 0.5, probability: 0.6 },
    PANIC_SUSCEPTIBLE: { probability: 0.3 },
    BEAT_ANTICIPATION: { probability: 0.4 },
    MUSICAL_TIMING_PREF: ['drops', 'builds', 'chaos', 'any'] // Musical preference
};