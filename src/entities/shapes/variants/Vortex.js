import { BaseShape } from '../BaseShape.js';

export class Vortex extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'vortex';
        this.armCount = 5;
        this.vortexSpeed = 0.05;
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        super.update(deltaTime, orbitPlayer, audioManager);
        
        // Audio-reactive vortex speed
        if (this.isFrequencyReactive && audioManager) {
            this.vortexSpeed = 0.05 + (audioManager.currentBass * 0.1);
        }
        
        return true;
    }
    
    renderShape(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // Draw spiral arms
        for (let arm = 0; arm < this.armCount; arm++) {
            const armOffset = (arm / this.armCount) * Math.PI * 2;
            ctx.beginPath();
            
            for (let i = 0; i < 50; i++) {
                const progress = i / 50;
                const angle = armOffset + (this.rotation * this.vortexSpeed) + (progress * Math.PI * 4);
                const radius = progress * this.size / 2;
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Center core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}