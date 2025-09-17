import { CONFIG } from '../utils/Config.js';
import { MathUtils } from '../utils/MathUtils.js';
import { ColorUtils } from '../utils/ColorUtils.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
        this.particlePool = [];
    }
    
    update(deltaTime) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (!this.updateParticle(particle, deltaTime)) {
                // Return to pool and remove
                this.returnToPool(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateParticle(particle, deltaTime) {
        particle.life--;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Apply particle-specific behaviors
        switch (particle.type) {
            case 'explosion':
                particle.vx *= 0.98;
                particle.vy *= 0.98;
                particle.size *= 0.99;
                break;
                
            case 'mutation':
                particle.rotation += particle.rotationSpeed;
                particle.hue = (particle.hue + 2) % 360;
                break;
                
            case 'fire':
                particle.vy -= 0.1; // Float upward
                particle.vx += (Math.random() - 0.5) * 0.2;
                particle.size *= 0.97;
                break;
                
            case 'electric':
                particle.vx += (Math.random() - 0.5) * 0.5;
                particle.vy += (Math.random() - 0.5) * 0.5;
                break;
                
            case 'trail':
                particle.vx *= 0.95;
                particle.vy *= 0.95;
                break;
        }
        
        return particle.life > 0;
    }
    
    createExplosion(x, y, color, options = {}) {
        const particleCount = options.particleCount || 15;
        const intensity = options.intensity || 1.0;
        const colors = options.colors || [color];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 4) * intensity;
            const size = (2 + Math.random() * 3) * intensity;
            const life = Math.floor((40 + Math.random() * 20) * intensity);
            
            const particle = this.getFromPool();
            particle.type = 'explosion';
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = size;
            particle.life = life;
            particle.maxLife = life;
            particle.color = MathUtils.randomChoice(colors);
            particle.alpha = 1.0;
            
            this.particles.push(particle);
        }
    }
    
    createMutationExplosion(x, y, color1, color2, options = {}) {
        const particleCount = options.particleCount || 20;
        const intensity = options.intensity || 1.2;
        const duration = options.duration || 60;
        
        // Create swirling mutation particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (1 + Math.random() * 3) * intensity;
            const spiralOffset = Math.random() * Math.PI * 2;
            
            const particle = this.getFromPool();
            particle.type = 'mutation';
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = 3 + Math.random() * 2;
            particle.life = duration;
            particle.maxLife = duration;
            particle.rotation = spiralOffset;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
            particle.hue = ColorUtils.parseColor(Math.random() < 0.5 ? color1 : color2)?.h || 0;
            particle.alpha = 1.0;
            
            this.particles.push(particle);
        }
        
        // Create central energy burst
        this.createEnergyBurst(x, y, ColorUtils.blendColors(color1, color2), {
            particleCount: 8,
            burstRadius: 30,
            intensity: intensity * 1.5
        });
    }
    
    createEvolutionExplosion(x, y, options = {}) {
        const particleCount = options.particleCount || 50;
        const colors = options.colors || ['#ff00ff', '#00ffff', '#ffff00'];
        const duration = options.duration || 120;
        const shockwaveRadius = options.shockwaveRadius || 100;
        
        // Central explosion
        this.createExplosion(x, y, '#ffffff', {
            particleCount: 25,
            intensity: 2.0,
            colors: colors
        });
        
        // Shockwave ring
        this.createShockwave(x, y, shockwaveRadius, colors[0]);
        
        // Spiral energy ribbons
        for (let spiral = 0; spiral < 3; spiral++) {
            this.createSpiralRibbon(x, y, spiral * (Math.PI * 2 / 3), colors[spiral], duration);
        }
    }
    
    createShockwave(x, y, radius, color) {
        const particleCount = Math.floor(radius / 5);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = radius;
            
            const particle = this.getFromPool();
            particle.type = 'shockwave';
            particle.x = x + Math.cos(angle) * distance;
            particle.y = y + Math.sin(angle) * distance;
            particle.vx = Math.cos(angle) * 2;
            particle.vy = Math.sin(angle) * 2;
            particle.size = 2;
            particle.life = 30;
            particle.maxLife = 30;
            particle.color = color;
            particle.alpha = 0.8;
            
            this.particles.push(particle);
        }
    }
    
    createSpiralRibbon(x, y, startAngle, color, duration) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const angle = startAngle + progress * Math.PI * 4;
            const radius = progress * 50;
            
            const particle = this.getFromPool();
            particle.type = 'spiral';
            particle.x = x + Math.cos(angle) * radius;
            particle.y = y + Math.sin(angle) * radius;
            particle.vx = Math.cos(angle + Math.PI/2) * 1;
            particle.vy = Math.sin(angle + Math.PI/2) * 1;
            particle.size = 3;
            particle.life = duration - (i * 3);
            particle.maxLife = duration;
            particle.color = color;
            particle.alpha = 1.0;
            
            this.particles.push(particle);
        }
    }
    
    createPlayerHitExplosion(x, y, projectileColor) {
        // Large dramatic explosion for player hits
        this.createExplosion(x, y, '#ff0000', {
            particleCount: 30,
            intensity: 2.5,
            colors: ['#ff0000', '#ff4400', '#ffff00', projectileColor]
        });
        
        // Screen flash particles
        for (let i = 0; i < 10; i++) {
            const particle = this.getFromPool();
            particle.type = 'flash';
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
            particle.size = 5 + Math.random() * 5;
            particle.life = 20;
            particle.maxLife = 20;
            particle.color = '#ffffff';
            particle.alpha = 1.0;
            
            this.particles.push(particle);
        }
    }
    
    createFireTrail(x, y, vx, vy, color) {
        const particle = this.getFromPool();
        particle.type = 'fire';
        particle.x = x + (Math.random() - 0.5) * 10;
        particle.y = y + (Math.random() - 0.5) * 10;
        particle.vx = vx * 0.1 + (Math.random() - 0.5) * 0.5;
        particle.vy = vy * 0.1 + (Math.random() - 0.5) * 0.5;
        particle.size = 2 + Math.random() * 2;
        particle.life = 30 + Math.random() * 20;
        particle.maxLife = 50;
        particle.color = color;
        particle.alpha = 0.8;
        
        this.particles.push(particle);
    }
    
    createElectricArc(x1, y1, x2, y2, color, intensity = 1.0) {
        const distance = MathUtils.distance(x1, y1, x2, y2);
        const segments = Math.floor(distance / 10);
        
        for (let i = 0; i <= segments; i++) {
            const progress = i / segments;
            const x = MathUtils.lerp(x1, x2, progress);
            const y = MathUtils.lerp(y1, y2, progress);
            
            // Add jaggedness
            const jitter = (Math.random() - 0.5) * 20 * intensity;
            const perpAngle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
            
            const particle = this.getFromPool();
            particle.type = 'electric';
            particle.x = x + Math.cos(perpAngle) * jitter;
            particle.y = y + Math.sin(perpAngle) * jitter;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.size = 1 + Math.random() * 2;
            particle.life = 10 + Math.random() * 10;
            particle.maxLife = 20;
            particle.color = color;
            particle.alpha = 0.8 * intensity;
            
            this.particles.push(particle);
        }
    }
    
    createBounceEffect(x, y, color) {
        this.createExplosion(x, y, color, {
            particleCount: 8,
            intensity: 0.6,
            colors: [color, '#ffffff']
        });
    }
    
    createEnergyBurst(x, y, color, options = {}) {
        const particleCount = options.particleCount || 12;
        const burstRadius = options.burstRadius || 20;
        const intensity = options.intensity || 1.0;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = burstRadius;
            
            const particle = this.getFromPool();
            particle.type = 'energy';
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * (distance / 10) * intensity;
            particle.vy = Math.sin(angle) * (distance / 10) * intensity;
            particle.size = 2 + Math.random() * 2;
            particle.life = 40;
            particle.maxLife = 40;
            particle.color = color;
            particle.alpha = 1.0;
            
            this.particles.push(particle);
        }
    }
    
    // Object pooling for performance
    getFromPool() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        
        return {
            type: 'explosion',
            x: 0, y: 0,
            vx: 0, vy: 0,
            size: 1,
            life: 0, maxLife: 0,
            color: '#ffffff',
            alpha: 1.0,
            rotation: 0,
            rotationSpeed: 0,
            hue: 0
        };
    }
    
    returnToPool(particle) {
        // Reset particle properties
        particle.type = 'explosion';
        particle.alpha = 1.0;
        particle.rotation = 0;
        particle.rotationSpeed = 0;
        particle.hue = 0;
        
        if (this.particlePool.length < 100) {
            this.particlePool.push(particle);
        }
    }
    
    render(ctx) {
        for (const particle of this.particles) {
            this.renderParticle(ctx, particle);
        }
    }
    
    renderParticle(ctx, particle) {
        const alpha = (particle.life / particle.maxLife) * particle.alpha;
        
        ctx.save();
        ctx.translate(particle.x, particle.y);
        
        if (particle.rotation) {
            ctx.rotate(particle.rotation);
        }
        
        ctx.globalAlpha = alpha;
        
        switch (particle.type) {
            case 'mutation':
                ctx.fillStyle = ColorUtils.hslString(particle.hue, 80, 60);
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.fillStyle;
                break;
                
            case 'fire':
                const fireHue = 15 + Math.random() * 45; // Orange to red
                ctx.fillStyle = ColorUtils.hslString(fireHue, 100, 50 + Math.random() * 30);
                ctx.shadowBlur = 8;
                ctx.shadowColor = ctx.fillStyle;
                break;
                
            case 'electric':
                ctx.fillStyle = particle.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = particle.color;
                break;
                
            default:
                ctx.fillStyle = particle.color;
                if (alpha > 0.5) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = particle.color;
                }
                break;
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    clear() {
        // Return all particles to pool
        for (const particle of this.particles) {
            this.returnToPool(particle);
        }
        this.particles = [];
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}