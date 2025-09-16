import { BaseShape } from '../BaseShape.js';

export class Plasma extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'plasma';
        this.energyLevel = 1.0;
        this.plasmaBlobCount = 4 + Math.floor(Math.random() * 4);
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        const result = super.update(deltaTime, orbitPlayer, audioManager);
        
        // Plasma energy fluctuation
        if (this.isFrequencyReactive && audioManager) {
            this.energyLevel = 0.5 + audioManager.currentAmplitude;
        } else {
            this.energyLevel = 0.7 + Math.sin(this.stateTime * 0.1) * 0.3;
        }
        
        return result;
    }
    
    renderShape(ctx, color) {
        ctx.globalAlpha = 0.8;
        
        // Plasma core
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size/2 * this.energyLevel);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, color.replace('hsl', 'hsla').replace(')', ', 0.5)'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2 * this.energyLevel, 0, Math.PI * 2);
        ctx.fill();
        
        // Plasma blobs orbiting around center
        for (let i = 0; i < this.plasmaBlobCount; i++) {
            const angle = (i / this.plasmaBlobCount) * Math.PI * 2 + (this.stateTime * 0.02);
            const distance = this.size * 0.3 * this.energyLevel;
            const blobX = Math.cos(angle) * distance;
            const blobY = Math.sin(angle) * distance;
            const blobSize = this.size * 0.15 * this.energyLevel;
            
            ctx.fillStyle = `hsl(${(this.dna.traits.get('colorHue') + i * 30) % 360}, 80%, 70%)`;
            ctx.beginPath();
            ctx.arc(blobX, blobY, blobSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Energy arcs between blobs
        if (this.energyLevel > 0.8) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            for (let i = 0; i < this.plasmaBlobCount; i++) {
                if (Math.random() < 0.3) {
                    const angle1 = (i / this.plasmaBlobCount) * Math.PI * 2 + (this.stateTime * 0.02);
                    const angle2 = ((i + 1) / this.plasmaBlobCount) * Math.PI * 2 + (this.stateTime * 0.02);
                    const distance = this.size * 0.3 * this.energyLevel;
                    
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle1) * distance, Math.sin(angle1) * distance);
                    ctx.lineTo(Math.cos(angle2) * distance, Math.sin(angle2) * distance);
                    ctx.stroke();
                }
            }
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
    }
}