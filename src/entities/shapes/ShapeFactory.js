import { Triangle } from './variants/Triangle.js';
import { Spiral } from './variants/Spiral.js';
import { Lightning } from './variants/Lightning.js';
import { Vortex } from './variants/Vortex.js';
import { Arrow } from './variants/Arrow.js';
import { Blade } from './variants/Blade.js';
import { Boomerang } from './variants/Boomerang.js';
import { Comet } from './variants/Comet.js';
import { Cross } from './variants/Cross.js';
import { Crystal } from './variants/Crystal.js';
import { Diamond } from './variants/Diamond.js';
import { Flower } from './variants/Flower.js';
import { Gear } from './variants/Gear.js';
import { Hexagon } from './variants/Hexagon.js';
import { Octagon } from './variants/Octagon.js';
import { Pentagon } from './variants/Pentagon.js';
import { Plasma } from './variants/Plasma.js';
import { Spinner } from './variants/Spinner.js';
import { Star } from './variants/Star.js';
import { Wave } from './variants/Wave.js';
import { CONFIG } from '../../utils/Config.js';
import { MathUtils } from '../../utils/MathUtils.js';

export class ShapeFactory {
    static shapeClasses = {
        triangle: Triangle,
        spiral: Spiral,
        lightning: Lightning,
        vortex: Vortex,
        arrow: Arrow,
        blade: Blade,
        boomerang: Boomerang,
        comet: Comet,
        cross: Cross,
        crystal: Crystal,
        diamond: Diamond,
        flower: Flower,
        gear: Gear,
        hexagon: Hexagon,
        octagon: Octagon,
        pentagon: Pentagon,
        plasma: Plasma,
        spinner: Spinner,
        star: Star,
        wave: Wave
    };
    
    static hybridClasses = {
        // Hybrid combinations - these get created from mutations
        triangularSpiral: Triangle, // Uses triangle class but with spiral DNA traits
        stormVortex: Lightning,     // Lightning with vortex properties
        crystalStar: Crystal,       // Crystal with star geometry
        compoundShape: Hexagon,     // Hexagon with cross properties
        electricTriangle: Triangle, // Triangle with lightning effects
        doubleSpiral: Spiral,       // Enhanced spiral with dual rotation
        stellarDiamond: Diamond,    // Diamond with star rays
        evolved: Star               // Ultimate evolution form
    };
    
    static phaseShapes = {
        GEOMETRIC: ['triangle', 'hexagon', 'pentagon', 'octagon', 'diamond', 'cross'],
        ORGANIC: ['spiral', 'flower', 'wave', 'comet'],
        MECHANICAL: ['gear', 'spinner', 'blade', 'arrow'],
        HYBRID: ['crystal', 'star', 'lightning', 'vortex'],
        CHAOS: ['plasma', 'boomerang'],
        ENDGAME: ['evolved', 'stormVortex', 'crystalStar', 'stellarDiamond']
    };
    
    static createShape(shapeType, x, y, dna = null) {
        // Handle hybrid types
        const ShapeClass = this.shapeClasses[shapeType] || this.hybridClasses[shapeType];
        
        if (!ShapeClass) {
            console.warn(`Unknown shape type: ${shapeType}, defaulting to Triangle`);
            return new Triangle(x, y, dna);
        }
        
        return new ShapeClass(x, y, dna);
    }
    
    static createRandomShape(x, y, currentPhase, audioManager = null, dna = null) {
        const availableShapes = this.getShapesForPhase(currentPhase);
        
        // Bias selection based on audio if available
        let selectedType;
        if (audioManager && CONFIG.AUDIO_REACTIVE_COLORS) {
            selectedType = this.getAudioBiasedShape(availableShapes, audioManager);
        } else {
            selectedType = MathUtils.randomChoice(availableShapes);
        }
        
        return this.createShape(selectedType, x, y, dna);
    }
    
    static getShapesForPhase(phase) {
        const phaseShapes = this.phaseShapes[phase] || this.phaseShapes.GEOMETRIC;
        
        // Add some shapes from previous phases for variety
        let availableShapes = [...phaseShapes];
        
        switch (phase) {
            case 'ORGANIC':
                availableShapes = [...availableShapes, ...this.phaseShapes.GEOMETRIC.slice(0, 3)];
                break;
            case 'MECHANICAL':
                availableShapes = [...availableShapes, ...this.phaseShapes.ORGANIC.slice(0, 2)];
                break;
            case 'HYBRID':
                availableShapes = [...availableShapes, ...this.phaseShapes.MECHANICAL.slice(0, 2)];
                break;
            case 'CHAOS':
                // Chaos phase can spawn anything
                availableShapes = Object.keys(this.shapeClasses);
                break;
            case 'ENDGAME':
                // Endgame focuses on evolved forms but includes some classics
                availableShapes = [...availableShapes, 'plasma', 'lightning', 'vortex'];
                break;
        }
        
        return availableShapes;
    }
    
    static getAudioBiasedShape(availableShapes, audioManager) {
        const bass = audioManager.currentBass;
        const mids = audioManager.currentMids;
        const highs = audioManager.currentHighs;
        
        // Bias shape selection based on frequency content
        const biases = {
            // Bass-heavy shapes
            triangle: bass * 2,
            hexagon: bass * 1.5,
            diamond: bass * 1.8,
            
            // Mid-frequency shapes
            spiral: mids * 2,
            gear: mids * 1.7,
            flower: mids * 1.5,
            
            // High-frequency shapes
            lightning: highs * 2,
            star: highs * 1.8,
            crystal: highs * 1.6,
            
            // Full-spectrum shapes
            plasma: (bass + mids + highs) * 0.8,
            vortex: (bass + mids + highs) * 0.9
        };
        
        // Weight available shapes by their audio bias
        const weightedShapes = [];
        for (const shape of availableShapes) {
            const weight = Math.max(biases[shape] || 1, 0.1);
            const count = Math.ceil(weight * 10);
            
            for (let i = 0; i < count; i++) {
                weightedShapes.push(shape);
            }
        }
        
        return MathUtils.randomChoice(weightedShapes);
    }
    
    static createSpawnPosition() {
        const margin = 50;
        const edge = Math.floor(Math.random() * 4);
        
        switch (edge) {
            case 0: // Top
                return {
                    x: margin + Math.random() * (window.innerWidth - margin * 2),
                    y: margin
                };
            case 1: // Right
                return {
                    x: window.innerWidth - margin,
                    y: margin + Math.random() * (window.innerHeight - margin * 2)
                };
            case 2: // Bottom
                return {
                    x: margin + Math.random() * (window.innerWidth - margin * 2),
                    y: window.innerHeight - margin
                };
            case 3: // Left
                return {
                    x: margin,
                    y: margin + Math.random() * (window.innerHeight - margin * 2)
                };
            default:
                return { x: margin, y: margin };
        }
    }
    
    static getAllShapeTypes() {
        return Object.keys(this.shapeClasses);
    }
    
    static getHybridTypes() {
        return Object.keys(this.hybridClasses);
    }
}