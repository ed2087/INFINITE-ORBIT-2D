import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';

export class PowerUpSystem {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.activePowerUps = [];
        this.cooldowns = new Map();
        this.availablePowerUps = [];
    }
    
    update(deltaTime, player, shapes, projectiles, audioManager) {
        this.updateActivePowerUps(deltaTime);
        this.updateAvailablePowerUps(deltaTime, player);
        this.applyPowerUpEffects(player, shapes, projectiles, audioManager);
    }
    
    updateActivePowerUps(deltaTime) {
        // Update active power-ups and remove expired ones
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            powerUp.timeRemaining--;
            
            if (powerUp.timeRemaining <= 0) {
                console.log(`🔋 Power-up expired: ${powerUp.type}`);
                this.activePowerUps.splice(i, 1);
            }
        }
        
        // Update cooldowns
        for (const [type, cooldown] of this.cooldowns.entries()) {
            if (cooldown > 0) {
                this.cooldowns.set(type, cooldown - 1);
            } else {
                this.cooldowns.delete(type);
            }
        }
    }
    
    updateAvailablePowerUps(deltaTime, player) {
        // Update available power-ups and remove expired ones
        for (let i = this.availablePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.availablePowerUps[i];
            powerUp.life--;
            
            if (powerUp.life <= 0) {
                this.availablePowerUps.splice(i, 1);
            }
        }
    }
    
    spawnPowerUp(x, y, audioManager) {
        if (Math.random() > CONFIG.POWERUPS.SPAWN_CHANCE) return;
        
        // Musical influence on power-up type
        let type = this.selectPowerUpType(audioManager);
        
        this.availablePowerUps.push({
            type: type,
            x: x,
            y: y,
            life: CONFIG.POWERUPS.LIFETIME,
            collected: false,
            pulsePhase: 0
        });
        
        console.log(`🔋 Power-up spawned: ${type} at ${x},${y}`);
    }
    
    selectPowerUpType(audioManager) {
        if (!audioManager) return MathUtils.randomChoice(Object.keys(CONFIG.POWERUPS.TYPES));
        
        // Musical bias for power-up selection
        const weights = {
            THUNDER_WAVE: 1.0 + (audioManager.currentBass * 2), // More likely during bass
            FIRE_SHIELD: 1.0 + (audioManager.currentMids * 1.5), // More likely during mids
            EMP_BLAST: 1.0 + (audioManager.currentHighs * 2), // More likely during highs
            TIME_SLOW: 1.0 + (audioManager.energyLevel * 0.3) // More likely during intense moments
        };
        
        return this.weightedRandomSelect(weights);
    }
    
    weightedRandomSelect(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        // Fallback
        return Object.keys(weights)[0];
    }
    
    isOnCooldown(type) {
        return this.cooldowns.has(type) && this.cooldowns.get(type) > 0;
    }
    
    checkCollisions(player) {
        for (let i = this.availablePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.availablePowerUps[i];
            const playerPositions = player.getSpherePositions();
            
            for (const sphere of playerPositions) {
                const distance = MathUtils.distance(powerUp.x, powerUp.y, sphere.x, sphere.y);
                if (distance < sphere.radius + 20) {
                    this.collectPowerUp(powerUp, i);
                    break;
                }
            }
        }
    }
    
    collectPowerUp(powerUp, index) {
        if (this.isOnCooldown(powerUp.type)) return;
        
        this.activatePowerUp(powerUp.type);
        this.availablePowerUps.splice(index, 1);
        
        // Visual feedback
        if (this.particleSystem.createPowerUpCollection) {
            this.particleSystem.createPowerUpCollection(powerUp.x, powerUp.y, powerUp.type);
        } else {
            // Fallback explosion effect
            this.particleSystem.createExplosion(powerUp.x, powerUp.y, '#00ff00', {
                particleCount: 15,
                intensity: 1.0
            });
        }
    }
    
    activatePowerUp(type) {
        const config = CONFIG.POWERUPS.TYPES[type];
        
        this.activePowerUps.push({
            type: type,
            timeRemaining: config.duration,
            maxDuration: config.duration
        });
        
        this.cooldowns.set(type, config.cooldown);
        console.log(`🔋 Power-up activated: ${type}`);
    }
    
    applyPowerUpEffects(player, shapes, projectiles, audioManager) {
        for (const powerUp of this.activePowerUps) {
            switch (powerUp.type) {
                case 'THUNDER_WAVE':
                    this.applyThunderWave(player, shapes, projectiles, powerUp);
                    break;
                case 'FIRE_SHIELD':
                    this.applyFireShield(player, powerUp);
                    break;
                case 'EMP_BLAST':
                    this.applyEMPBlast(shapes, projectiles, powerUp);
                    break;
                case 'TIME_SLOW':
                    this.applyTimeSlow(shapes, projectiles, powerUp);
                    break;
            }
        }
    }
    
    applyThunderWave(player, shapes, projectiles, powerUp) {
        if (powerUp.timeRemaining % 30 === 0) { // Every 0.5 seconds
            const playerPos = player.getSpherePositions()[0];
            const waveRadius = 100 + (powerUp.maxDuration - powerUp.timeRemaining) * 2;
            
            // Destroy projectiles in wave radius
            for (let i = projectiles.length - 1; i >= 0; i--) {
                const proj = projectiles[i];
                const distance = MathUtils.distance(playerPos.x, playerPos.y, proj.x, proj.y);
                if (distance < waveRadius) {
                    this.particleSystem.createExplosion(proj.x, proj.y, '#00ffff', {
                        particleCount: 8,
                        intensity: 0.6
                    });
                    projectiles.splice(i, 1);
                }
            }
            
            // Visual wave effect
            if (this.particleSystem.createThunderWave) {
                this.particleSystem.createThunderWave(playerPos.x, playerPos.y, waveRadius);
            } else {
                // Fallback visual effect
                this.particleSystem.createExplosion(playerPos.x, playerPos.y, '#00ffff', {
                    particleCount: 20,
                    intensity: 1.5
                });
            }
        }
    }
    
    applyFireShield(player, powerUp) {
        // Fire shield renders around player and destroys incoming projectiles
        player.fireShieldActive = true;
        player.fireShieldIntensity = powerUp.timeRemaining / powerUp.maxDuration;
    }
    
    applyEMPBlast(shapes, projectiles, powerUp) {
        if (powerUp.timeRemaining === powerUp.maxDuration - 1) { // First frame only
            // Disable all electronic shapes and slow all projectiles
            shapes.forEach(shape => {
                if (['gear', 'lightning', 'plasma', 'spinner'].includes(shape.shapeType)) {
                    shape.speed *= 0.3;
                    shape.aimDuration *= 3;
                    shape.empDisabled = true;
                }
            });
            
            projectiles.forEach(proj => {
                proj.vx *= 0.4;
                proj.vy *= 0.4;
                proj.empSlowed = true;
            });
        }
    }
    
    applyTimeSlow(shapes, projectiles, powerUp) {
        // Global time dilation effect
        const slowFactor = 0.5;
        shapes.forEach(shape => {
            if (!shape.timeSlowed) {
                shape.speed *= slowFactor;
                shape.rotationSpeed *= slowFactor;
                shape.timeSlowed = true;
            }
        });
        
        projectiles.forEach(proj => {
            if (!proj.timeSlowed) {
                proj.vx *= slowFactor;
                proj.vy *= slowFactor;
                proj.timeSlowed = true;
            }
        });
    }
    
    render(ctx) {
        // Render available power-ups
        for (const powerUp of this.availablePowerUps) {
            this.renderPowerUp(ctx, powerUp);
        }
        
        // Render active power-up UI indicators
        this.renderActivePowerUpIndicators(ctx);
    }
    
    renderPowerUp(ctx, powerUp) {
        powerUp.pulsePhase += 0.1;
        const pulse = Math.sin(powerUp.pulsePhase) * 0.3 + 0.7;
        const alpha = (powerUp.life / CONFIG.POWERUPS.LIFETIME) * 0.8;
        
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.globalAlpha = alpha;
        ctx.scale(pulse, pulse);
        
        // Power-up specific visuals
        const colors = {
            THUNDER_WAVE: '#00ffff',
            FIRE_SHIELD: '#ff4400',
            EMP_BLAST: '#ffff00',
            TIME_SLOW: '#8800ff'
        };
        
        const color = colors[powerUp.type] || '#ffffff';
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderActivePowerUpIndicators(ctx) {
        // Render UI indicators for active power-ups
        let yOffset = 10;
        
        for (const powerUp of this.activePowerUps) {
            const timePercent = powerUp.timeRemaining / powerUp.maxDuration;
            const alpha = 0.8;
            
            // Background bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(10, yOffset, 120, 20);
            
            // Power-up type indicator
            const colors = {
                THUNDER_WAVE: '#00ffff',
                FIRE_SHIELD: '#ff4400',
                EMP_BLAST: '#ffff00',
                TIME_SLOW: '#8800ff'
            };
            
            const color = colors[powerUp.type] || '#ffffff';
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(12, yOffset + 2, 116 * timePercent, 16);
            
            // Text label
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1;
            ctx.font = '12px Arial';
            ctx.fillText(powerUp.type.replace('_', ' '), 15, yOffset + 14);
            
            yOffset += 25;
        }
    }
    
    reset() {
        this.activePowerUps = [];
        this.cooldowns.clear();
        this.availablePowerUps = [];
    }
}