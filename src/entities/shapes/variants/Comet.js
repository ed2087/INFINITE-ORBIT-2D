import { BaseShape } from '../BaseShape.js';

export class Comet extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'comet';
        this.trailPoints = [];
        this.maxTrailLength = 15;
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        const result = super.update(deltaTime, orbitPlayer, audioManager);
        
        // Update trail
        this.trailPoints.push({ x: this.x, y: this.y, life: this.maxTrailLength });
        
        // Age trail points
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].life--;
            if (this.trailPoints[i].life <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
        
        return result;
    }
    
    renderShape(ctx, color) {
        // Render trail first
        if (this.trailPoints.length > 1) {
            ctx.strokeStyle = color;
            ctx.lineCap = 'round';
            
            for (let i = 1; i < this.trailPoints.length; i++) {
                const alpha = this.trailPoints[i].life / this.maxTrailLength;
                const width = alpha * 6;
                
                ctx.globalAlpha = alpha * 0.6;
                ctx.lineWidth = width;
                
                ctx.beginPath();
                ctx.moveTo(
                    this.trailPoints[i-1].x - this.x, 
                    this.trailPoints[i-1].y - this.y
                );
                ctx.lineTo(
                    this.trailPoints[i].x - this.x, 
                    this.trailPoints[i].y - this.y
                );
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Comet head
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}