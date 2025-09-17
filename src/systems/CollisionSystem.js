import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class CollisionSystem {
    constructor(mutationSystem, particleSystem) {
        this.mutationSystem = mutationSystem;
        this.particleSystem = particleSystem;
        
        // Collision tracking
        this.collisionCount = 0;
        this.recentCollisions = [];
        this.spatialGrid = new Map();
        this.gridSize = 100; // Grid cell size for spatial optimization
    }
    
    update(shapes, projectiles, player) {
        // Clear spatial grid
        this.spatialGrid.clear();
        
        // Populate spatial grid with projectiles for faster collision detection
        this.populateSpatialGrid(projectiles);
        
        const collisionsToProcess = [];
        
        // Check projectile-projectile collisions
        this.checkProjectileCollisions(projectiles, collisionsToProcess);
        
        // Check shape-projectile collisions (shapes firing at each other)
        this.checkShapeProjectileCollisions(shapes, projectiles, collisionsToProcess);
        
        // Check player-projectile collisions
        const playerHit = this.checkPlayerCollisions(player, projectiles);
        
        // Process all collisions
        const newShapes = this.processCollisions(collisionsToProcess);
        
        return {
            newShapes,
            playerHit,
            collisionCount: collisionsToProcess.length
        };
    }
    
    populateSpatialGrid(projectiles) {
        for (const projectile of projectiles) {
            const gridX = Math.floor(projectile.x / this.gridSize);
            const gridY = Math.floor(projectile.y / this.gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(projectile);
        }
    }
    
    getNearbyCells(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        const cells = [];
        
        // Check 3x3 grid around the position
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                if (this.spatialGrid.has(key)) {
                    cells.push(...this.spatialGrid.get(key));
                }
            }
        }
        
        return cells;
    }
    
    checkProjectileCollisions(projectiles, collisionsToProcess) {
        const processed = new Set();
        
        for (const projectile of projectiles) {
            if (processed.has(projectile)) continue;
            
            const nearby = this.getNearbyCells(projectile.x, projectile.y);
            
            for (const other of nearby) {
                if (projectile === other || processed.has(other)) continue;
                
                const distance = MathUtils.distance(
                    projectile.x, projectile.y,
                    other.x, other.y
                );
                
                const collisionRadius = (projectile.size + other.size) / 2;
                
                if (distance < collisionRadius) {
                    collisionsToProcess.push({
                        type: 'projectile-projectile',
                        projectile1: projectile,
                        projectile2: other,
                        x: (projectile.x + other.x) / 2,
                        y: (projectile.y + other.y) / 2,
                        distance: distance
                    });
                    
                    processed.add(projectile);
                    processed.add(other);
                    break;
                }
            }
        }
    }
    
    checkShapeProjectileCollisions(shapes, projectiles, collisionsToProcess) {
        for (const shape of shapes) {
            if (shape.state !== 'aiming') continue; // Only aiming shapes can be hit
            
            const nearby = this.getNearbyCells(shape.x, shape.y);
            
            for (const projectile of nearby) {
                const distance = MathUtils.distance(
                    shape.x, shape.y,
                    projectile.x, projectile.y
                );
                
                const collisionRadius = (shape.size + projectile.size) / 2;
                
                if (distance < collisionRadius) {
                    collisionsToProcess.push({
                        type: 'shape-projectile',
                        shape: shape,
                        projectile: projectile,
                        x: (shape.x + projectile.x) / 2,
                        y: (shape.y + projectile.y) / 2,
                        distance: distance
                    });
                    break; // One collision per shape per frame
                }
            }
        }
    }
    
    checkPlayerCollisions(player, projectiles) {
        if (!player.isAlive || player.invulnerabilityTime > 0) {
            return false;
        }
        
        const spherePositions = player.getSpherePositions();
        
        for (const sphere of spherePositions) {
            const nearby = this.getNearbyCells(sphere.x, sphere.y);
            
            for (const projectile of nearby) {
                const distance = MathUtils.distance(
                    sphere.x, sphere.y,
                    projectile.x, projectile.y
                );
                
                const collisionRadius = sphere.radius + (projectile.size / 2);
                
                if (distance < collisionRadius) {
                    // Create player hit explosion
                    this.particleSystem.createPlayerHitExplosion(
                        sphere.x, sphere.y, projectile.color
                    );
                    
                    return true;
                }
            }
        }
        
        return false;
    }
    
    processCollisions(collisions) {
        const newShapes = [];
        const shapesToRemove = new Set();
        const projectilesToRemove = new Set();
        
        for (const collision of collisions) {
            this.collisionCount++;
            this.recordCollision(collision);
            
            if (collision.type === 'projectile-projectile') {
                // Handle projectile collision through mutation system
                const offspring = this.mutationSystem.handleShapeCollision(
                    collision.projectile1,
                    collision.projectile2,
                    collision.x,
                    collision.y
                );
                
                newShapes.push(...offspring);
                projectilesToRemove.add(collision.projectile1);
                projectilesToRemove.add(collision.projectile2);
                
            } else if (collision.type === 'shape-projectile') {
                // Shape gets destroyed by projectile
                this.createShapeDestroyedExplosion(collision.shape, collision.projectile);
                
                // Chance for shape to split before dying
                if (collision.shape.canSplit && Math.random() < 0.4) {
                    const splitOffspring = collision.shape.split();
                    newShapes.push(...splitOffspring);
                }
                
                shapesToRemove.add(collision.shape);
                projectilesToRemove.add(collision.projectile);
            }
        }
        
        return {
            newShapes,
            shapesToRemove,
            projectilesToRemove
        };
    }
    
    createShapeDestroyedExplosion(shape, projectile) {
        this.particleSystem.createExplosion(shape.x, shape.y, shape.dna.getColor(), {
            particleCount: 12,
            intensity: 0.8,
            colors: [shape.dna.getColor(), projectile.color]
        });
    }
    
    recordCollision(collision) {
        this.recentCollisions.push({
            timestamp: Date.now(),
            type: collision.type,
            location: { x: collision.x, y: collision.y },
            distance: collision.distance
        });
        
        // Keep only recent collisions (last 30 seconds)
        const cutoff = Date.now() - 30000;
        this.recentCollisions = this.recentCollisions.filter(
            c => c.timestamp > cutoff
        );
    }
    
    // Wall collision detection for projectiles
    checkWallCollisions(projectiles, canvasWidth, canvasHeight) {
        const wallHits = [];
        
        for (const projectile of projectiles) {
            const margin = 10;
            let hitWall = false;
            let wallType = '';
            
            if (projectile.x < margin) {
                hitWall = true;
                wallType = 'left';
            } else if (projectile.x > canvasWidth - margin) {
                hitWall = true;
                wallType = 'right';
            } else if (projectile.y < margin) {
                hitWall = true;
                wallType = 'top';
            } else if (projectile.y > canvasHeight - margin) {
                hitWall = true;
                wallType = 'bottom';
            }
            
            if (hitWall) {
                // Handle bouncing vs destruction based on DNA
                if (projectile.canBounce && !projectile.hasReattacked) {
                    this.handleWallBounce(projectile, wallType);
                } else {
                    wallHits.push({
                        projectile,
                        wallType,
                        x: projectile.x,
                        y: projectile.y
                    });
                }
            }
        }
        
        return wallHits;
    }
    
    handleWallBounce(projectile, wallType) {
        switch (wallType) {
            case 'left':
            case 'right':
                projectile.vx *= -0.8; // Lose some energy on bounce
                break;
            case 'top':
            case 'bottom':
                projectile.vy *= -0.8;
                break;
        }
        
        // Add some randomness to prevent infinite bouncing
        projectile.vx += (Math.random() - 0.5) * 0.5;
        projectile.vy += (Math.random() - 0.5) * 0.5;
        
        // Mark as bounced to prevent infinite bouncing
        projectile.hasReattacked = true;
        
        // Visual effect
        this.particleSystem.createBounceEffect(projectile.x, projectile.y, projectile.color);
    }
    
    // Get collision statistics for difficulty adjustment
    getCollisionStats() {
        const now = Date.now();
        const last10Seconds = this.recentCollisions.filter(
            c => now - c.timestamp < 10000
        );
        
        return {
            totalCollisions: this.collisionCount,
            recentCollisionRate: last10Seconds.length / 10, // Per second
            collisionTypes: this.getCollisionTypeBreakdown(last10Seconds),
            averageCollisionDistance: this.getAverageCollisionDistance(last10Seconds)
        };
    }
    
    getCollisionTypeBreakdown(collisions) {
        const breakdown = {};
        for (const collision of collisions) {
            breakdown[collision.type] = (breakdown[collision.type] || 0) + 1;
        }
        return breakdown;
    }
    
    getAverageCollisionDistance(collisions) {
        if (collisions.length === 0) return 0;
        
        const totalDistance = collisions.reduce((sum, c) => sum + (c.distance || 0), 0);
        return totalDistance / collisions.length;
    }
}