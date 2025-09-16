import { BaseShape } from '../BaseShape.js';

export class Wave extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'wave';
        this.waveLength = this.size;
        this.amplitude = this.size * 0.3;
        this.frequency = 2 + Math.random() * 2;
        this.phase = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        const result = super.update(deltaTime, orbitPlayer, audioManager);
        
        // Audio-reactive wave properties
        if (this.isFrequencyReactive && audioManager) {
            this.amplitude = this.size * 0.2 + (audioManager.currentMids * this.size * 0.4);
            this.frequency = 1.5 + (audioManager.currentHighs * 3);
        }
        
        this.phase += 0.1;
        
        return result;
    }
    
    renderShape(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        
        const points = 50;
        const stepX = this.waveLength / points;
        
        // Main wave
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const x = (i - points/2) * stepX;
            const waveY = Math.sin((i / points) * Math.PI * 2 * this.frequency + this.phase) * this.amplitude;
            
            if (i === 0) {
                ctx.moveTo(x, waveY);
            } else {
                ctx.lineTo(x, waveY);
            }
        }
        ctx.stroke();
        
        // Secondary harmonics for evolved waves
        if (this.dna.generation > 2) {
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const x = (i - points/2) * stepX;
                const waveY = Math.sin((i / points) * Math.PI * 2 * this.frequency * 2 + this.phase) * this.amplitude * 0.5;
                
                if (i === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Wave particles for very evolved waves
        if (this.dna.generation > 4) {
            ctx.fillStyle = color;
            for (let i = 0; i < points; i += 5) {
                const x = (i - points/2) * stepX;
                const waveY = Math.sin((i / points) * Math.PI * 2 * this.frequency + this.phase) * this.amplitude;
                
                ctx.beginPath();
                ctx.arc(x, waveY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
    }
}