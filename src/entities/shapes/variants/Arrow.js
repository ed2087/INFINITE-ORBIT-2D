import { BaseShape } from '../BaseShape.js';

export class Arrow extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'arrow';
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const headWidth = this.size * 0.4;
        const headLength = this.size * 0.3;
        const shaftWidth = this.size * 0.15;
        
        ctx.beginPath();
        // Arrow head
        ctx.moveTo(this.size/2, 0);
        ctx.lineTo(this.size/2 - headLength, -headWidth/2);
        ctx.lineTo(this.size/2 - headLength, -shaftWidth/2);
        // Shaft
        ctx.lineTo(-this.size/2, -shaftWidth/2);
        ctx.lineTo(-this.size/2, shaftWidth/2);
        ctx.lineTo(this.size/2 - headLength, shaftWidth/2);
        ctx.lineTo(this.size/2 - headLength, headWidth/2);
        ctx.closePath();
        ctx.fill();
        
        if (this.beatPhase > 0.3) {
            ctx.stroke();
        }
    }
}