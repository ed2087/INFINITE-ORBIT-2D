import { BaseShape } from '../BaseShape.js';

export class Spinner extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'spinner';
        this.armCount = 3 + Math.floor(Math.random() * 3);
        this.spinSpeed = 0.1 + Math.random() * 0.1;
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        const result = super.update(deltaTime, orbitPlayer, audioManager);
        
        // Audio-reactive spin speed
        if (this.isBeatSynced && audioManager) {
            this.spinSpeed = 0.05 + (audioManager.getBeatStrength() * 0.3);
        }
        
        this.rotation += this.spinSpeed;
        
        return result;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        const armLength = this.size * 0.4;
        const armWidth = this.size * 0.1;
        
        // Draw spinner arms
        for (let i = 0; i < this.armCount; i++) {
            const angle = (i / this.armCount) * Math.PI * 2;
            
            ctx.save();
            ctx.rotate(angle);
            
            // Arm body
            ctx.fillRect(-armWidth/2, 0, armWidth, armLength);
            
            // Arm tip weight
            ctx.beginPath();
            ctx.arc(0, armLength, armWidth, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Center hub
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Motion blur effect when spinning fast
        if (this.spinSpeed > 0.2) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, armLength * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
}