import { CONFIG } from '../utils/Config.js';
import { ShapeDNA } from '../entities/shapes/ShapeDNA.js';
import { ShapeFactory } from '../entities/shapes/ShapeFactory.js';

export class MutationSystem {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.mutationHistory = [];
        this.activeEvolutions = new Set();
    }
    
    // Handle collision between two shapes - main evolution trigger
    handleShapeCollision(shape1, shape2, collisionX, collisionY) {
        // Record collision for mutation tracking
        this.recordCollision(shape1, shape2);
        
        // Create explosion effect
        this.createCollisionExplosion(collisionX, collisionY, shape1, shape2);
        
        // Generate hybrid offspring
        const offspring = this.createHybridOffspring(shape1, shape2, collisionX, collisionY);
        
        // Mark original shapes for removal
        shape1.state = 'dying';
        shape2.state = 'dying';
        
        return offspring;
    }
    
    recordCollision(shape1, shape2) {
        const collision = {
            timestamp: Date.now(),
            parent1: shape1.shapeType,
            parent2: shape2.shapeType,
            generation1: shape1.dna.generation,
            generation2: shape2.dna.generation,
            location: { x: shape1.x, y: shape1.y }
        };
        
        this.mutationHistory.push(collision);
        
        // Keep only recent history (last 100 collisions)
        if (this.mutationHistory.length > 100) {
            this.mutationHistory.shift();
        }
    }
    
    createCollisionExplosion(x, y, shape1, shape2) {
        const color1 = shape1.dna.getColor();
        const color2 = shape2.dna.getColor();
        
        // Create mixed-color explosion
        this.particleSystem.createMutationExplosion(x, y, color1, color2, {
            particleCount: 15 + Math.min(shape1.dna.generation + shape2.dna.generation, 25),
            intensity: 1.0 + (shape1.dna.generation * shape2.dna.generation * 0.1),
            duration: 60
        });
    }
    
    createHybridOffspring(parent1, parent2, x, y) {
        const offspring = [];
        
        // Always create at least 1 hybrid
        const hybridDNA = ShapeDNA.crossbreed(parent1.dna, parent2.dna);
        const hybrid = this.createHybridShape(parent1, parent2, hybridDNA, x, y);
        offspring.push(hybrid);
        
        // Chance for additional offspring based on generation levels
        const totalGeneration = parent1.dna.generation + parent2.dna.generation;
        const extraOffspringChance = Math.min(totalGeneration * 0.1, 0.8);
        
        if (Math.random() < extraOffspringChance) {
            // Create second hybrid with different trait combination
            const secondHybridDNA = ShapeDNA.crossbreed(parent2.dna, parent1.dna);
            secondHybridDNA.mutate(); // Force additional mutation
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 30;
            const newX = x + Math.cos(angle) * distance;
            const newY = y + Math.sin(angle) * distance;
            
            const secondHybrid = this.createHybridShape(parent2, parent1, secondHybridDNA, newX, newY);
            offspring.push(secondHybrid);
        }
        
        // Ultra-rare evolution event
        if (totalGeneration > 10 && Math.random() < 0.05) {
            this.triggerEvolutionEvent(x, y, parent1, parent2, offspring);
        }
        
        return offspring;
    }
    
    createHybridShape(parent1, parent2, hybridDNA, x, y) {
        // Determine hybrid shape type based on parents
        const shapeType = this.determineHybridType(parent1.shapeType, parent2.shapeType);
        
        // Create the hybrid using factory
        const hybrid = ShapeFactory.createShape(shapeType, x, y, hybridDNA);
        
        // Apply hybrid properties
        hybrid.scale = 0.8 + (Math.random() * 0.4); // Slight size variation
        hybrid.isHybrid = true;
        hybrid.parentTypes = [parent1.shapeType, parent2.shapeType];
        
        // Inherit some behavioral traits
        if (parent1.hasReattacked || parent2.hasReattacked) {
            hybrid.canReattack = true;
        }
        
        // Set initial state based on proximity to walls
        if (this.isNearWall(x, y)) {
            hybrid.state = 'reattacking';
            this.calculateReattackTrajectory(hybrid);
        } else {
            hybrid.state = 'aiming';
            hybrid.aimDuration = 30 + Math.random() * 40; // Shorter aim time for hybrids
        }
        
        return hybrid;
    }
    
    determineHybridType(type1, type2) {
        // Hybrid type matrix - creates new combinations
        const hybridMatrix = {
            'triangle,spiral': 'triangularSpiral',
            'lightning,vortex': 'stormVortex', 
            'star,diamond': 'crystalStar',
            'hexagon,cross': 'compoundShape',
            'triangle,lightning': 'electricTriangle',
            'spiral,vortex': 'doubleSpiral',
            'diamond,star': 'stellarDiamond'
        };
        
        const key1 = `${type1},${type2}`;
        const key2 = `${type2},${type1}`;
        
        // Check for known hybrid combination
        if (hybridMatrix[key1]) return hybridMatrix[key1];
        if (hybridMatrix[key2]) return hybridMatrix[key2];
        
        // Random parent type if no specific hybrid defined
        return Math.random() < 0.5 ? type1 : type2;
    }
    
    triggerEvolutionEvent(x, y, parent1, parent2, offspring) {
        console.log('🧬 Evolution Event Triggered!', {
            parent1: parent1.shapeType,
            parent2: parent2.shapeType,
            generation: Math.max(parent1.dna.generation, parent2.dna.generation)
        });
        
        // Create spectacular visual effect
        this.particleSystem.createEvolutionExplosion(x, y, {
            particleCount: 50,
            colors: ['#ff00ff', '#00ffff', '#ffff00'],
            duration: 120,
            shockwaveRadius: 100
        });
        
        // Create multiple advanced offspring
        for (let i = 0; i < 3; i++) {
            const evolutionDNA = ShapeDNA.crossbreed(parent1.dna, parent2.dna);
            evolutionDNA.mutate();
            evolutionDNA.mutate(); // Double mutation for evolution event
            
            const angle = (i / 3) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            const newX = x + Math.cos(angle) * distance;
            const newY = y + Math.sin(angle) * distance;
            
            const evolved = ShapeFactory.createShape('evolved', newX, newY, evolutionDNA);
            evolved.isEvolved = true;
            evolved.evolutionGeneration = true;
            offspring.push(evolved);
        }
        
        this.activeEvolutions.add({
            timestamp: Date.now(),
            location: { x, y },
            parents: [parent1.shapeType, parent2.shapeType]
        });
    }
    
    calculateReattackTrajectory(shape) {
        // Calculate trajectory toward center of screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const dx = centerX - shape.x;
        const dy = centerY - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            shape.vx = (dx / distance) * shape.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
            shape.vy = (dy / distance) * shape.speed * CONFIG.REATTACK.SPEED_MULTIPLIER;
        }
    }
    
    isNearWall(x, y) {
        const margin = CONFIG.REATTACK.WALL_DISTANCE;
        return (x < margin || x > window.innerWidth - margin ||
                y < margin || y > window.innerHeight - margin);
    }
    
    // Update system - handle ongoing evolutions and cleanup
    update() {
        // Clean up old evolution events
        const now = Date.now();
        this.activeEvolutions = new Set([...this.activeEvolutions].filter(
            evolution => now - evolution.timestamp < 10000 // 10 second lifetime
        ));
    }
    
    // Get statistics for debugging/display
    getStats() {
        return {
            totalCollisions: this.mutationHistory.length,
            activeEvolutions: this.activeEvolutions.size,
            recentMutationRate: this.calculateRecentMutationRate(),
            dominantShapeTypes: this.getDominantShapeTypes()
        };
    }
    
    calculateRecentMutationRate() {
        const recentTime = Date.now() - 30000; // Last 30 seconds
        const recentCollisions = this.mutationHistory.filter(
            collision => collision.timestamp > recentTime
        );
        return recentCollisions.length / 30; // Collisions per second
    }
    
    getDominantShapeTypes() {
        const typeCounts = {};
        this.mutationHistory.forEach(collision => {
            typeCounts[collision.parent1] = (typeCounts[collision.parent1] || 0) + 1;
            typeCounts[collision.parent2] = (typeCounts[collision.parent2] || 0) + 1;
        });
        
        return Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }
}