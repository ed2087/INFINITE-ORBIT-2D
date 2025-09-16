import { CONFIG } from '../../utils/Config.js';
import { MathUtils } from '../../utils/MathUtils.js';

export class OrbitPlayer {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Orbital center (fixed in screen center)
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        
        // Orbital properties
        this.orbitRadius = Math.min(canvasWidth, canvasHeight) * 0.15;
        this.angle = 0;
        this.baseRotationSpeed = 0.08;
        this.rotationSpeed = this.baseRotationSpeed;
        
        // Sphere properties
        this.sphereRadius = 12;
        this.sphereCount = 2; // Two spheres orbiting opposite each other
        
        // Player state
        this.isAlive = true;
        this.invulnerabilityTime = 0;
        this.maxInvulnerability = 60; // 1 second at 60fps
        
        // Visual effects
        this.trailPoints = [];
        this.maxTrailLength = 20;
        this.glowIntensity = 1.0;
        this.pulsePhase = 0;
        
        // Audio reactivity
        this.audioReactiveScale = 1.0;
        this.beatScale = 1.0;
        
        // Power-up effects
        this.powerUpEffects = new Set();
        this.shieldActive = false;
        this.speedBoostActive = false;
        
        // Controls
        this.inputState = {
            left: false,
            right: false,
            boost: false
        };
        
        // Performance tracking
        this.rotationHistory = [];
        this.lastDirectionChange = 0;
    }
    
    update(deltaTime, audioManager = null) {
        if (!this.isAlive) return;
        
        // Handle invulnerability frames
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime--;
        }
        
        // Update rotation based on input
        this.updateRotation(deltaTime);
        
        // Update audio-reactive effects
        this.updateAudioEffects(audioManager);
        
        // Update visual effects
        this.updateTrail();
        this.updatePulse();
        
        // Update power-up effects
        this.updatePowerUps();
        
        // Track performance for adaptive difficulty
        this.updatePerformanceTracking();
    }
    
    updateRotation(deltaTime) {
        let targetSpeed = this.baseRotationSpeed;
        
        // Apply input
        if (this.inputState.left && !this.inputState.right) {
            targetSpeed = -this.baseRotationSpeed;
        } else if (this.inputState.right && !this.inputState.left) {
            targetSpeed = this.baseRotationSpeed;
        } else {
            targetSpeed = 0; // No input or both pressed
        }
        
        // Apply speed boost
        if (this.speedBoostActive) {
            targetSpeed *= 1.5;
        }
        
        // Smooth rotation changes
        this.rotationSpeed = MathUtils.lerp(this.rotationSpeed, targetSpeed, 0.1);
        
        // Update angle
        this.angle += this.rotationSpeed;
        
        // Keep angle in valid range
        this.angle = MathUtils.normalizeAngle(this.angle);
        
        // Track direction changes for skill measurement
        if (Math.abs(this.rotationSpeed) > 0.01 && 
            Date.now() - this.lastDirectionChange > 500) {
            this.lastDirectionChange = Date.now();
        }
    }
    
    updateAudioEffects(audioManager) {
        if (!audioManager) {
            this.audioReactiveScale = 1.0;
            this.beatScale = 1.0;
            return;
        }
        
        // Scale based on audio amplitude
        this.audioReactiveScale = 1.0 + (audioManager.currentAmplitude * 0.2);
        
        // Beat-reactive scaling
        const beatStrength = audioManager.getBeatStrength();
        this.beatScale = 1.0 + (beatStrength * 0.3);
        
        // Frequency-reactive glow
        this.glowIntensity = 0.8 + (audioManager.currentAmplitude * 0.6);
        
        // Bass-reactive orbit size changes
        if (audioManager.currentBass > 0.7) {
            this.orbitRadius = Math.min(this.canvasWidth, this.canvasHeight) * (0.15 + audioManager.currentBass * 0.05);
        }
    }
    
    updateTrail() {
        // Add current positions to trail
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereAngle = this.angle + (i * Math.PI);
            const sphereX = this.centerX + Math.cos(sphereAngle) * this.orbitRadius;
            const sphereY = this.centerY + Math.sin(sphereAngle) * this.orbitRadius;
            
            if (!this.trailPoints[i]) {
                this.trailPoints[i] = [];
            }
            
            this.trailPoints[i].push({
                x: sphereX,
                y: sphereY,
                life: this.maxTrailLength,
                intensity: this.glowIntensity
            });
            
            // Age trail points
            for (let j = this.trailPoints[i].length - 1; j >= 0; j--) {
                this.trailPoints[i][j].life--;
                if (this.trailPoints[i][j].life <= 0) {
                    this.trailPoints[i].splice(j, 1);
                }
            }
            
            // Limit trail length
            if (this.trailPoints[i].length > this.maxTrailLength) {
                this.trailPoints[i].splice(0, this.trailPoints[i].length - this.maxTrailLength);
            }
        }
    }
    
    updatePulse() {
        this.pulsePhase += 0.05;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase = 0;
        }
    }
    
    updatePowerUps() {
        // Handle time-based power-up effects
        if (this.shieldActive) {
            this.powerUpEffects.add('shield');
        } else {
            this.powerUpEffects.delete('shield');
        }
        
        if (this.speedBoostActive) {
            this.powerUpEffects.add('speed');
        } else {
            this.powerUpEffects.delete('speed');
        }
    }
    
    updatePerformanceTracking() {
        const now = Date.now();
        this.rotationHistory.push({
            time: now,
            speed: Math.abs(this.rotationSpeed),
            angle: this.angle
        });
        
        // Keep only recent history (last 10 seconds)
        this.rotationHistory = this.rotationHistory.filter(
            record => now - record.time < 10000
        );
    }
    
    // Input handling
    setInput(left, right, boost = false) {
        this.inputState.left = left;
        this.inputState.right = right;
        this.inputState.boost = boost;
    }
    
    // Collision detection
    checkCollision(projectile) {
        if (!this.isAlive || this.invulnerabilityTime > 0) {
            return false;
        }
        
        // Check collision with each sphere
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereAngle = this.angle + (i * Math.PI);
            const sphereX = this.centerX + Math.cos(sphereAngle) * this.orbitRadius;
            const sphereY = this.centerY + Math.sin(sphereAngle) * this.orbitRadius;
            
            const distance = MathUtils.distance(sphereX, sphereY, projectile.x, projectile.y);
            const collisionRadius = this.sphereRadius + (projectile.size / 2);
            
            if (distance < collisionRadius) {
                return true;
            }
        }
        
        return false;
    }
    
    // Handle player death
    die() {
        if (!this.isAlive || this.invulnerabilityTime > 0) return false;
        
        // Shield power-up protection
        if (this.shieldActive) {
            this.shieldActive = false;
            this.invulnerabilityTime = this.maxInvulnerability;
            return false; // Survived due to shield
        }
        
        this.isAlive = false;
        return true;
    }
    
    // Power-up activation
    activateShield(duration = 300) { // 5 seconds at 60fps
        this.shieldActive = true;
        setTimeout(() => {
            this.shieldActive = false;
        }, duration * (1000/60));
    }
    
    activateSpeedBoost(duration = 180) { // 3 seconds at 60fps
        this.speedBoostActive = true;
        setTimeout(() => {
            this.speedBoostActive = false;
        }, duration * (1000/60));
    }
    
    // Rendering
    render(ctx, audioManager = null) {
        if (!this.isAlive) return;
        
        // Render trails first
        this.renderTrails(ctx);
        
        // Render orbit path
        this.renderOrbitPath(ctx);
        
        // Render connection line between spheres
        this.renderConnection(ctx);
        
        // Render spheres
        this.renderSpheres(ctx, audioManager);
        
        // Render power-up effects
        this.renderPowerUpEffects(ctx);
        
        // Render invulnerability effect
        if (this.invulnerabilityTime > 0) {
            this.renderInvulnerabilityEffect(ctx);
        }
    }
    
    renderTrails(ctx) {
        const trailColors = ['#4080ff', '#ff4080'];
        
        for (let sphereIndex = 0; sphereIndex < this.sphereCount; sphereIndex++) {
            const trail = this.trailPoints[sphereIndex];
            if (!trail || trail.length < 2) continue;
            
            ctx.strokeStyle = trailColors[sphereIndex];
            ctx.lineCap = 'round';
            
            for (let i = 1; i < trail.length; i++) {
                const alpha = (trail[i].life / this.maxTrailLength) * 0.8;
                const width = alpha * 4 * trail[i].intensity;
                
                ctx.globalAlpha = alpha;
                ctx.lineWidth = width;
                
                ctx.beginPath();
                ctx.moveTo(trail[i-1].x, trail[i-1].y);
                ctx.lineTo(trail[i].x, trail[i].y);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
    }
    
    renderOrbitPath(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]); // Reset line dash
        
        // Center point
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderConnection(ctx) {
        const sphere1Angle = this.angle;
        const sphere2Angle = this.angle + Math.PI;
        
        const sphere1X = this.centerX + Math.cos(sphere1Angle) * this.orbitRadius;
        const sphere1Y = this.centerY + Math.sin(sphere1Angle) * this.orbitRadius;
        const sphere2X = this.centerX + Math.cos(sphere2Angle) * this.orbitRadius;
        const sphere2Y = this.centerY + Math.sin(sphere2Angle) * this.orbitRadius;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(sphere1X, sphere1Y);
        ctx.lineTo(sphere2X, sphere2Y);
        ctx.stroke();
    }
    
    renderSpheres(ctx, audioManager) {
        const sphereColors = ['#4080ff', '#ff4080'];
        
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereAngle = this.angle + (i * Math.PI);
            const sphereX = this.centerX + Math.cos(sphereAngle) * this.orbitRadius;
            const sphereY = this.centerY + Math.sin(sphereAngle) * this.orbitRadius;
            
            // Calculate current sphere scale
            const currentScale = this.audioReactiveScale * this.beatScale;
            const currentRadius = this.sphereRadius * currentScale;
            
            // Sphere glow effect
            if (this.glowIntensity > 0.5) {
                ctx.shadowColor = sphereColors[i];
                ctx.shadowBlur = this.glowIntensity * 15;
            }
            
            // Main sphere gradient
            const gradient = ctx.createRadialGradient(
                sphereX - currentRadius * 0.3, sphereY - currentRadius * 0.3, 0,
                sphereX, sphereY, currentRadius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, sphereColors[i]);
            gradient.addColorStop(1, '#000000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sphereX, sphereY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Pulse effect
            const pulseIntensity = Math.sin(this.pulsePhase) * 0.3 + 0.7;
            ctx.strokeStyle = sphereColors[i];
            ctx.lineWidth = 2;
            ctx.globalAlpha = pulseIntensity;
            
            ctx.beginPath();
            ctx.arc(sphereX, sphereY, currentRadius + 5, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        }
    }
    
    renderPowerUpEffects(ctx) {
        if (this.powerUpEffects.has('shield')) {
            this.renderShieldEffect(ctx);
        }
        
        if (this.powerUpEffects.has('speed')) {
            this.renderSpeedEffect(ctx);
        }
    }
    
    renderShieldEffect(ctx) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6 + Math.sin(this.pulsePhase * 2) * 0.2;
        
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.orbitRadius + 20, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    renderSpeedEffect(ctx) {
        // Speed lines radiating from center
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startRadius = this.orbitRadius + 30;
            const endRadius = this.orbitRadius + 50;
            
            ctx.beginPath();
            ctx.moveTo(
                this.centerX + Math.cos(angle) * startRadius,
                this.centerY + Math.sin(angle) * startRadius
            );
            ctx.lineTo(
                this.centerX + Math.cos(angle) * endRadius,
                this.centerY + Math.sin(angle) * endRadius
            );
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }
    
    renderInvulnerabilityEffect(ctx) {
        // Flashing effect during invulnerability
        const flashRate = 10; // Flash every 10 frames
        if (Math.floor(this.invulnerabilityTime / flashRate) % 2 === 0) {
            ctx.globalAlpha = 0.5;
            
            // White overlay
            for (let i = 0; i < this.sphereCount; i++) {
                const sphereAngle = this.angle + (i * Math.PI);
                const sphereX = this.centerX + Math.cos(sphereAngle) * this.orbitRadius;
                const sphereY = this.centerY + Math.sin(sphereAngle) * this.orbitRadius;
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sphereX, sphereY, this.sphereRadius * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        }
    }
    
    // Resize handling
    resize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        this.centerX = newWidth / 2;
        this.centerY = newHeight / 2;
        this.orbitRadius = Math.min(newWidth, newHeight) * 0.15;
    }
    
    // Getter methods for game systems
    getSpherePositions() {
        const positions = [];
        for (let i = 0; i < this.sphereCount; i++) {
            const sphereAngle = this.angle + (i * Math.PI);
            positions.push({
                x: this.centerX + Math.cos(sphereAngle) * this.orbitRadius,
                y: this.centerY + Math.sin(sphereAngle) * this.orbitRadius,
                radius: this.sphereRadius
            });
        }
        return positions;
    }
    
    getPlayerSkillLevel() {
        if (this.rotationHistory.length < 10) return 1; // Default skill level
        
        // Calculate skill based on rotation patterns and reaction times
        const avgReactionSpeed = this.rotationHistory.reduce((sum, record) => 
            sum + record.speed, 0) / this.rotationHistory.length;
        
        const skillLevel = Math.min(avgReactionSpeed * 10, 5); // Scale 1-5
        return skillLevel;
    }
    
    // Reset for new game
    reset() {
        this.angle = 0;
        this.rotationSpeed = this.baseRotationSpeed;
        this.isAlive = true;
        this.invulnerabilityTime = 0;
        this.trailPoints = [];
        this.powerUpEffects.clear();
        this.shieldActive = false;
        this.speedBoostActive = false;
        this.rotationHistory = [];
        this.glowIntensity = 1.0;
        this.pulsePhase = 0;
    }
}