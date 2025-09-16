import { BaseShape } from '../BaseShape.js';

export class Diamond extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'diamond';
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -this.size/2);      // Top
        ctx.lineTo(this.size/2, 0);       // Right
        ctx.lineTo(0, this.size/2);       // Bottom
        ctx.lineTo(-this.size/2, 0);      // Left
        ctx.closePath();
        ctx.fill();
        
        // Inner diamond highlight
        if (this.dna.generation > 1) {
            ctx.fillStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
            ctx.beginPath();
            ctx.moveTo(0, -this.size/4);
            ctx.lineTo(this.size/4, 0);
            ctx.lineTo(0, this.size/4);
            ctx.lineTo(-this.size/4, 0);
            ctx.closePath();
            ctx.fill();
        }
        
        if (this.beatPhase > 0.5) {
            ctx.stroke();
        }
    }
}